// Core 3D engine: renderer, lighting, camera, labels, animation loop + shared
// helpers for building cell/tissue models. Every scene module receives a `ctx`
// built here and returns { update, dispose }.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createEngine(stageEl, labelsEl) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(stageEl.clientWidth, stageEl.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stageEl.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer({ element: labelsEl });
  labelRenderer.setSize(stageEl.clientWidth, stageEl.clientHeight);

  const scene = new THREE.Scene();

  // Gradient-ish background via fog + dark color; environment gives reflections.
  scene.background = new THREE.Color('#06170f');
  scene.fog = new THREE.FogExp2('#06170f', 0.028);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(48, stageEl.clientWidth / stageEl.clientHeight, 0.1, 200);
  camera.position.set(6, 4.2, 9);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.2;
  controls.maxDistance = 40;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;
  controls.target.set(0, 0.4, 0);

  // Lighting: hemisphere fill + key directional (shadows) + cool rim.
  const hemi = new THREE.HemisphereLight('#bff5d8', '#0b241a', 0.75);
  scene.add(hemi);

  const key = new THREE.DirectionalLight('#ffffff', 2.2);
  key.position.set(6, 11, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 45;
  key.shadow.camera.left = -14; key.shadow.camera.right = 14;
  key.shadow.camera.top = 14; key.shadow.camera.bottom = -14;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);

  const rim = new THREE.DirectionalLight('#4dd0e1', 0.9);
  rim.position.set(-8, 4, -6);
  scene.add(rim);

  const fillPoint = new THREE.PointLight('#38e08a', 0.5, 40);
  fillPoint.position.set(0, 3, 6);
  scene.add(fillPoint);

  // Soft ground shadow catcher.
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(60, 64),
    new THREE.ShadowMaterial({ opacity: 0.32 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -3.2;
  ground.receiveShadow = true;
  scene.add(ground);

  const clock = new THREE.Clock();
  let current = null;      // active scene instance { update, dispose }
  let sceneRoot = null;    // group holding current scene's objects
  let playing = true;
  let speed = 1;
  let simTime = 0;         // accumulated (speed-scaled) time

  function mount(sceneModule, onReady) {
    unmount();
    sceneRoot = new THREE.Group();
    scene.add(sceneRoot);
    const ctx = makeCtx(sceneRoot, controls, camera);
    current = sceneModule.build(ctx) || {};
    simTime = 0;
    if (onReady) onReady(sceneModule.meta || {}, ctx);
  }

  function unmount() {
    if (current && current.dispose) { try { current.dispose(); } catch (e) {} }
    if (sceneRoot) {
      scene.remove(sceneRoot);
      disposeObject(sceneRoot);
      sceneRoot = null;
    }
    current = null;
  }

  function makeCtx(root, controls, camera) {
    return { THREE, root, scene, controls, camera, renderer,
             addLabel, helpers };
  }

  // ---- render loop ----
  let rafId;
  function loop() {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (playing) simTime += dt * speed;
    controls.update();
    if (current && current.update) current.update(simTime, playing ? dt * speed : 0);
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  loop();

  function resize() {
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  // ---- labels ----
  function addLabel(target, html, opts = {}) {
    const el = document.createElement('div');
    el.className = 'cell-label' + (opts.animal ? ' animal' : '');
    el.innerHTML = html;
    const obj = new CSS2DObject(el);
    if (opts.offset) obj.position.copy(opts.offset);
    target.add(obj);
    return obj;
  }

  return {
    THREE, scene, camera, controls, renderer,
    mount, unmount,
    setPlaying: v => { playing = v; },
    isPlaying: () => playing,
    setSpeed: v => { speed = v; },
    getTime: () => simTime,
    setTime: t => { simTime = t; },
    resetTime: () => { simTime = 0; },
    setAutoRotate: v => { controls.autoRotate = v; },
    getAutoRotate: () => controls.autoRotate,
    frame: focusCamera,
    dispose: () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); unmount(); renderer.dispose(); }
  };

  function focusCamera(box, distFactor = 1.6) {
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * Math.PI / 180;
    const dist = (maxDim / 2 / Math.tan(fov / 2)) * distFactor;
    controls.target.copy(center);
    camera.position.set(center.x + dist * 0.7, center.y + dist * 0.5, center.z + dist);
  }
}

/* ------------------------------------------------------------------ */
/*  Shared model-building helpers used by all scenes                   */
/* ------------------------------------------------------------------ */
const _mat = {};
function mat(key, make) { return _mat[key] || (_mat[key] = make()); }

export const helpers = {
  THREE,

  // Translucent cytoplasm/cell-wall material.
  cellMaterial(color = '#7fe6a8', opts = {}) {
    return new THREE.MeshStandardMaterial({
      color, transparent: true, opacity: opts.opacity ?? 0.5,
      roughness: opts.roughness ?? 0.35, metalness: 0.0,
      transmission: 0, side: THREE.DoubleSide,
      emissive: new THREE.Color(color).multiplyScalar(0.12),
    });
  },

  wallMaterial(color = '#2f7a52', opts = {}) {
    return new THREE.MeshStandardMaterial({
      color, roughness: opts.roughness ?? 0.55, metalness: 0.05,
      transparent: opts.opacity != null, opacity: opts.opacity ?? 1,
      side: THREE.DoubleSide,
    });
  },

  nucleusMaterial(color = '#2b5cff') {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1,
      emissive: new THREE.Color(color).multiplyScalar(0.25) });
  },

  // A single plant cell: wall shell + translucent inner cytoplasm + nucleus.
  plantCell(THREE_, { size = 1, color = '#6fe0a0', wall = '#2f7a52', nucleus = true,
                       vacuole = false, shape = 'box', radius = 0.14 } = {}) {
    const g = new THREE.Group();
    let geo;
    if (shape === 'sphere') geo = new THREE.IcosahedronGeometry(size * 0.5, 3);
    else geo = roundedBox(size, size, size, radius);

    const inner = new THREE.Mesh(geo, helpers.cellMaterial(color, { opacity: 0.42 }));
    inner.castShadow = true; inner.receiveShadow = true;
    g.add(inner);

    // Wall as a slightly larger wireframe-ish shell edges.
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 25),
      new THREE.LineBasicMaterial({ color: wall, transparent: true, opacity: 0.85 })
    );
    edges.scale.setScalar(1.005);
    g.add(edges);

    if (vacuole) {
      const vac = new THREE.Mesh(
        new THREE.IcosahedronGeometry(size * 0.32, 2),
        new THREE.MeshStandardMaterial({ color: '#bff0ff', transparent: true, opacity: 0.28, roughness: 0.15 })
      );
      g.add(vac);
      g.userData.vacuole = vac;
    }
    if (nucleus) {
      const nuc = new THREE.Mesh(
        new THREE.IcosahedronGeometry(size * 0.16, 2),
        helpers.nucleusMaterial('#3a6bff')
      );
      nuc.position.set(size * (vacuole ? 0.22 : 0), size * (vacuole ? 0.18 : 0), 0);
      nuc.castShadow = true;
      g.add(nuc);
      g.userData.nucleus = nuc;
    }
    g.userData.inner = inner;
    return g;
  },

  roundedBox,
};

function roundedBox(w, h, d, r) {
  // Uses a slightly rounded box via three's built-in if available; fallback box.
  const shape = new THREE.Shape();
  const eps = 0.00001;
  const width = w, height = h;
  const x = -width / 2, y = -height / 2;
  const radius = Math.min(r, w / 2 - eps, h / 2 - eps);
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
  shape.absarc(x + width - radius, y + radius, radius, Math.PI * 1.5, 0);
  shape.absarc(x + width - radius, y + height - radius, radius, 0, Math.PI * 0.5);
  shape.absarc(x + radius, y + height - radius, radius, Math.PI * 0.5, Math.PI);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d - 2 * Math.min(radius, d / 2), bevelEnabled: true,
    bevelThickness: Math.min(radius, d / 2), bevelSize: Math.min(radius, d / 2),
    bevelSegments: 4, curveSegments: 8,
  });
  geo.translate(0, 0, -d / 2 + Math.min(radius, d / 2));
  geo.computeVertexNormals();
  return geo;
}

function disposeObject(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => { for (const k in m) { if (m[k] && m[k].isTexture) m[k].dispose(); } m.dispose(); });
    }
    if (o.isCSS2DObject && o.element && o.element.parentNode) o.element.parentNode.removeChild(o.element);
  });
}

// small shared easing
export const ease = {
  inOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  pulse: (t, period = 1) => 0.5 - 0.5 * Math.cos((t / period) * Math.PI * 2),
};

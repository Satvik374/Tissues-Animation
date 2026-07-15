import * as THREE from 'three';
import { protoMat, edgeLines, solidMat, ease, ping } from './_util.js';

export const meta = {
  title: 'Epidermis & Stomata',
  subtitle: 'Protective skin with breathing pores',
  period: 14,
  description: 'The epidermis is the <b>outermost, one-cell-thick protective layer</b> over the whole plant. In aerial parts it is coated with a waterproof waxy <b>cuticle</b> that reduces water loss. In leaves it carries tiny pores called <b>stomata</b>, each guarded by two bean-shaped <b>guard cells</b> that open and close the pore to control gas exchange and transpiration.',
  facts: [
    'Single layer of living cells; <b>protective</b> in function.',
    'Waxy <b>cuticle</b> checks water loss (transpiration).',
    '<b>Stomata</b> = pores for gas exchange in photosynthesis &amp; respiration.',
    'Two <b>guard cells</b> swell (turgid) to open, and shrink to close the pore.',
  ],
  steps: [
    { title: 'A sheet of epidermal cells', text: 'Interlocking, tile-like cells form a continuous protective skin.' },
    { title: 'Guard cells around a pore', text: 'Two bean-shaped guard cells surround a stoma (the central opening).' },
    { title: 'Stoma opens', text: 'Water enters the guard cells; they swell and bow apart — the pore opens for CO₂/O₂.' },
    { title: 'Stoma closes', text: 'Guard cells lose water and straighten, sealing the pore to save water.' },
  ],
};

export function build(ctx) {
  const { root } = ctx;
  const group = new THREE.Group();
  root.add(group);

  // ---- pavement epidermal cells (wavy interlocking) as a base slab ----
  const epiMat = protoMat('#a9e9c4', 0.55, 0.4);
  const wallMat = new THREE.LineBasicMaterial({ color: '#3aa066', transparent: true, opacity: 0.6 });
  const slab = new THREE.Group();
  const rng = (n) => (Math.sin(n * 127.1) * 43758.5) % 1;
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      if (i === 0 && j === 0) continue; // leave centre for stoma
      const w = 1.15 + (Math.abs(rng(i * 3 + j)) * 0.3);
      const geo = new THREE.BoxGeometry(w, 0.35, 1.15);
      const m = new THREE.Mesh(geo, epiMat);
      m.receiveShadow = true; m.castShadow = true;
      m.position.set(i * 1.25, 0, j * 1.25);
      m.rotation.y = rng(i + j * 5) * 0.15;
      slab.add(m);
      slab.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), wallMat).translateX(i * 1.25).translateZ(j * 1.25));
    }
  }
  group.add(slab);

  // cuticle sheen layer
  const cuticle = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.06, 6.2),
    new THREE.MeshPhysicalMaterial({ color: '#dffff0', transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0, clearcoat: 1 }));
  cuticle.position.y = 0.24;
  group.add(cuticle);
  ctx.addLabel(cuticle, '<b>Cuticle</b> (waxy)', { offset: new THREE.Vector3(2.2, 0.2, -2.2) });

  // ---- guard cells (two crescents) around central pore ----
  const guardMat = protoMat('#4fd07f', 0.72, 0.35);
  guardMat.emissive = new THREE.Color('#1c6e3a'); guardMat.emissiveIntensity = 0.5;
  function makeGuard(sign) {
    // torus-half bent as a bean
    const g = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.2, 16, 40, Math.PI), guardMat);
    g.rotation.x = Math.PI / 2;
    g.castShadow = true;
    const holder = new THREE.Group();
    holder.add(g);
    holder.userData.arc = g;
    return holder;
  }
  const stoma = new THREE.Group();
  stoma.position.y = 0.18;
  const gA = makeGuard(1), gB = makeGuard(-1);
  gB.rotation.y = Math.PI;
  stoma.add(gA, gB);

  // chloroplasts in guard cells (they have them, unlike other epidermal cells)
  const chMat = new THREE.MeshStandardMaterial({ color: '#2fbf63', emissive: '#0d5127', emissiveIntensity: 0.7, roughness: 0.4 });
  [gA, gB].forEach((g, gi) => {
    for (let k = 0; k < 4; k++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), chMat);
      const a = (k / 4) * Math.PI - Math.PI / 2 + (gi ? Math.PI : 0);
      c.position.set(Math.cos(a) * 0.62, 0.02, Math.sin(a) * 0.62 * (gi ? -1 : 1));
      g.add(c);
    }
  });

  // the pore opening (dark) beneath
  const pore = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24),
    new THREE.MeshBasicMaterial({ color: '#04150d' }));
  pore.rotation.x = -Math.PI / 2; pore.position.y = 0.02;
  stoma.add(pore);
  group.add(stoma);

  ctx.addLabel(stoma, '<b>Guard cells</b>', { offset: new THREE.Vector3(1.1, 0.5, 0) });
  ctx.addLabel(pore, '<b>Stoma</b> (pore)', { offset: new THREE.Vector3(0, 0.2, -0.9) });
  ctx.addLabel(slab.children[0], 'Epidermal cell', { offset: new THREE.Vector3(0, 0.5, 0) });

  ctx.controls.target.set(0, 0.1, 0);
  ctx.camera.position.set(3.5, 4.2, 5.5);

  return {
    update(t) {
      const period = meta.period;
      const p = (t % period) / period;
      // open during first half, close during second half
      let open;
      if (p < 0.5) open = ease.inOut(p / 0.5);
      else open = 1 - ease.inOut((p - 0.5) / 0.5);

      // guard cells bow apart: move along X and swell
      const gap = 0.05 + open * 0.42;
      gA.position.x = gap; gB.position.x = -gap;
      const swell = 1 + open * 0.28;
      gA.userData.arc.scale.set(swell, swell, 1 + open * 0.15);
      gB.userData.arc.scale.set(swell, swell, 1 + open * 0.15);
      // curve them more when open
      gA.userData.arc.scale.z = 0.85 + open * 0.5;
      gB.userData.arc.scale.z = 0.85 + open * 0.5;
      pore.scale.set(0.3 + open * 1.6, 1, 0.3 + open * 0.5);

      group.rotation.y = Math.sin(t * 0.12) * 0.25;
    },
    dispose() {}
  };
}

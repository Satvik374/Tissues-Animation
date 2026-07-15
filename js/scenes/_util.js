// Reusable building blocks shared across tissue scenes.
import * as THREE from 'three';

export function roundedBoxGeo(w, h, d, r, seg = 4) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  const radius = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4);
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
  shape.absarc(x + w - radius, y + radius, radius, Math.PI * 1.5, 0);
  shape.absarc(x + w - radius, y + h - radius, radius, 0, Math.PI * 0.5);
  shape.absarc(x + radius, y + h - radius, radius, Math.PI * 0.5, Math.PI);
  const dr = Math.min(radius, d / 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d - 2 * dr, bevelEnabled: true, bevelThickness: dr, bevelSize: dr,
    bevelSegments: seg, curveSegments: 10,
  });
  geo.translate(0, 0, -d / 2 + dr);
  geo.computeVertexNormals();
  return geo;
}

// Translucent protoplasm with soft emissive so cells read clearly on dark bg.
export function protoMat(color, opacity = 0.42, rough = 0.3) {
  return new THREE.MeshStandardMaterial({
    color, transparent: true, opacity, roughness: rough, metalness: 0,
    emissive: new THREE.Color(color).multiplyScalar(0.14),
    side: THREE.DoubleSide, depthWrite: false,
  });
}

export function solidMat(color, rough = 0.5, metal = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}

export function edgeLines(geo, color, opacity = 0.85, thresh = 20) {
  const e = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, thresh),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  return e;
}

// A small labelled organelle sphere.
export function organelle(radius, color, emissive = 0.25) {
  const m = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 3),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1,
      emissive: new THREE.Color(color).multiplyScalar(emissive) })
  );
  m.castShadow = true;
  return m;
}

// Stream of instanced particles flowing along +Y between yMin..yMax inside radius.
export function makeFlow({ count = 60, radius = 0.35, yMin = -2, yMax = 2, color = '#7fd4ff',
                           size = 0.09, speed = 1, jitter = 0.7 } = {}) {
  const geo = new THREE.SphereGeometry(size, 10, 10);
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9,
    roughness: 0.2, metalness: 0 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      a: Math.random() * Math.PI * 2,
      r: Math.sqrt(Math.random()) * radius,
      y: yMin + Math.random() * (yMax - yMin),
      v: (0.6 + Math.random() * 0.8) * speed,
      wob: Math.random() * Math.PI * 2,
    });
  }
  const dummy = new THREE.Object3D();
  const span = yMax - yMin;
  mesh.userData.update = (dt, dir = 1) => {
    for (let i = 0; i < count; i++) {
      const p = data[i];
      p.y += p.v * dt * dir;
      if (dir > 0 && p.y > yMax) p.y = yMin + (p.y - yMax) % span;
      if (dir < 0 && p.y < yMin) p.y = yMax - (yMin - p.y) % span;
      p.wob += dt * 2;
      const wob = Math.sin(p.wob) * 0.04 * jitter;
      dummy.position.set(Math.cos(p.a) * p.r + wob, p.y, Math.sin(p.a) * p.r + wob);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return mesh;
}

// Ring/annular or spiral thickening bands around a tube of given radius/height.
export function thickeningBands(radius, height, { type = 'spiral', color = '#c98a3a',
                                                  turns = 6, tube = 0.05 } = {}) {
  const g = new THREE.Group();
  const mat = solidMat(color, 0.5, 0.1);
  if (type === 'spiral') {
    const pts = [];
    const segs = 160;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const ang = t * Math.PI * 2 * turns;
      pts.push(new THREE.Vector3(Math.cos(ang) * radius, -height / 2 + t * height, Math.sin(ang) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 260, tube, 8, false), mat));
  } else { // annular rings
    const rings = Math.round(turns);
    for (let i = 0; i < rings; i++) {
      const y = -height / 2 + (i + 0.5) / rings * height;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 40), mat);
      ring.rotation.x = Math.PI / 2; ring.position.y = y;
      g.add(ring);
    }
  }
  return g;
}

export const ease = {
  inOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t,
};

// loop a value 0..1..0
export function ping(t, period) {
  const p = (t % period) / period;
  return p < 0.5 ? p * 2 : 2 - p * 2;
}

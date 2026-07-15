import * as THREE from 'three';
import { solidMat, protoMat, makeFlow } from './_util.js';

export const meta = {
  title: 'Phloem',
  subtitle: 'Food-conducting sieve tubes',
  period: 16,
  description: 'Phloem is the <b>living</b> complex tissue that transports <b>food (sucrose)</b> made in the leaves to storage and growing parts — in <b>both directions</b>. Its four elements are: <b>sieve tubes</b> (conducting, joined by perforated <b>sieve plates</b>), <b>companion cells</b> (control the sieve tubes), <b>phloem parenchyma</b> (storage) and <b>phloem fibres</b> (support — jute, hemp, flax).',
  facts: [
    '<b>Sieve tubes</b>: tubular living cells with perforated <b>sieve plates</b> at their ends.',
    'Mature sieve cells lose their nucleus — the <b>companion cell</b> keeps them alive.',
    'Transports <b>food (sucrose)</b> from leaves to the whole plant.',
    'Only <b>phloem fibres</b> are dead; they give mechanical strength.',
  ],
  steps: [
    { title: 'A sieve tube', text: 'Sieve-tube cells stack into a vertical channel that carries food.' },
    { title: 'Sieve plates', text: 'Perforated end walls (sieve plates) let sap pass from cell to cell.' },
    { title: 'Companion cells', text: 'A companion cell (with its nucleus) sits alongside and keeps the sieve tube working.' },
    { title: 'Food flows', text: 'Sugary sap (amber) streams through the sieve plates to feed the plant.' },
  ],
};

export function build(ctx) {
  const { root } = ctx;
  const group = new THREE.Group();
  root.add(group);

  const R = 0.62, segH = 1.5, nSeg = 4;
  const totalH = segH * nSeg;
  const sieveGroup = new THREE.Group();
  group.add(sieveGroup);

  const wallMat = new THREE.MeshPhysicalMaterial({ color: '#d9e8a0', transparent: true, opacity: 0.24,
    roughness: 0.25, metalness: 0, side: THREE.DoubleSide, transmission: 0.3 });

  // sieve-tube segments with sieve plates between
  const plates = [];
  for (let i = 0; i < nSeg; i++) {
    const y = -totalH / 2 + segH * (i + 0.5);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(R, R, segH * 0.94, 28, 1, true), wallMat);
    seg.position.y = y;
    sieveGroup.add(seg);
    // sieve plate at top of each segment (perforated disc)
    if (i < nSeg) {
      const plate = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.08, 28),
        solidMat('#b7c96a', 0.5, 0.05));
      plate.add(disc);
      // holes (pores) as small dark cylinders
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const rr = R * 0.5 * (k % 2 ? 0.5 : 1);
        const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 10),
          new THREE.MeshBasicMaterial({ color: '#3d4a12' }));
        hole.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr);
        plate.add(hole);
      }
      const centerHole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 10), new THREE.MeshBasicMaterial({ color: '#3d4a12' }));
      plate.add(centerHole);
      plate.position.y = y + segH / 2;
      sieveGroup.add(plate);
      plates.push(plate);
    }
  }

  // amber food flow
  const flow = makeFlow({ count: 54, radius: R * 0.72, yMin: -totalH / 2, yMax: totalH / 2,
    color: '#ffcf5a', size: 0.09, speed: 1.0 });
  sieveGroup.add(flow);

  // companion cell alongside (thin, with nucleus)
  const comp = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, totalH * 0.8, 16),
    protoMat('#9be8b6', 0.55, 0.35));
  comp.position.set(R + 0.35, 0, 0);
  sieveGroup.add(comp);
  const cnuc = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16),
    new THREE.MeshStandardMaterial({ color: '#3a6bff', emissive: '#12246e', emissiveIntensity: 0.45 }));
  cnuc.position.set(R + 0.35, 0.6, 0.05);
  sieveGroup.add(cnuc);

  // phloem parenchyma cell + fibre
  const par = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 2), protoMat('#8bf0b4', 0.5));
  par.position.set(-R - 0.6, -1.0, 0.2);
  sieveGroup.add(par);
  const fibre = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.03, totalH * 0.7, 10), solidMat('#caa25a', 0.6));
  fibre.position.set(-R - 0.6, 0.8, -0.1);
  sieveGroup.add(fibre);

  ctx.addLabel(plates[1] || sieveGroup, '<b>Sieve plate</b> (pores)', { offset: new THREE.Vector3(0.9, 0, 0) });
  ctx.addLabel(cnuc, '<b>Companion cell</b>', { offset: new THREE.Vector3(0.7, 0.2, 0) });
  ctx.addLabel(flow, '<b>Food (sucrose) ↓</b>', { offset: new THREE.Vector3(-0.9, 1.8, 0) });
  ctx.addLabel(par, 'Phloem parenchyma', { offset: new THREE.Vector3(-0.4, -0.6, 0) });
  ctx.addLabel(fibre, 'Phloem fibre', { offset: new THREE.Vector3(-0.5, 1.6, 0) });

  ctx.controls.target.set(0, 0, 0);
  ctx.camera.position.set(2.8, 1.5, 9);

  return {
    update(t, dt) {
      // food translocates downward (source→sink)
      flow.userData.update(dt, -1);
      // pulse the sieve plate pores subtly
      const glow = 0.5 + 0.5 * Math.sin(t * 3);
      group.rotation.y = Math.sin(t * 0.1) * 0.25;
    },
    dispose() {}
  };
}

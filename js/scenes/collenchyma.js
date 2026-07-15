import * as THREE from 'three';
import { protoMat, edgeLines, organelle, roundedBoxGeo, ping, ease } from './_util.js';

export const meta = {
  title: 'Collenchyma',
  subtitle: 'Flexible support, thickened at the corners',
  period: 14,
  description: 'Collenchyma is a <b>living</b> supporting tissue derived from parenchyma. Its cells are elongated with the <b>primary wall thickened only at the corners</b> by extra cellulose &amp; <b>pectin</b>. This gives young dicot stems and leaf-stalks <b>mechanical support with flexibility</b> — they can bend without breaking. Collenchyma is <b>absent in monocot stems</b>.',
  facts: [
    'Living, elongated cells; polygonal in cross-section.',
    'Extra thickening of <b>cellulose + pectin at the corners</b>.',
    'Provides <b>support + elasticity</b> to bending stems &amp; petioles.',
    'Found below the epidermis (hypodermis) of herbaceous dicots.',
  ],
  steps: [
    { title: 'Cross-section', text: 'Polygonal living cells sit packed together with little gaps.' },
    { title: 'Corner thickening', text: 'Watch the extra wall material (orange) build up only at the corners.' },
    { title: 'Bend without breaking', text: 'Because it is living and flexible, the tissue bends like a young stem in wind…' },
    { title: '…and springs back', text: 'Collenchyma gives support while still allowing growth and movement.' },
  ],
};

export function build(ctx) {
  const { root } = ctx;
  const group = new THREE.Group();
  const bendGroup = new THREE.Group(); // holds cells so we can bend them
  group.add(bendGroup);
  root.add(group);

  // hexagonal-ish packed cells in a plane (cross section), extruded in Z.
  const cells = [];
  const cols = 4, rows = 3, sp = 1.15;
  const geo = roundedBoxGeo(1.0, 1.0, 1.8, 0.16);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = new THREE.Group();
      const inner = new THREE.Mesh(geo, protoMat('#9be8b6', 0.4, 0.3));
      inner.castShadow = true; inner.receiveShadow = true;
      cell.add(inner);
      cell.add(edgeLines(geo, '#3aa066', 0.5, 15));
      const nuc = organelle(0.12, '#3a6bff', 0.3);
      nuc.position.set(0.2, 0, 0.3);
      cell.add(nuc);
      const offset = (r % 2) * sp * 0.5;
      cell.position.set((c - (cols - 1) / 2) * sp + offset, (r - (rows - 1) / 2) * sp, 0);
      cell.userData.baseY = cell.position.y;
      cell.userData.baseX = cell.position.x;
      bendGroup.add(cell);
      cells.push(cell);
    }
  }

  // Corner thickenings: spheres nestled where cells meet.
  const thickMat = new THREE.MeshStandardMaterial({ color: '#e59a3c', roughness: 0.5, emissive: '#5a3410', emissiveIntensity: 0.3 });
  const corners = [];
  const cornerPts = new Set();
  cells.forEach(cell => {
    const bx = cell.userData.baseX, by = cell.userData.baseY;
    [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]].forEach(([dx, dy]) => {
      const px = +(bx + dx * 1.0).toFixed(2);
      const py = +(by + dy * 1.0).toFixed(2);
      const key = px + ',' + py;
      if (cornerPts.has(key)) return; cornerPts.add(key);
      for (let z = -1; z <= 1; z += 2) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 2), thickMat);
        m.position.set(px, py, z * 0.75);
        m.castShadow = true;
        bendGroup.add(m);
        corners.push(m);
      }
    });
  });

  ctx.addLabel(corners[Math.floor(corners.length / 2)] || bendGroup,
    '<b>Corner thickening</b> (cellulose + pectin)', { offset: new THREE.Vector3(0, 0.5, 0) });
  ctx.addLabel(cells[cells.length - 1], 'Living cell', { offset: new THREE.Vector3(0, 0.75, 0) });

  ctx.controls.target.set(0, 0, 0);
  ctx.camera.position.set(3.5, 2.2, 7.5);

  return {
    update(t) {
      const period = meta.period;
      const p = (t % period) / period;

      // corner thickening grows in during 0.25..0.55
      let grow = 0;
      if (p < 0.25) grow = 0;
      else if (p < 0.55) grow = ease.out((p - 0.25) / 0.3);
      else grow = 1;
      corners.forEach(m => m.scale.setScalar(0.05 + grow * 0.95));

      // bending during 0.6..1.0
      let bend = 0;
      if (p >= 0.6) bend = Math.sin(((p - 0.6) / 0.4) * Math.PI) ; // 0->1->0
      const amp = 0.35 * bend;
      cells.forEach(cell => {
        const yn = cell.userData.baseY;
        cell.rotation.z = -amp * (yn / 1.5) * 0.6;
        cell.position.x = cell.userData.baseX + Math.sin(yn * 0.5) * amp * 0.2 + amp * (yn + 1.5) * 0.25;
      });
      group.rotation.y = Math.sin(t * 0.12) * 0.15;
    },
    dispose() {}
  };
}

import * as THREE from 'three';
import { solidMat, edgeLines, ping } from './_util.js';

export const meta = {
  title: 'Cork (Phellem)',
  subtitle: 'Dead, waterproof bark cells',
  period: 12,
  description: 'In old dicot stems and roots, the outer protective cells become <b>cork</b>. Cork cells are <b>dead and closely packed</b> with no intercellular spaces. Their thick walls are deposited with a waterproof waxy substance called <b>suberin</b>, making them impervious to water and gases. Cork protects the plant and has <b>lenticels</b> for aeration; it is the bottle cork we use.',
  facts: [
    'Cells are <b>dead</b>, brick-like and closely packed (no gaps).',
    'Walls deposited with waterproof <b>suberin</b>.',
    'Impervious to water &amp; air → protection from injury and infection.',
    '<b>Lenticels</b> on the surface allow aeration of inner tissues.',
    'Commercial cork comes from <i>Quercus suber</i>.',
  ],
  steps: [
    { title: 'Brick-wall packing', text: 'Dead cork cells stack in tight offset rows, like a brick wall — no gaps.' },
    { title: 'Suberin deposits', text: 'Waterproof suberin (amber) coats the walls, sealing the cells.' },
    { title: 'A waterproof barrier', text: 'Water droplets hit the surface and roll off — nothing gets through.' },
    { title: 'Lenticels breathe', text: 'Small pores called lenticels let the living tissue underneath get air.' },
  ],
};

export function build(ctx) {
  const { root } = ctx;
  const group = new THREE.Group();
  root.add(group);

  const wallMat = solidMat('#7a4a24', 0.7, 0.05);
  const suberinMat = new THREE.MeshStandardMaterial({ color: '#d59a4a', roughness: 0.55, metalness: 0.05, emissive: '#3a2208', emissiveIntensity: 0.25 });

  const bricks = [];
  const nx = 5, ny = 4, nz = 2;
  const bw = 1.2, bh = 0.7, bd = 1.2, m = 0.05;
  const bgeo = new THREE.BoxGeometry(bw, bh, bd);
  for (let y = 0; y < ny; y++) {
    const offset = (y % 2) * (bw / 2);
    for (let x = 0; x < nx; x++) {
      for (let z = 0; z < nz; z++) {
        const cell = new THREE.Group();
        const inner = new THREE.Mesh(bgeo, wallMat.clone());
        inner.castShadow = true; inner.receiveShadow = true;
        cell.add(inner);
        // suberin coating (slightly larger shell, starts invisible)
        const coat = new THREE.Mesh(bgeo, suberinMat.clone());
        coat.scale.setScalar(1.0);
        coat.material.transparent = true; coat.material.opacity = 0;
        cell.add(coat);
        cell.add(edgeLines(bgeo, '#2a1608', 0.7));
        cell.position.set(
          (x - (nx - 1) / 2) * (bw + m) + offset - bw / 4,
          (y - (ny - 1) / 2) * (bh + m),
          (z - (nz - 1) / 2) * (bd + m)
        );
        group.add(cell);
        bricks.push({ inner, coat });
      }
    }
  }

  // water droplets that roll off the top (waterproof demo)
  const dropMat = new THREE.MeshPhysicalMaterial({ color: '#6cc6ff', roughness: 0.05, metalness: 0, transmission: 0.6, transparent: true, opacity: 0.85, ior: 1.33 });
  const drops = [];
  for (let i = 0; i < 8; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), dropMat);
    d.userData = { x: (Math.random() - 0.5) * 4.5, z: (Math.random() - 0.5) * 1.5, ph: Math.random() };
    group.add(d);
    drops.push(d);
  }

  // lenticel: a small gap/pore
  const lent = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.4, 16),
    new THREE.MeshStandardMaterial({ color: '#2a1608', roughness: 0.9 }));
  lent.position.set(0.3, (ny - 1) / 2 * (bh + m) + 0.02, (nz) / 2 * (bd + m));
  lent.rotation.x = Math.PI / 2 * 0.15;
  group.add(lent);
  ctx.addLabel(lent, '<b>Lenticel</b> (aeration)', { offset: new THREE.Vector3(0.4, 0.4, 0.4) });
  ctx.addLabel(bricks[0].inner, 'Dead cork cell', { offset: new THREE.Vector3(0, 0.6, 0) });

  const topY = (ny - 1) / 2 * (bh + m) + bh / 2;

  ctx.controls.target.set(0, 0, 0);
  ctx.camera.position.set(4, 3, 7.5);

  return {
    update(t, dt) {
      const period = meta.period;
      const p = (t % period) / period;

      // suberin coats during 0.25..0.5
      let s = 0;
      if (p < 0.25) s = 0;
      else if (p < 0.5) s = (p - 0.25) / 0.25;
      else s = 1;
      bricks.forEach(b => { b.coat.material.opacity = s * 0.9; });

      // water rolls off during 0.55..1.0
      drops.forEach((d, i) => {
        if (p > 0.5) {
          const local = ((p - 0.5) / 0.5 + d.userData.ph) % 1;
          d.visible = true;
          d.position.set(
            d.userData.x + local * 0.4,
            topY + 0.15 - local * (topY + 3),
            d.userData.z
          );
          const sc = 0.7 + Math.sin(local * Math.PI) * 0.4;
          d.scale.setScalar(sc);
        } else {
          d.visible = false;
        }
      });
      group.rotation.y = Math.sin(t * 0.12) * 0.2;
    },
    dispose() {}
  };
}

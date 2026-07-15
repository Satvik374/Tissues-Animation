import * as THREE from 'three';
import { protoMat, edgeLines, organelle, ping } from './_util.js';

export const meta = {
  title: 'Parenchyma',
  subtitle: 'The living “ground tissue”',
  period: 16,
  description: 'Parenchyma is the <b>unspecialised living</b> tissue that forms the bulk of the plant. Cells are <b>thin-walled</b> (cellulose), rounded/oval/polygonal, with a large central <b>vacuole</b> and dense cytoplasm. Note the <b>intercellular spaces</b>. With chloroplasts it becomes <b>chlorenchyma</b> (photosynthesis); with big air cavities, <b>aerenchyma</b> (floating).',
  facts: [
    'Living cells with <b>thin cellulose walls</b> and clear <b>intercellular spaces</b>.',
    'Large central <b>vacuole</b> — stores food, water and wastes.',
    '<b>Chlorenchyma</b> = parenchyma + chloroplasts → makes food.',
    '<b>Aerenchyma</b> = big air spaces → buoyancy in water plants.',
    'Helps in storage, wound healing, regeneration &amp; grafting.',
  ],
  steps: [
    { title: 'Rounded living cells', text: 'Loosely packed parenchyma cells with thin walls and gaps between them.' },
    { title: 'The big vacuole', text: 'A large central vacuole (pale blue) pushes the cytoplasm to the edges.' },
    { title: 'Chlorenchyma at work', text: 'Green chloroplasts stream around the cell, capturing light to make food.' },
    { title: 'Intercellular spaces', text: 'The air gaps let respiratory gases move between cells.' },
  ],
};

export function build(ctx) {
  const { root } = ctx;
  const group = new THREE.Group();
  root.add(group);

  const cellData = [];
  const positions = [
    [-1.5, 1.2, 0], [0, 1.5, 0.3], [1.6, 1.1, -0.2],
    [-1.7, -0.4, 0.2], [-0.1, -0.2, 0], [1.7, -0.5, 0.2],
    [-1.2, -1.9, -0.1], [0.6, -1.8, 0.2], [2.0, 1.9, 0.1],
    [-2.0, 0.5, -0.3], [1.0, 0.2, 0.4], [-0.6, -1.0, -0.4],
  ];
  const chloroMat = new THREE.MeshStandardMaterial({ color: '#37c46a', emissive: '#0f5e2c', emissiveIntensity: 0.6, roughness: 0.4 });

  positions.forEach((pos, i) => {
    const r = 0.72 + (i % 3) * 0.08;
    const geo = new THREE.IcosahedronGeometry(r, 2);
    // squash a bit for polygonal look
    geo.scale(1.05, 0.92 + (i % 2) * 0.1, 1.0);
    const c = new THREE.Group();
    const inner = new THREE.Mesh(geo, protoMat('#8bf0b4', 0.34, 0.25));
    inner.castShadow = true; inner.receiveShadow = true;
    c.add(inner);
    c.add(edgeLines(geo, '#3aa066', 0.6, 15));

    // big central vacuole
    const vac = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.62, 2),
      new THREE.MeshPhysicalMaterial({ color: '#cdeffb', transparent: true, opacity: 0.3,
        roughness: 0.1, metalness: 0, transmission: 0.4, ior: 1.2 }));
    c.add(vac);

    // nucleus pushed to side
    const nuc = organelle(0.13, '#3a6bff', 0.3);
    nuc.position.set(r * 0.55, r * 0.4, 0);
    c.add(nuc);

    // chloroplasts orbiting inside (chlorenchyma)
    const chloros = [];
    const nCh = 6;
    for (let k = 0; k < nCh; k++) {
      const ch = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.1, 4, 8), chloroMat);
      chloros.push({ mesh: ch, a: (k / nCh) * Math.PI * 2, rr: r * 0.66, ph: Math.random() * 6 });
      c.add(ch);
    }
    c.position.set(pos[0], pos[1], pos[2]);
    group.add(c);
    cellData.push({ group: c, vac, chloros, r });
  });

  ctx.addLabel(cellData[1].group, '<b>Thin cell wall</b>', { offset: new THREE.Vector3(0, 1.0, 0) });
  ctx.addLabel(cellData[4].vac, '<b>Large vacuole</b>', { offset: new THREE.Vector3(0, 0, 0.9) });
  ctx.addLabel(cellData[5].group, '<b>Chloroplasts</b> (chlorenchyma)', { offset: new THREE.Vector3(0.6, 0.9, 0) });
  ctx.addLabel(group, 'Intercellular <b>air space</b>', { offset: new THREE.Vector3(0.3, 0.35, 0.6) });

  ctx.controls.target.set(0, 0, 0);
  ctx.camera.position.set(4.5, 2.5, 7);

  return {
    update(t, dt) {
      group.rotation.y = Math.sin(t * 0.1) * 0.2;
      cellData.forEach((cd, i) => {
        // vacuole shimmer
        cd.vac.scale.setScalar(1 + Math.sin(t * 1.1 + i) * 0.03);
        // cytoplasmic streaming: chloroplasts circulate
        cd.chloros.forEach((c, k) => {
          c.a += dt * (0.6 + (k % 3) * 0.15);
          const y = Math.sin(t * 0.8 + c.ph) * cd.r * 0.3;
          c.mesh.position.set(Math.cos(c.a) * cd.rr, y, Math.sin(c.a) * cd.rr);
          c.mesh.rotation.z = c.a;
        });
      });
    },
    dispose() {}
  };
}

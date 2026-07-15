import * as THREE from 'three';
import { solidMat, protoMat, edgeLines, ease } from './_util.js';

export const meta = {
  title: 'Sclerenchyma',
  subtitle: 'Dead, lignified — the plant’s girders',
  period: 15,
  description: 'Sclerenchyma is a <b>hard supporting tissue of dead cells</b>. Their walls are greatly thickened with <b>lignin</b>, so the cells lose their living contents (protoplasm). Two forms exist: long tapering <b>fibres</b> (ropes, jute, flax) and short <b>sclereids / stone cells</b> (grittiness of pear, hard nut shells). It gives the plant strength and rigidity.',
  facts: [
    'Cells are <b>dead</b> — no nucleus or cytoplasm at maturity.',
    'Walls thickened with <b>lignin</b> (has pits); very strong.',
    '<b>Fibres</b>: long, narrow, tapering ends → mechanical support.',
    '<b>Sclereids (stone cells)</b>: short, thick-walled → grit in pear/guava.',
    'Source of ropes, mats, linen, jute and hemp.',
  ],
  steps: [
    { title: 'Long fibre cells', text: 'Elongated cells with tapering pointed ends stand bundled together.' },
    { title: 'Lignin thickens the wall', text: 'Layers of lignin (amber) build up, narrowing the hollow lumen.' },
    { title: 'The cell dies', text: 'Once heavily lignified the protoplasm is lost — the cell is now dead but strong.' },
    { title: 'Stone cells (sclereids)', text: 'Short, very thick-walled sclereids give the gritty texture of a pear.' },
  ],
};

export function build(ctx) {
  const { root } = ctx;
  const group = new THREE.Group();
  root.add(group);

  // ---- Fibre bundle (left) ----
  const fibreGroup = new THREE.Group();
  fibreGroup.position.x = -2.2;
  group.add(fibreGroup);

  const fibres = [];
  const fibrePos = [[0,0],[0.62,0.15],[-0.55,0.2],[0.3,-0.55],[-0.35,-0.5],[0.15,0.62],[-0.15,-0.15]];
  fibrePos.forEach(([x, z], i) => {
    const h = 5.2 + (i % 3) * 0.4;
    // outer lignified wall
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.05, h, 12, 1),
      solidMat('#caa25a', 0.55, 0.1)
    );
    wall.castShadow = true; wall.receiveShadow = true;
    // taper ends: use two cones by scaling — approximate with cylinder + cone caps
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.6, 12), solidMat('#caa25a', 0.55));
    cap.position.y = h / 2 + 0.28;
    const cap2 = cap.clone(); cap2.rotation.x = Math.PI; cap2.position.y = -h / 2 - 0.28;
    const lumen = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.03, h, 10), protoMat('#3a2a12', 0.9, 0.6));
    const cell = new THREE.Group();
    cell.add(wall, cap, cap2, lumen);
    cell.position.set(x, 0, z);
    cell.userData = { wall, lumen };
    fibreGroup.add(cell);
    fibres.push(cell);
  });
  ctx.addLabel(fibres[0], '<b>Fibre</b> — tapering ends', { offset: new THREE.Vector3(0, 3.2, 0) });
  ctx.addLabel(fibres[0], 'Lignified wall', { offset: new THREE.Vector3(0.7, 0.4, 0) });

  // ---- Sclereids / stone cells (right) ----
  const stoneGroup = new THREE.Group();
  stoneGroup.position.set(2.6, 0, 0);
  group.add(stoneGroup);
  const stones = [];
  const stonePos = [[0,0.9,0],[1.0,0.3,0.2],[-0.9,0.4,-0.2],[0.2,-0.7,0.1],[-0.7,-0.9,0.2],[0.9,-1.1,-0.1]];
  stonePos.forEach(([x, y, z]) => {
    const r = 0.55 + Math.random() * 0.2;
    const geo = new THREE.DodecahedronGeometry(r, 0);
    const wall = new THREE.Mesh(geo, solidMat('#b98a3e', 0.5, 0.15));
    wall.castShadow = true;
    // radiating pit lines
    const pits = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.35, 1), protoMat('#5a3d16', 0.9, 0.7));
    const cell = new THREE.Group();
    cell.add(wall, pits);
    cell.position.set(x, y, z);
    stoneGroup.add(cell);
    stones.push(cell);
  });
  ctx.addLabel(stones[0], '<b>Sclereid</b> (stone cell)', { offset: new THREE.Vector3(0, 0.9, 0) });

  ctx.controls.target.set(0, 0, 0);
  ctx.camera.position.set(1.5, 1.5, 12.5);

  return {
    update(t) {
      const period = meta.period;
      const p = (t % period) / period;

      // lignin thickening 0.2..0.5: wall grows radially, lumen shrinks
      let k = 0;
      if (p < 0.2) k = 0.15;
      else if (p < 0.5) k = 0.15 + ease.out((p - 0.2) / 0.3) * 0.85;
      else k = 1;
      fibres.forEach((f, i) => {
        f.userData.wall.scale.x = f.userData.wall.scale.z = 0.6 + k * 0.55;
        f.userData.lumen.scale.x = f.userData.lumen.scale.z = 1.1 - k * 0.85;
        // "dead" darkening after 0.5
        const dead = p > 0.5 ? Math.min(1, (p - 0.5) / 0.2) : 0;
        f.userData.lumen.material.opacity = 0.9;
        f.userData.lumen.material.color.setHSL(0.09, 0.5, 0.12 - dead * 0.06);
      });

      group.rotation.y = Math.sin(t * 0.1) * 0.25;
      stoneGroup.children.forEach((s, i) => { s.rotation.y = t * 0.2 + i; });
    },
    dispose() {}
  };
}

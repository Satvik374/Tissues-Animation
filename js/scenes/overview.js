import * as THREE from 'three';
import { protoMat, edgeLines, organelle, ease } from './_util.js';

export const meta = {
  title: 'What is a Tissue?',
  subtitle: 'From single cells to organised teamwork',
  period: 16,
  description: 'A <b>tissue</b> is a group of cells that have a <b>common origin, similar structure and work together for a common function</b> (L. <i>texere</i> = to weave). In multicellular organisms this creates a <b>division of labour</b>: scattered similar cells organise into a tissue, tissues build organs, and organs build organ systems — raising the organism’s efficiency and survival.',
  facts: [
    'Tissue = cells of <b>common origin, shape &amp; function</b>.',
    'Enables <b>division of labour</b> in multicellular organisms.',
    'Tissues → organs → organ systems.',
    'Plants: <b>meristematic</b> &amp; <b>permanent</b>. Animals: epithelial, connective, muscular, nervous.',
  ],
  steps: [
    { title: 'Single scattered cells', text: 'Individual cells drift apart, each doing every job on its own — inefficient.' },
    { title: 'Cells come together', text: 'Similar cells migrate and gather into an organised group.' },
    { title: 'A tissue forms', text: 'Aligned, cooperating cells now share the work — this is a tissue.' },
    { title: 'Division of labour', text: 'Specialised tissues make the whole organism far more efficient.' },
  ],
};

export function build(ctx) {
  const { root } = ctx;
  const group = new THREE.Group();
  root.add(group);

  const N = 16;
  const cells = [];
  const geo = new THREE.IcosahedronGeometry(0.5, 2);
  // target grid positions (4x4)
  const targets = [];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      targets.push(new THREE.Vector3((i - 1.5) * 1.15, (j - 1.5) * 1.15, 0));

  for (let i = 0; i < N; i++) {
    const cell = new THREE.Group();
    const inner = new THREE.Mesh(geo, protoMat('#7fe6a8', 0.5));
    inner.castShadow = true; inner.receiveShadow = true;
    cell.add(inner);
    cell.add(edgeLines(geo, '#39a869', 0.6, 12));
    cell.add(organelle(0.13, '#3a6bff', 0.3));
    // random start (scattered)
    const start = new THREE.Vector3(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 7,
      (Math.random() - 0.5) * 8
    );
    cell.position.copy(start);
    cell.userData = { start, target: targets[i], spin: Math.random() * 2 - 1 };
    group.add(cell);
    cells.push(cell);
  }

  ctx.addLabel(group, '<b>Cells → Tissue</b>', { offset: new THREE.Vector3(0, 3, 0) });

  ctx.controls.target.set(0, 0, 0);
  ctx.camera.position.set(3, 2, 11);

  return {
    update(t) {
      const period = meta.period;
      const p = (t % period) / period;
      // assemble during 0.15..0.6, hold, then drift a little apart at end then loop
      let k;
      if (p < 0.15) k = 0;
      else if (p < 0.6) k = ease.inOut((p - 0.15) / 0.45);
      else if (p < 0.9) k = 1;
      else k = 1 - ease.in((p - 0.9) / 0.1);

      cells.forEach(c => {
        c.position.lerpVectors(c.userData.start, c.userData.target, k);
        c.rotation.y += 0.005 * c.userData.spin;
        const inner = c.children[0];
        inner.material.emissiveIntensity = 0.1 + k * 0.25;
      });
      group.rotation.y = Math.sin(t * 0.15) * 0.2;
    },
    dispose() {}
  };
}

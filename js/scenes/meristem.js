import * as THREE from 'three';
import { roundedBoxGeo, protoMat, edgeLines, organelle, ease, ping } from './_util.js';

export const meta = {
  title: 'Meristematic Tissue',
  subtitle: 'Small dividing cells that grow the plant',
  period: 18,
  description: 'Meristematic cells are small, thin-walled and <b>undifferentiated</b>. They are packed tightly with <b>no intercellular spaces</b>, have dense cytoplasm, small/absent vacuoles and a large central nucleus. They keep <b>dividing throughout the plant’s life</b> to add new cells.',
  facts: [
    'Found at <b>growing tips of roots &amp; shoots</b>, and as cambium.',
    '<b>Apical</b> meristem → length; <b>Lateral</b> (cambium) → girth; <b>Intercalary</b> → at leaf/internode bases.',
    'Cells are small, isodiametric, thin cellulose walls, <b>dense cytoplasm</b>.',
    'All other plant tissues are formed from meristematic tissue.',
  ],
  steps: [
    { title: 'A block of meristem', text: 'Tiny box-shaped cells packed with no gaps — each has a big central nucleus.' },
    { title: 'The nucleus prepares', text: 'A cell readies to divide: its nucleus enlarges and DNA is copied.' },
    { title: 'The cell divides', text: 'A new cross-wall forms and one cell becomes two — this is how the plant grows.' },
    { title: 'Growth continues', text: 'Fresh cells add to the tissue, increasing the plant’s length and thickness.' },
  ],
};

export function build(ctx) {
  const { root } = ctx;
  const group = new THREE.Group();
  root.add(group);

  const S = 1.0, gap = 0.02;
  const nx = 4, ny = 4, nz = 3;
  const cells = [];
  const cellGeo = roundedBoxGeo(S, S, S, 0.12);

  for (let x = 0; x < nx; x++)
    for (let y = 0; y < ny; y++)
      for (let z = 0; z < nz; z++) {
        const c = new THREE.Group();
        const inner = new THREE.Mesh(cellGeo, protoMat('#63dd97', 0.5));
        inner.castShadow = true; inner.receiveShadow = true;
        c.add(inner);
        c.add(edgeLines(cellGeo, '#2f9a63', 0.9, 30));
        const nuc = organelle(0.17, '#3a6bff', 0.3);
        c.add(nuc); c.userData.nuc = nuc; c.userData.inner = inner;
        c.position.set(
          (x - (nx - 1) / 2) * (S + gap),
          (y - (ny - 1) / 2) * (S + gap),
          (z - (nz - 1) / 2) * (S + gap)
        );
        group.add(c);
        cells.push(c);
      }

  // Pick a front-centre cell to animate dividing.
  const divCell = cells.find(c => Math.abs(c.position.x) < 0.6 && Math.abs(c.position.y) < 0.6 && c.position.z > 0.5) || cells[0];
  // second nucleus + cross wall built lazily
  const nuc2 = organelle(0.17, '#3a6bff', 0.3);
  nuc2.visible = false; divCell.add(nuc2);
  const wallGeo = new THREE.PlaneGeometry(S * 0.94, S * 0.94);
  const crossWall = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({
    color: '#eafff0', transparent: true, opacity: 0, roughness: 0.6, side: THREE.DoubleSide }));
  divCell.add(crossWall);

  ctx.addLabel(divCell, 'Dividing cell', { offset: new THREE.Vector3(0, 0.95, 0) });
  ctx.addLabel(cells[0].userData.nuc, '<b>Nucleus</b>', { offset: new THREE.Vector3(0, 0.35, 0) });
  const cornerCell = cells[cells.length - 1];
  ctx.addLabel(cornerCell, '<b>No</b> intercellular spaces', { offset: new THREE.Vector3(0.2, 0.9, 0) });

  ctx.controls.target.set(0, 0, 0);
  ctx.camera.position.set(5.5, 3.5, 6.5);

  return {
    update(t) {
      group.rotation.y = Math.sin(t * 0.12) * 0.15;

      // gentle breathing on all nuclei
      cells.forEach((c, i) => {
        const s = 1 + Math.sin(t * 1.3 + i) * 0.05;
        c.userData.nuc.scale.setScalar(s);
      });

      // division cycle within the period
      const period = meta.period;
      const p = (t % period) / period; // 0..1
      const nuc = divCell.userData.nuc;

      if (p < 0.25) {
        // resting
        nuc.scale.setScalar(1);
        nuc2.visible = false;
        crossWall.material.opacity = 0;
        divCell.scale.setScalar(1);
      } else if (p < 0.5) {
        // nucleus enlarges
        const k = ease.inOut((p - 0.25) / 0.25);
        nuc.scale.setScalar(1 + k * 0.7);
        nuc.material.emissiveIntensity = 0.3 + k * 0.5;
      } else if (p < 0.75) {
        // split: two nuclei move apart, cross wall grows
        const k = ease.inOut((p - 0.5) / 0.25);
        nuc.scale.setScalar(1.7 - k * 0.7);
        nuc.position.y = k * 0.28;
        nuc2.visible = true;
        nuc2.position.y = -k * 0.28;
        nuc2.scale.setScalar(1);
        crossWall.material.opacity = k * 0.9;
        divCell.scale.y = 1 + k * 0.12;
      } else {
        // reset back, cells slightly settle
        const k = (p - 0.75) / 0.25;
        crossWall.material.opacity = 0.9 * (1 - k);
        nuc.position.y = 0.28 * (1 - k);
        nuc2.position.y = -0.28 * (1 - k);
        nuc2.visible = k < 0.9;
        divCell.scale.y = 1 + 0.12 * (1 - k);
        nuc.material.emissiveIntensity = 0.3;
      }
    },
    dispose() {}
  };
}

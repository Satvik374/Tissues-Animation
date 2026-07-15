import * as THREE from 'three';
import { protoMat, edgeLines, solidMat } from './_util.js';

export const meta = {
  title: 'Epithelial Tissue',
  subtitle: 'The animal covering / lining tissue',
  period: 15,
  description: 'Epithelial tissue is the <b>protective covering tissue</b> of animals. It forms continuous sheets over the body surface and lines internal cavities and organs. Cells are <b>closely packed with no intercellular spaces</b>, held by cell junctions, and rest on a <b>basement membrane</b>. By cell shape it is classified as <b>squamous</b> (flat), <b>cuboidal</b> (cube), <b>columnar</b> (pillar) and <b>ciliated</b> (with beating cilia).',
  facts: [
    'Cells <b>tightly packed</b>, no gaps; rest on a <b>basement membrane</b>.',
    'No blood supply of its own; nourished from below.',
    '<b>Squamous</b>: flat, tile-like — lining of blood vessels, alveoli.',
    '<b>Cuboidal</b>: cube-shaped — kidney tubules, glands.',
    '<b>Columnar</b>: tall pillars — lining of the gut (absorption).',
    '<b>Ciliated</b>: columnar cells with cilia that sweep mucus/particles.',
  ],
  steps: [
    { title: 'Squamous epithelium', text: 'Flat, disc-like cells fit together like floor tiles — a thin protective lining.' },
    { title: 'Cuboidal epithelium', text: 'Cube-shaped cells; found in kidney tubules and glands.' },
    { title: 'Columnar epithelium', text: 'Tall pillar-like cells that line the gut and help in absorption &amp; secretion.' },
    { title: 'Ciliated epithelium', text: 'Columnar cells topped with cilia that beat in waves to move mucus and particles.' },
  ],
};

export function build(ctx) {
  const { root } = ctx;
  const group = new THREE.Group();
  root.add(group);

  const animalNucMat = new THREE.MeshStandardMaterial({ color: '#a05bff', emissive: '#3a1466', emissiveIntensity: 0.4, roughness: 0.4 });
  const membraneMat = new THREE.MeshStandardMaterial({ color: '#ffb703', roughness: 0.6, metalness: 0.05, emissive: '#5a3d00', emissiveIntensity: 0.2 });

  // basement membrane slab shared under each type
  function basement(x, w) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 2.4), membraneMat);
    m.position.set(x, -0.9, 0);
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  const cilia = [];

  // helper to place a sheet of cells
  function sheet(x, shape) {
    const g = new THREE.Group();
    g.position.x = x;
    const cols = 3, rows = 3;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let geo, h, nucR;
        if (shape === 'squamous') { geo = new THREE.BoxGeometry(0.8, 0.28, 0.8); h = 0.28; nucR = 0.11; }
        else if (shape === 'cuboidal') { geo = new THREE.BoxGeometry(0.62, 0.62, 0.62); h = 0.62; nucR = 0.13; }
        else { geo = new THREE.BoxGeometry(0.5, 1.15, 0.5); h = 1.15; nucR = 0.13; } // columnar / ciliated
        const cell = new THREE.Group();
        const body = new THREE.Mesh(geo, protoMat(shape === 'ciliated' ? '#ffd6a0' : '#ffd9b0', 0.72, 0.4));
        body.castShadow = true; body.receiveShadow = true;
        cell.add(body);
        cell.add(edgeLines(geo, '#c77a2a', 0.55));
        const nuc = new THREE.Mesh(new THREE.SphereGeometry(nucR, 14, 14), animalNucMat);
        nuc.position.y = shape === 'columnar' || shape === 'ciliated' ? -h * 0.28 : 0;
        cell.add(nuc);
        cell.position.set((i - 1) * 0.86, -0.9 + h / 2 + 0.06, (j - 1) * 0.86);

        // cilia on top
        if (shape === 'ciliated') {
          const top = h / 2;
          for (let c = 0; c < 5; c++) {
            const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.35, 5),
              new THREE.MeshStandardMaterial({ color: '#7fe0ff', emissive: '#1c6a80', emissiveIntensity: 0.5 }));
            hair.position.set((Math.random() - 0.5) * 0.3, top + 0.17, (Math.random() - 0.5) * 0.3);
            hair.userData.ph = Math.random() * Math.PI * 2 + (i + j);
            cell.add(hair);
            cilia.push(hair);
          }
        }
        g.add(cell);
      }
    }
    group.add(g);
    return g;
  }

  const spacing = 3.0;
  basement(-spacing * 1.5, 2.7);
  basement(-spacing * 0.5, 2.7);
  basement(spacing * 0.5, 2.7);
  basement(spacing * 1.5, 2.7);

  const s1 = sheet(-spacing * 1.5, 'squamous');
  const s2 = sheet(-spacing * 0.5, 'cuboidal');
  const s3 = sheet(spacing * 0.5, 'columnar');
  const s4 = sheet(spacing * 1.5, 'ciliated');

  ctx.addLabel(s1, '<b>Squamous</b> (flat)', { offset: new THREE.Vector3(0, 0.9, 0), animal: true });
  ctx.addLabel(s2, '<b>Cuboidal</b> (cube)', { offset: new THREE.Vector3(0, 1.1, 0), animal: true });
  ctx.addLabel(s3, '<b>Columnar</b> (pillar)', { offset: new THREE.Vector3(0, 1.6, 0), animal: true });
  ctx.addLabel(s4, '<b>Ciliated</b>', { offset: new THREE.Vector3(0, 1.9, 0), animal: true });
  ctx.addLabel(group, '<b>Basement membrane</b>', { offset: new THREE.Vector3(-spacing * 1.5, -1.4, 1.4), animal: true });

  ctx.controls.target.set(0, 0, 0);
  ctx.camera.position.set(0, 3.2, 9.5);

  return {
    update(t, dt) {
      // metachronal ciliary beating wave
      cilia.forEach(h => {
        const beat = Math.sin(t * 5 - h.userData.ph);
        h.rotation.z = beat * 0.6;
        h.rotation.x = Math.cos(t * 5 - h.userData.ph) * 0.2;
      });
      group.rotation.y = Math.sin(t * 0.12) * 0.18;
    },
    dispose() {}
  };
}

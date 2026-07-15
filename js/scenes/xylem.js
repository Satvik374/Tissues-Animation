import * as THREE from 'three';
import { solidMat, protoMat, makeFlow, thickeningBands } from './_util.js';

export const meta = {
  title: 'Xylem',
  subtitle: 'Water-conducting pipes of the plant',
  period: 16,
  description: 'Xylem is the <b>water-conducting complex tissue</b>. It carries water and minerals <b>upward</b> from the roots to the rest of the plant, and also gives mechanical support. It is built of four cell types: <b>tracheids</b> and <b>vessels</b> (dead, hollow tubes that conduct), <b>xylem fibres</b> (support) and <b>xylem parenchyma</b> (living, storage). Vessel walls have <b>spiral / annular</b> lignin thickenings.',
  facts: [
    '<b>Vessels</b>: long open tubes (end walls dissolved) — main water path in angiosperms.',
    '<b>Tracheids</b>: dead, tapering cells with pits.',
    'Walls show <b>annular &amp; spiral</b> lignin thickenings.',
    '<b>Xylem parenchyma</b> is the only living element; fibres give strength.',
    'Conducts water &amp; minerals from <b>root → top</b> of the plant.',
  ],
  steps: [
    { title: 'Hollow conducting tubes', text: 'Xylem vessels are dead, hollow pipes stacked end to end into long channels.' },
    { title: 'Wall thickenings', text: 'Spiral and ring-shaped lignin thickenings strengthen the vessel walls.' },
    { title: 'Water rises', text: 'Water and dissolved minerals stream upward from the roots (blue particles).' },
    { title: 'Supply to the plant', text: 'The continuous column of water reaches leaves for photosynthesis &amp; transpiration.' },
  ],
};

export function build(ctx) {
  const { root } = ctx;
  const group = new THREE.Group();
  root.add(group);

  const H = 6;
  const tubes = [];
  // three parallel vessels (spiral / annular thickening variants) + tracheids
  const configs = [
    { x: -1.6, r: 0.5, type: 'annular', color: '#c98a3a', turns: 9 },
    { x: 0.0,  r: 0.58, type: 'spiral',  color: '#d99a45', turns: 7 },
    { x: 1.6,  r: 0.5, type: 'spiral',  color: '#c98a3a', turns: 10 },
  ];

  configs.forEach((cfg, i) => {
    const t = new THREE.Group();
    t.position.x = cfg.x;
    // translucent vessel wall (hollow cylinder)
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(cfg.r, cfg.r, H, 32, 1, true),
      new THREE.MeshPhysicalMaterial({ color: '#e9c58a', transparent: true, opacity: 0.22,
        roughness: 0.2, metalness: 0, side: THREE.DoubleSide, transmission: 0.3 })
    );
    t.add(wall);
    // thickening bands
    t.add(thickeningBands(cfg.r + 0.01, H, { type: cfg.type, color: cfg.color, turns: cfg.turns, tube: 0.05 }));

    // water column + flow particles
    const flow = makeFlow({ count: 46, radius: cfg.r * 0.72, yMin: -H / 2, yMax: H / 2,
      color: '#69c8ff', size: 0.085, speed: 1.1 });
    t.add(flow);
    t.userData.flow = flow;

    // faint water cylinder
    const water = new THREE.Mesh(new THREE.CylinderGeometry(cfg.r * 0.8, cfg.r * 0.8, H, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: '#2b7fc0', transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
    t.add(water);

    // perforation plates (end walls) markers at joints for the middle vessel to show "vessel"
    group.add(t);
    tubes.push(t);
  });

  // a small living xylem parenchyma cell clinging to the side
  const paren = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 2), protoMat('#8bf0b4', 0.5));
  paren.position.set(-2.5, 0.8, 0.4);
  const pnuc = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshStandardMaterial({ color: '#3a6bff', emissive: '#12246e', emissiveIntensity: 0.4 }));
  pnuc.position.copy(paren.position);
  group.add(paren, pnuc);

  ctx.addLabel(tubes[1], '<b>Vessel</b> (spiral thickening)', { offset: new THREE.Vector3(0, 3.3, 0) });
  ctx.addLabel(tubes[0], 'Annular thickening', { offset: new THREE.Vector3(-0.6, -2.2, 0) });
  ctx.addLabel(pnuc, '<b>Xylem parenchyma</b> (living)', { offset: new THREE.Vector3(-0.2, 0.5, 0) });
  ctx.addLabel(tubes[2].userData.flow, '<b>Water + minerals ↑</b>', { offset: new THREE.Vector3(0.7, 1.6, 0) });

  ctx.controls.target.set(0, 0, 0);
  ctx.camera.position.set(2.5, 2, 10);

  return {
    update(t, dt) {
      tubes.forEach(tb => tb.userData.flow.userData.update(dt, +1)); // upward
      group.rotation.y = Math.sin(t * 0.1) * 0.25;
    },
    dispose() {}
  };
}

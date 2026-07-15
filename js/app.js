import { createEngine } from './engine.js';
import { catalog, byId } from './scenes/registry.js';

const params = new URLSearchParams(location.search);
const topicId = params.get('topic') || 'overview';

const stage = document.getElementById('stage');
const labels = document.getElementById('labels');
const engine = createEngine(stage, labels);

const $ = id => document.getElementById(id);
let meta = null;
let labelsVisible = true;

// Populate jump dropdown.
const jump = $('jump');
for (const c of catalog) {
  const o = document.createElement('option');
  o.value = c.id; o.textContent = `${c.icon}  ${c.title}`;
  if (c.id === topicId) o.selected = true;
  jump.appendChild(o);
}
jump.addEventListener('change', () => { location.search = `?topic=${jump.value}`; });

// Load the scene module dynamically.
async function load() {
  const info = byId(topicId) || catalog[0];
  document.title = `${info.title} — Tissues 3D`;
  let mod;
  try {
    mod = await import(`./scenes/${topicId}.js`);
  } catch (e) {
    console.error('Failed to load scene', topicId, e);
    $('loading').querySelector('.ltext').textContent = 'Could not load this module.';
    return;
  }
  engine.mount(mod, (m, ctx) => {
    meta = m;
    applyMeta(m, info);
    // fade out loader
    setTimeout(() => $('loading').classList.add('gone'), 350);
  });
}

function applyMeta(m, info) {
  $('v-title').textContent = m.title || info.title;
  $('v-sub').textContent = m.subtitle || info.subtitle || '';
  $('ip-title').textContent = m.title || info.title;
  $('ip-desc').innerHTML = m.description || '';
  const animal = info.group === 'animal';
  $('ip-eyebrow').textContent = animal ? 'Animal tissue' : (info.group === 'intro' ? 'Core idea' : 'Plant tissue');
  $('infopanel').classList.toggle('animal', animal);
  const facts = $('ip-facts');
  facts.innerHTML = '';
  (m.facts || []).forEach(f => {
    const li = document.createElement('li'); li.innerHTML = f; facts.appendChild(li);
  });
}

// ---- step / narration driver ----
function updateSteps() {
  if (!meta || !meta.steps || !meta.steps.length) { requestAnimationFrame(updateSteps); return; }
  const period = meta.period || 16;
  const t = engine.getTime();
  const prog = (t % period) / period;
  const idx = Math.min(meta.steps.length - 1, Math.floor(prog * meta.steps.length));
  const step = meta.steps[idx];
  if ($('ip-step-title').textContent !== step.title) {
    $('ip-step-title').textContent = step.title;
    $('ip-step-text').innerHTML = step.text;
  }
  $('prog').style.width = (prog * 100).toFixed(1) + '%';
  requestAnimationFrame(updateSteps);
}
requestAnimationFrame(updateSteps);

// ---- controls ----
$('btn-play').addEventListener('click', () => {
  const p = !engine.isPlaying();
  engine.setPlaying(p);
  $('btn-play').textContent = p ? '⏸ Pause' : '▶ Play';
});
$('btn-restart').addEventListener('click', () => engine.resetTime());
$('btn-rotate').addEventListener('click', () => {
  const v = !engine.getAutoRotate();
  engine.setAutoRotate(v);
  $('btn-rotate').textContent = `🔄 Auto-rotate: ${v ? 'On' : 'Off'}`;
});
$('btn-labels').addEventListener('click', () => {
  labelsVisible = !labelsVisible;
  labels.style.display = labelsVisible ? '' : 'none';
  $('btn-labels').textContent = `🏷 Labels: ${labelsVisible ? 'On' : 'Off'}`;
});
$('speed').addEventListener('input', e => {
  const v = parseFloat(e.target.value);
  engine.setSpeed(v);
  $('speed-val').textContent = v + '×';
});

// tabs: info panel vs labels-only
document.querySelectorAll('#tab-nav button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#tab-nav button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $('infopanel').classList.toggle('hidden', b.dataset.tab !== 'info');
  });
});

// keyboard
window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); $('btn-play').click(); }
  else if (e.key === 'r' || e.key === 'R') $('btn-restart').click();
});

load();

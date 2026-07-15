import { catalog } from './scenes/registry.js';

function card(c) {
  const a = document.createElement('a');
  a.className = 'card' + (c.group === 'animal' ? ' animal' : '');
  a.href = `viewer.html?topic=${c.id}`;
  a.innerHTML = `
    <div class="ico">${c.icon}</div>
    <div class="go">→</div>
    <h3>${c.title}</h3>
    <p>${c.blurb}</p>
    <div class="tag">${c.subtitle}</div>`;
  return a;
}

const groups = { plant: 'grid-plant', animal: 'grid-animal', intro: 'grid-intro' };
for (const c of catalog) {
  const el = document.getElementById(groups[c.group]);
  if (el) el.appendChild(card(c));
}

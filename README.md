# Tissues 3D — Class 9 Biology, Interactive Animations

An interactive **3D learning website** for the Class 9 Biology chapter **“Tissues”**.
Every plant and animal tissue from the chapter is rendered as a real-time 3D model
(built procedurally with [Three.js](https://threejs.org)) with narrated, step-by-step
animations of the underlying biology — cell division, water and food transport,
stomata opening, ciliary beating and more.

No videos, no image sequences: everything is a live, rotatable 3D scene you can
drag, zoom and pause.

## ▶️ How to use

Open **`index.html`** in any modern browser. That’s it — no build step, no install.

Because browsers block ES-module imports from `file://`, run a tiny local server
if double-clicking doesn’t work:

```bash
# from this folder
python3 -m http.server 8000
# then open http://localhost:8000
```

Or publish it free on **GitHub Pages** (Settings → Pages → deploy from branch).
The repo already contains a `.nojekyll` file so Pages serves every asset correctly.

### Controls
- **Drag** to rotate · **scroll** to zoom · **right-drag** to pan
- **Space** = play/pause · **R** = restart the animation
- Buttons for auto-rotate, label visibility and animation speed
- Dropdown (bottom-right) to jump between tissues

## 📚 Modules (mapped to the chapter)

**Plant tissues**
| Module | Chapter topic |
|---|---|
| Meristematic Tissue | 2.3.1 — dividing cells; apical / intercalary / lateral |
| Parenchyma | Simple permanent — ground tissue, chlorenchyma, aerenchyma |
| Collenchyma | Simple permanent — corner thickening, flexible support |
| Sclerenchyma | Simple permanent — fibres & sclereids (stone cells), lignin |
| Epidermis & Stomata | Protective tissue — cuticle, guard cells opening/closing |
| Cork (Phellem) | Protective tissue — suberin, lenticels |
| Xylem | Complex tissue — tracheids, vessels, thickenings, water flow |
| Phloem | Complex tissue — sieve tubes, sieve plates, companion cells |

**Animal tissues**
| Module | Chapter topic |
|---|---|
| Epithelial Tissue | 2.4.1 — squamous, cuboidal, columnar, ciliated; basement membrane |

**Start here**
| Module | Chapter topic |
|---|---|
| What is a Tissue? | 2.1 — division of labour, cells → tissue |

## 🗂 Project structure

```
index.html          Hub / landing page (module cards)
viewer.html         The 3D viewer shell (loads a module via ?topic=…)
styles.css          All styling
js/
  engine.js         Renderer, lighting, camera, labels, animation loop + helpers
  app.js            Viewer controller (UI, narration steps, controls)
  hub.js            Builds the landing-page cards
  scenes/
    registry.js     Catalogue of all modules
    _util.js        Shared model builders (cells, flows, thickenings…)
    <topic>.js      One file per tissue: meta + build(ctx)
  vendor/three/     Three.js r160 (vendored locally so it works offline)
```

## ➕ Adding a new tissue
1. Create `js/scenes/<id>.js` exporting `meta` and `build(ctx)`.
2. Add an entry to `js/scenes/registry.js`.
That’s all — the hub card and viewer wiring are automatic.

---
Built from the uploaded *Tissues* chapter PDF. Content follows the NCERT-style
Class 9 Biology syllabus.

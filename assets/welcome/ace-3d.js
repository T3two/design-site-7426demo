import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Original Ace 3D prototype. Geometry is deliberately flat-colored and simple;
// no generated character art, copyrighted rigs, or stock 3D assets.
const PALETTE = {
  skin: '#f7edde', lens: '#fff9ed', ink: '#292126', red: '#bd2938',
  redLight: '#d53b48', pants: '#41383e', leg: '#28252b', shoe: '#bc303c',
  cream: '#fffaf1', metal: '#71646b', chair: '#8d4048', chairDark: '#44353d'
};
const mats = Object.fromEntries(Object.entries(PALETTE).map(([k, color]) =>
  [k, new THREE.MeshToonMaterial({ color, roughness: 1 })]
));
const inkFlat = new THREE.MeshBasicMaterial({ color: PALETTE.ink });
const creamFlat = new THREE.MeshBasicMaterial({ color: PALETTE.cream });
const geometryCache = new Map();
function cuboid(parent, name, mat, pos, size, radius = 0.04) {
  const key = `${size.join(',')}/${radius}`;
  if (!geometryCache.has(key)) geometryCache.set(key, new RoundedBoxGeometry(...size, radius ? 3 : 1, radius));
  const mesh = new THREE.Mesh(geometryCache.get(key), typeof mat === 'string' ? mats[mat] : mat);
  mesh.name = name;
  mesh.position.set(...pos);
  parent.add(mesh);
  return mesh;
}
function ball(parent, name, material, pos, r, scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), typeof material === 'string' ? mats[material] : material);
  mesh.name = name; mesh.position.set(...pos); mesh.scale.set(...scale); parent.add(mesh); return mesh;
}
function tube(parent, name, material, a, b, r = 0.06) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b);
  const d = new THREE.Vector3().subVectors(bv, av);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 9), typeof material === 'string' ? mats[material] : material);
  mesh.name = name; mesh.position.copy(av).add(bv).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  parent.add(mesh); return mesh;
}
function stroke(parent, name, material, points, r = 0.025) {
  for (let i = 1; i < points.length; i++) tube(parent, name, material, points[i - 1], points[i], r);
}
function head(parent, shades) {
  const pivot = new THREE.Group(); pivot.name = 'HeadPivot'; pivot.position.y = 3.54; parent.add(pivot);
  cuboid(pivot, 'DiceHead', 'skin', [0, 0, 0.06], [1.51, 1.23, 1.00], 0.09);
  for (const off of [-0.34, 0.25])
    stroke(pivot, 'TopDiceMark', inkFlat,
      [[off - 0.11, .59, .54], [off - .055, .655, .535], [off + .035, .675, .53], [off + .13, .615, .51]], .022);
  for (const x of [-.385, .385]) {
    cuboid(pivot, 'GlassesFrame', inkFlat, [x, .12, .619], [.72, .68, .075], .07);
    cuboid(pivot, 'GlassesLens', 'lens', [x, .12, .673], [.60, .56, .045], .044);
    if (shades) {
      cuboid(pivot, 'Sunglass', inkFlat, [x, .12, .707], [.58, .52, .024], .046);
      stroke(pivot, 'SunglassGlint', creamFlat,
        [[x - .14, .22, .731], [x - .035, .34, .731]], .013);
    }
  }
  cuboid(pivot, 'Bridge', inkFlat, [0, .18, .66], [.11, .09, .115], .025);
  for (const side of [-1, 1]) cuboid(pivot, 'TempleArm', inkFlat, [side * .744, .13, .41], [.075, .07, .39], .02);
  if (!shades) {
    ball(pivot, 'OpenEye', inkFlat, [-.385, .12, .717], .065, [.73, 1, .20]);
    stroke(pivot, 'Wink', inkFlat,
      [[.19, .095, .72], [.28, .17, .72], [.385, .19, .72], [.50, .14, .72]], .028);
  }
  for (const side of [-1, 1]) {
    for (const [x, y] of [[.18, -.28], [.32, -.36], [.45, -.26]])
      ball(pivot, 'Freckle', inkFlat, [side * x, y, .588], .027, [1, 1, .36]);
  }
  return pivot;
}
function outfit(parent, seated) {
  cuboid(parent, 'HoodieTorso', 'red', [0, 2.22, .025], [1.44, 1.29, .75], .20);
  cuboid(parent, 'HoodieWaist', 'red', [0, 1.62, .02], [1.29, .22, .76], .08);
  cuboid(parent, 'HoodBehindHead', 'red', [0, 2.88, -.17], [1.52, .42, .65], .16);
  cuboid(parent, 'FrontHood', 'red', [0, 2.79, .36], [1.18, .24, .16], .075);
  cuboid(parent, 'NeckGap', 'ink', [0, 2.86, .444], [.48, .13, .056], .03);
  cuboid(parent, 'PocketTrim', 'ink', [0, 1.94, .429], [.83, .38, .04], .04);
  cuboid(parent, 'Pocket', 'red', [0, 1.95, .451], [.78, .34, .035], .035);
  for (const x of [-.13, .13]) cuboid(parent, 'HoodieString', 'cream', [x, 2.52, .466], [.066, .40, .055], .015);
  cuboid(parent, 'DiceBackpack', 'cream', [.77, 2.28, -.50], [.68, .77, .71], .08);
  for (const [y, z] of [[2.46, -.71], [2.29, -.50], [2.10, -.29]])
    ball(parent, 'BackpackPip', inkFlat, [1.117, y, z], .054, [.20, 1, 1]);
  stroke(parent, 'BagStrap', 'ink', [[.72, 2.89, .14], [.73, 2.76, .36], [.62, 2.54, .49], [.54, 2.19, .52]], .08);
  for (const [x, y, z] of [[.73, 1.83, .55], [.94, 1.80, .58]]) {
    tube(parent, 'CharmString', 'metal', [x, y + .16, z], [x, y + .09, z], .025);
    cuboid(parent, 'MiniDice', 'cream', [x, y, z], [.22, .22, .23], .028);
    for (const [dx, dy] of [[-.045, .05], [.05, -.046]])
      ball(parent, 'MiniPip', inkFlat, [x + dx, y + dy, z + .124], .018, [1, 1, .3]);
  }
  for (const side of [-1, 1]) {
    const x = side * .315;
    if (!seated) {
      cuboid(parent, 'Shorts', 'pants', [x, 1.18, .025], [.62, .73, .65], .095);
      cuboid(parent, 'Legging', 'leg', [x, .64, .04], [.40, .84, .43], .07);
      cuboid(parent, 'Sock', 'cream', [x, .33, .15], [.44, .19, .43], .04);
      cuboid(parent, 'Shoe', 'shoe', [x, .22, .34], [.65, .29, .86], .11);
      cuboid(parent, 'Sole', 'cream', [x, .08, .40], [.71, .13, .96], .07);
      cuboid(parent, 'ToeCap', 'cream', [x, .24, .67], [.63, .19, .26], .05);
      for (const z of [.32, .53]) cuboid(parent, 'ShoeStrap', 'cream', [x, .37, z], [.50, .065, .13], .019);
    } else {
      cuboid(parent, 'SeatedShorts', 'pants', [x, 1.40, .34], [.61, .39, .92], .11);
      cuboid(parent, 'SeatedLegging', 'leg', [x, .91, .71], [.42, .85, .45], .08);
      cuboid(parent, 'SeatedSock', 'cream', [x, .49, .73], [.45, .17, .44], .04);
      cuboid(parent, 'SeatedShoe', 'shoe', [x, .28, 1.02], [.67, .29, .92], .12);
      cuboid(parent, 'SeatedSole', 'cream', [x, .13, 1.08], [.71, .13, 1.02], .07);
      cuboid(parent, 'SeatedToeCap', 'cream', [x, .30, 1.37], [.64, .19, .26], .05);
      for (const z of [.92, 1.15]) cuboid(parent, 'ShoeStrap', 'cream', [x, .43, z], [.50, .065, .13], .019);
    }
  }
}
function chair(parent) {
  const chairGroup = new THREE.Group(); chairGroup.name = 'Chair'; parent.add(chairGroup);
  for (const x of [-.8, .8]) {
    for (const z of [-.44, .67]) tube(chairGroup, 'ChairLeg', 'chairDark', [x, .08, z], [x, 1.30, z], .064);
    tube(chairGroup, 'ChairBackSupport', 'chairDark', [x, 1.34, -.50], [x, 2.96, -.60], .077);
  }
  cuboid(chairGroup, 'ChairSeatFrame', 'chairDark', [0, 1.26, .12], [1.83, .19, 1.30], .105);
  cuboid(chairGroup, 'ChairCushion', 'chair', [0, 1.37, .12], [1.72, .15, 1.22], .095);
  cuboid(chairGroup, 'ChairBack', 'chair', [0, 2.28, -.64], [1.76, 1.15, .18], .075);
  cuboid(chairGroup, 'ChairBackTrim', 'chairDark', [0, 2.87, -.64], [1.85, .10, .22], .03);
}
function arms(parent, seated) {
  const group = new THREE.Group(); group.name = seated ? 'CrossedArms' : 'PointingArms'; parent.add(group);
  const sleeve = (a, b, radius = .22) => {
    tube(group, 'HoodieSleeve', 'red', a, b, radius);
    ball(group, 'ElbowFold', 'red', b, radius * .9);
  };
  if (!seated) {
    sleeve([-.68, 2.77, .12], [-1.29, 2.62, .33], .24);
    tube(group, 'Forearm', 'red', [-1.29, 2.62, .33], [-1.75, 2.68, .52], .205);
    cuboid(group, 'Cuff', 'ink', [-1.72, 2.68, .52], [.24, .27, .27], .05);
    ball(group, 'Glove', 'cream', [-1.83, 2.68, .60], .20, [1.1, .9, .65]);
    tube(group, 'IndexFinger', 'cream', [-1.85, 2.78, .65], [-2.35, 2.81, .68], .095);
    ball(group, 'RoundedFingerTip', 'cream', [-2.35, 2.81, .68], .097);
    sleeve([.67, 2.76, .12], [.97, 2.37, .36], .23);
    tube(group, 'HandHoldingStrap', 'red', [.97, 2.37, .36], [.70, 2.28, .63], .18);
    cuboid(group, 'Cuff', 'ink', [.73, 2.27, .62], [.23, .22, .26], .04);
    ball(group, 'Glove', 'cream', [.63, 2.27, .67], .175, [1.1, 1, .8]);
  } else {
    sleeve([-.68, 2.74, .10], [-.80, 2.41, .47], .23);
    tube(group, 'CrossedSleeve', 'red', [-.80, 2.41, .47], [.47, 2.39, .75], .19);
    sleeve([.68, 2.75, .10], [.78, 2.37, .48], .23);
    tube(group, 'CrossedSleeve', 'red', [.78, 2.37, .48], [-.50, 2.48, .81], .19);
    ball(group, 'CuffGlove', 'cream', [.47, 2.39, .75], .15, [1.2, .75, .60]);
    ball(group, 'CuffGlove', 'cream', [-.50, 2.48, .81], .15, [1.1, .75, .6]);
  }
  return group;
}
function buildAce(seated) {
  const root = new THREE.Group(); root.name = seated ? 'AceSeated' : 'AcePointing';
  // Same mascot geometry language in both poses; only glasses, arms, legs, and chair differ.
  if (seated) chair(root);
  outfit(root, seated);
  const armGroup = arms(root, seated);
  const headPivot = head(root, seated);
  if (seated) {
    // Three brief hand-drawn-esque accents, not a glowing particle effect.
    stroke(root, 'AccentOne', 'redLight', [[1.36, 3.05, -.3], [1.48, 3.16, -.3]], .018);
    stroke(root, 'AccentTwo', 'redLight', [[1.5, 2.87, -.3], [1.63, 2.87, -.3]], .018);
    stroke(root, 'AccentThree', 'redLight', [[-1.35, 3.04, -.3], [-1.47, 3.15, -.3]], .018);
  }
  return {root, headPivot, armGroup};
}
// Prefer the real, downloadable GLB geometry. The procedural model above remains
// a visible fallback if gzip decoding, network loading or WebGL support is unavailable.
async function loadOriginalGLB(seated) {
  if (typeof DecompressionStream === 'undefined') throw new Error('gzip streams unavailable');
  const path = 'assets/welcome/' + (seated ? 'ace_seated.glb.gz' : 'ace_pointing.glb.gz');
  const response = await fetch(path);
  if (!response.ok || !response.body) throw new Error('GLB asset not found: ' + path);
  const glb = await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const loader = new GLTFLoader();
  const parsed = await loader.parseAsync(glb, 'assets/welcome/');
  const model = parsed.scene;
  model.traverse(obj => {
    if (!obj.isMesh) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    const toon = materials.map(m => new THREE.MeshToonMaterial({
      color: m.color || new THREE.Color('#ffffff'),
      vertexColors: !!obj.geometry.getAttribute('color'),
      transparent: !!m.transparent,
      opacity: m.opacity ?? 1,
      side: THREE.FrontSide
    }));
    obj.material = Array.isArray(obj.material) ? toon : toon[0];
  });
  // Reparent each character part around simple movement pivots. This preserves
  // the authored mesh geometry while allowing head nods and shoulder movement.
  model.updateMatrixWorld(true);
  const headPivot = new THREE.Group();
  headPivot.name = 'AceHeadAnimationPivot';
  headPivot.position.set(0, 3.54, 0);
  model.add(headPivot);
  const armGroup = new THREE.Group();
  armGroup.name = 'AceArmAnimationPivot';
  armGroup.position.set(0, 2.5, 0);
  model.add(armGroup);
  const headNames = /^(head_white|dice_head|glasses_|wink|open_eye|freckle|dice_top_marks|sunglasses_)/i;
  const armNames = /^(left_sleeve|left_elbow|left_forearm|left_cuff|left_hand|pointing_finger|finger_tip|right_sleeve|right_elbow|right_forearm|right_cuff|right_glove|seated_left_upper|seated_left_forearm|seated_right_upper|seated_right_forearm|left_glove|right_glove)/i;
  const items = [];
  model.traverse(obj => { if (obj.isMesh) items.push(obj); });
  for (const item of items) {
    const nm = item.name || item.parent?.name || '';
    if (headNames.test(nm)) headPivot.attach(item);
    else if (armNames.test(nm)) armGroup.attach(item);
  }
  return {root:model,headPivot,armGroup};
}

function mount(slot, seated) {
  if (slot.dataset.ace3dMounted) return;
  slot.dataset.ace3dMounted = 'true';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'});
  } catch (error) {
    console.warn('Ace 3D preview unavailable', error); return;
  }
  const canvas = renderer.domElement;
  canvas.className = 'ace-3d-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  slot.appendChild(canvas);
  slot.classList.add('has-art', 'ace3d-ready');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight('#ffffff', 1.65));
  const key = new THREE.DirectionalLight('#ffffff', 1.5);
  key.position.set(-3, 7, 9); scene.add(key);
  const fill = new THREE.DirectionalLight('#ffffff', .5);
  fill.position.set(4, 2, -5); scene.add(fill);
  let actor = buildAce(seated);
  scene.add(actor.root);
  loadOriginalGLB(seated).then(actual => {
    // Swap the placeholder mesh for the true exported 3D source model.
    scene.remove(actor.root);
    scene.add(actual.root);
    actor = actual;
  }).catch(error => console.warn('Using procedural Ace preview:', error));
  const camera = new THREE.OrthographicCamera(-3.1, 3.1, 3.7, -3.7, .1, 100);
  camera.position.set(seated ? 5 : 3.6, 3.3, 10.6);
  camera.lookAt(seated ? .05 : -.25, 2.1, .05);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pointerX = 0, pointerY = 0;
  const sceneLink = slot.closest('.welcome-scene');
  sceneLink?.addEventListener('pointermove', evt => {
    const b = sceneLink.getBoundingClientRect();
    pointerX = THREE.MathUtils.clamp(((evt.clientX - b.left) / b.width - .5) * 2, -1, 1);
    pointerY = THREE.MathUtils.clamp(((evt.clientY - b.top) / b.height - .5) * 2, -1, 1);
  }, {passive:true});
  sceneLink?.addEventListener('pointerleave', () => {pointerX = 0; pointerY = 0;});

  function resize() {
    const w = Math.max(1, slot.clientWidth), h = Math.max(1, slot.clientHeight);
    renderer.setSize(w, h, false);
    const aspect = w / h;
    const vertical = seated ? 5.5 : 5.7;
    camera.top = vertical / 2;
    camera.bottom = -vertical / 2;
    camera.left = -vertical * aspect / 2;
    camera.right = vertical * aspect / 2;
    // Most phones have narrow artwork panels: keep silhouette legible and centered.
    camera.zoom = aspect < .75 ? .76 : aspect > 1.2 ? .98 : .91;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(slot); resize();
  const tickStart = performance.now();
  let lastFrame = 0;
  function tick(time) {
    requestAnimationFrame(tick);
    if (!slot.isConnected || slot.closest('[hidden]') || document.hidden) return;
    // Character motion uses low cadence for a hand-animated feeling; camera stays smooth.
    if (!reducedMotion.matches && time - lastFrame < 33) return;
    lastFrame = time;
    const t = reducedMotion.matches ? 0 : Math.floor((time - tickStart) / 85) * .085;
    const enter = reducedMotion.matches ? 1 : Math.min(1, (time - tickStart) / 960);
    const eased = 1 - Math.pow(1 - enter, 3);
    actor.root.position.y = (1 - eased) * -.34 + (reducedMotion.matches ? 0 : Math.sin(t * 2.1) * .025);
    actor.root.rotation.y += (pointerX * -.16 + (seated ? -.08 : .08) - actor.root.rotation.y) * .045;
    actor.root.rotation.z = reducedMotion.matches ? 0 : Math.sin(t * 1.35) * (seated ? .013 : .019);
    actor.headPivot.rotation.z = reducedMotion.matches ? 0 : Math.sin(t * 1.65 + .3) * .022;
    actor.headPivot.rotation.y = reducedMotion.matches ? 0 : .028 * Math.sin(t * 1.1);
    actor.armGroup.rotation.z = reducedMotion.matches ? 0 : Math.sin(t * 1.6) * (seated ? .007 : .025);
    camera.position.x += (pointerX * .36 + (seated ? 3 : 2.2) - camera.position.x) * .035;
    camera.position.y += (-pointerY * .16 + 3.36 - camera.position.y) * .035;
    camera.lookAt(seated ? 0 : -.21, 2.1, .02);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
}
function start() {
  const left = document.querySelector('[data-welcome-asset="designAce"]');
  const right = document.querySelector('[data-welcome-asset="robotAce"]');
  if (left) mount(left, false);
  if (right) mount(right, true);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
else start();
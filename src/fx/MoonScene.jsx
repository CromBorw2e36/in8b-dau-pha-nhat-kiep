// Nền Dạ Nguyệt dựng bằng three.js: trăng rằm phát sáng, trời sao, ba lớp núi trong sương,
// lá vàng rơi lật trong không gian 3D, linh khí bay lên theo màu cảnh giới.
// anime.js điều khiển khoảnh khắc lên cảnh giới: trăng bừng sáng, linh khí cuộn mạnh rồi lắng lại.
// three.js được tải lười; máy không có WebGL thì dùng lại lớp 2D QiAtmosphere.
import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { calm } from '../components/motion.js';
import QiAtmosphere from './QiAtmosphere.jsx';

// Màu linh khí theo cảnh giới (khớp QiAtmosphere)
const QI = (R) => (R >= 10 ? 0xffc94d : R >= 7 ? 0xb58cff : R >= 4 ? 0x6cc4ff : 0x6ee7b7);

const STAR_VS = `
  attribute float aPhase; attribute float aSize;
  uniform float uTime; uniform float uPR;
  varying float vA;
  void main() {
    vA = 0.45 + 0.55 * sin(uTime * 1.7 + aPhase);
    gl_PointSize = aSize * uPR * (0.75 + 0.25 * sin(uTime * 1.1 + aPhase * 2.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const STAR_FS = `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vA;
    gl_FragColor = vec4(0.86, 0.93, 1.0, a * 0.85);
  }`;
const MOON_VS = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const MOON_FS = `
  uniform float uGlow; uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float disc = smoothstep(0.37, 0.355, r);
    // Mặt trăng: vết loang nhạt như vết mực
    float n = noise(p * 6.0) * 0.55 + noise(p * 13.0) * 0.3 + noise(p * 27.0) * 0.15;
    vec3 face = mix(vec3(1.0, 0.97, 0.88), vec3(0.78, 0.82, 0.9), smoothstep(0.45, 0.8, n));
    // Quầng sáng: ấm ở gần, lạnh ở xa; thở nhẹ theo thời gian
    float breathe = 0.92 + 0.08 * sin(uTime * 0.6);
    float halo = exp(-max(r - 0.33, 0.0) * 4.2) * 0.55 * uGlow * breathe;
    vec3 haloC = mix(vec3(1.0, 0.9, 0.65), vec3(0.45, 0.7, 1.0), smoothstep(0.35, 1.0, r));
    vec3 col = face * disc + haloC * halo * (1.0 - disc);
    float a = disc + halo * (1.0 - disc);
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }`;
const MOTE_VS = `
  attribute float aPhase;
  uniform float uTime; uniform float uPR; uniform float uSurge;
  varying float vA;
  void main() {
    vA = 0.55 + 0.4 * sin(uTime * 2.3 + aPhase);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (2.0 + uSurge * 1.2) * uPR * (40.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const MOTE_FS = `
  uniform vec3 uColor;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor + a * 0.35, a * vA);
  }`;

export default function MoonScene({ realm = 0, dim = false }) {
  const host = useRef(null);
  const api = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let dead = false;
    let cleanup = () => {};
    import('three').then((THREE) => {
      if (dead || !host.current) return;
      try { cleanup = build(THREE, host.current, realm, api); } catch { setFallback(true); }
    }).catch(() => setFallback(true));
    return () => { dead = true; cleanup(); };
  }, []);

  // Lên cảnh giới: anime.js đẩy độ sáng trăng và tốc độ linh khí rồi cho lắng lại
  const prev = useRef(realm);
  useEffect(() => {
    api.current?.setRealm(realm, realm > prev.current);
    prev.current = realm;
  }, [realm]);

  if (fallback) return <QiAtmosphere realm={realm} />;
  return <div ref={host} className={'moon-scene' + (dim ? ' dim' : '')} aria-hidden="true" />;
}

function build(THREE, el, realm, api) {
  const small = innerWidth < 700;
  const still = calm();
  const renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: 'low-power' });
  const pr = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
  renderer.setPixelRatio(pr);
  renderer.setClearColor(0x000000, 0);
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a1528, 22, 70);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 2, 30);
  const look = new THREE.Vector3(0, 4, -30);
  const disposables = [];
  const keep = (...xs) => { disposables.push(...xs); return xs[0]; };

  // Trạng thái anime.js điều khiển (đọc mỗi khung hình)
  const fx = { glow: 1, surge: 1 };
  const qiTarget = new THREE.Color(QI(realm));

  // ── Trời sao ──
  const nStar = small ? 380 : 900;
  const sPos = new Float32Array(nStar * 3), sPh = new Float32Array(nStar), sSz = new Float32Array(nStar);
  for (let i = 0; i < nStar; i++) {
    sPos.set([(Math.random() - 0.5) * 190, -8 + Math.random() * 75, -62 - Math.random() * 10], i * 3);
    sPh[i] = Math.random() * 6.28;
    sSz[i] = 1 + Math.random() * (Math.random() < 0.08 ? 3.5 : 1.6);
  }
  const starGeo = keep(new THREE.BufferGeometry());
  starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(sPh, 1));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(sSz, 1));
  const starMat = keep(new THREE.ShaderMaterial({
    vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: { value: 0 }, uPR: { value: pr } },
  }));
  scene.add(new THREE.Points(starGeo, starMat));

  // ── Trăng rằm ──
  const moonGeo = keep(new THREE.PlaneGeometry(46, 46));
  const moonMat = keep(new THREE.ShaderMaterial({
    vertexShader: MOON_VS, fragmentShader: MOON_FS, transparent: true, depthWrite: false, fog: false,
    uniforms: { uGlow: { value: 1 }, uTime: { value: 0 } },
  }));
  const moon = new THREE.Mesh(moonGeo, moonMat);
  scene.add(moon); // vị trí đặt trong resize() theo tỷ lệ màn hình

  // ── Ba lớp núi trong sương (xa → gần) ──
  const ridge = (seed, amp, base) => {
    const sh = new THREE.Shape();
    sh.moveTo(-110, -40);
    for (let x = -110; x <= 110; x += 2) {
      const y = base + amp * (0.55 * Math.sin(x * 0.045 + seed) + 0.3 * Math.sin(x * 0.11 + seed * 2.3) + 0.15 * Math.sin(x * 0.27 + seed * 4.1));
      sh.lineTo(x, y);
    }
    sh.lineTo(110, -40);
    return keep(new THREE.ShapeGeometry(sh));
  };
  [[1.3, 9, 2, -42, 0x17304d], [4.2, 7, -3, -30, 0x10233b], [7.7, 5, -8, -18, 0x09172a]].forEach(([seed, amp, base, z, c]) => {
    const m = new THREE.Mesh(ridge(seed, amp, base), keep(new THREE.MeshBasicMaterial({ color: c })));
    m.position.z = z;
    scene.add(m);
  });

  // ── Lá vàng: InstancedMesh, mỗi lá có trục lật riêng ──
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -0.55);
  leafShape.bezierCurveTo(0.5, -0.2, 0.62, 0.35, 0, 0.6);
  leafShape.bezierCurveTo(-0.62, 0.35, -0.5, -0.2, 0, -0.55);
  const leafGeo = keep(new THREE.ShapeGeometry(leafShape));
  const leafMat = keep(new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
  const nLeaf = small ? 26 : 60;
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, nLeaf);
  const LEAF_C = [0xf59e0b, 0xd97706, 0xfbbf24, 0xb45309, 0xfde68a].map((c) => new THREE.Color(c));
  const L = [];
  const dummy = new THREE.Object3D();
  const spawn = (l, top) => {
    l.z = -16 + Math.random() * 22; // không cho lá bay sát camera (sẽ to che màn hình)
    const half = halfH(l.z);
    l.y = top ? half + 2 : (Math.random() * 2 - 1) * half;
    l.x = (Math.random() * 2 - 1) * half * camera.aspect * 1.2;
    l.vy = 1.1 + Math.random() * 1.4;
    l.sway = Math.random() * 6.28;
    l.s = 0.6 + Math.random() * 0.8;
    l.ax = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    l.spin = (Math.random() * 2 + 1) * (Math.random() < 0.5 ? -1 : 1);
    l.a = Math.random() * 6.28;
  };
  const halfH = (z) => Math.tan((camera.fov * Math.PI) / 360) * (camera.position.z - z);
  for (let i = 0; i < nLeaf; i++) {
    const l = {};
    spawn(l, false);
    L.push(l);
    leaves.setColorAt(i, LEAF_C[i % LEAF_C.length]);
  }
  scene.add(leaves);

  // ── Linh khí bay lên ──
  const nMote = small ? 60 : 140;
  const mPos = new Float32Array(nMote * 3), mPh = new Float32Array(nMote), mV = new Float32Array(nMote);
  for (let i = 0; i < nMote; i++) {
    mPos.set([(Math.random() - 0.5) * 70, -20 + Math.random() * 45, -10 + Math.random() * 25], i * 3);
    mPh[i] = Math.random() * 6.28;
    mV[i] = 0.6 + Math.random() * 1.2;
  }
  const moteGeo = keep(new THREE.BufferGeometry());
  moteGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  moteGeo.setAttribute('aPhase', new THREE.BufferAttribute(mPh, 1));
  const moteMat = keep(new THREE.ShaderMaterial({
    vertexShader: MOTE_VS, fragmentShader: MOTE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: { value: 0 }, uPR: { value: pr }, uSurge: { value: 1 }, uColor: { value: new THREE.Color(QI(realm)) } },
  }));
  scene.add(new THREE.Points(moteGeo, moteMat));

  // ── Kích thước, con trỏ, vòng lặp ──
  const resize = () => {
    const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Màn dọc (điện thoại): trăng lên góc trên phải và nhỏ lại để không đè chữ
    const portrait = camera.aspect < 0.85;
    const hh = halfH(-55);
    if (portrait) { moon.position.set(hh * camera.aspect * 0.62, 5 + hh * 0.66, -55); moon.scale.setScalar(0.62); }
    else { moon.position.set(20, 18, -55); moon.scale.setScalar(1); }
    if (still) frame(0);
  };
  const ptr = { x: 0, y: 0 };
  const onPtr = (e) => { ptr.x = e.clientX / innerWidth - 0.5; ptr.y = e.clientY / innerHeight - 0.5; };

  let t = 0, last = performance.now(), raf = 0;
  function frame(dt) {
    t += dt;
    starMat.uniforms.uTime.value = t;
    moonMat.uniforms.uTime.value = t;
    moonMat.uniforms.uGlow.value = fx.glow;
    moteMat.uniforms.uTime.value = t;
    moteMat.uniforms.uSurge.value = fx.surge;
    moteMat.uniforms.uColor.value.lerp(qiTarget, Math.min(1, dt * 1.5));

    // Camera nghiêng nhẹ theo con trỏ
    camera.position.x += (ptr.x * 3 - camera.position.x) * Math.min(1, dt * 2);
    camera.position.y += (2 - ptr.y * 2 - camera.position.y) * Math.min(1, dt * 2);
    camera.lookAt(look);

    for (let i = 0; i < nLeaf; i++) {
      const l = L[i];
      l.sway += dt * 1.3;
      l.a += dt * l.spin;
      l.y -= l.vy * dt;
      l.x += (0.9 + Math.sin(l.sway) * 1.2) * dt;
      const half = halfH(l.z);
      if (l.y < -half - 2 || l.x > half * camera.aspect * 1.3) spawn(l, true);
      dummy.position.set(l.x, l.y, l.z);
      dummy.quaternion.setFromAxisAngle(l.ax, l.a);
      dummy.scale.setScalar(l.s);
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
    }
    leaves.instanceMatrix.needsUpdate = true;

    const p = moteGeo.attributes.position.array;
    for (let i = 0; i < nMote; i++) {
      p[i * 3 + 1] += mV[i] * dt * fx.surge;
      p[i * 3] += Math.sin(t * 0.8 + mPh[i]) * dt * 0.4;
      if (p[i * 3 + 1] > 26) { p[i * 3 + 1] = -20; p[i * 3] = (Math.random() - 0.5) * 70; }
    }
    moteGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!document.hidden) frame(dt);
  };

  addEventListener('resize', resize);
  addEventListener('pointermove', onPtr, { passive: true });
  resize();
  if (!still) raf = requestAnimationFrame(loop);

  let flare = null;
  api.current = {
    setRealm(R, up) {
      qiTarget.set(QI(R));
      if (!up || still) return;
      flare?.pause();
      fx.glow = 1; fx.surge = 1;
      flare = animate(fx, {
        glow: [{ to: 3.4, duration: 450, ease: 'outQuad' }, { to: 1, duration: 2400, ease: 'inOutSine' }],
        surge: [{ to: 6, duration: 350, ease: 'outQuad' }, { to: 1, duration: 2800, ease: 'outCubic' }],
      });
    },
  };

  return () => {
    cancelAnimationFrame(raf);
    flare?.pause();
    removeEventListener('resize', resize);
    removeEventListener('pointermove', onPtr);
    leaves.dispose();
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
    renderer.domElement.remove();
    api.current = null;
  };
}

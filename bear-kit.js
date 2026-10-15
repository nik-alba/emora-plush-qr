// Plush bear builder for starship.html.
// A copy of the bear rig + team looks from index.html. If you change a look there, mirror it here.
import * as THREE from 'three';

function fuzzTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0,0,256,256);
  for (let i=0;i<9000;i++){ const v=Math.random()*40-20;
    g.fillStyle=`rgba(${v>0?255:0},${v>0?255:0},${v>0?255:0},${Math.abs(v)/160})`;
    g.fillRect(Math.random()*256, Math.random()*256, 1+Math.random()*1.5, 1+Math.random()*3); }
  const t = new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,3);
  t.colorSpace = THREE.SRGBColorSpace; return t;
}
const FUZZ = fuzzTexture();
export const plush = (hex) => new THREE.MeshPhysicalMaterial({ color:hex, map:FUZZ, bumpMap:FUZZ, bumpScale:0.6, roughness:1,
  sheen:1, sheenRoughness:0.6, sheenColor:new THREE.Color(0xfff1e4) });

export function canvasTex(w, h, draw, repeat=[1,1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace; return t;
}
const knitTex = canvasTex(64, 64, (g,w,h) => {
  g.fillStyle = '#fff'; g.fillRect(0,0,w,h);
  for (let x=0;x<w;x+=8){ g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x,0,2,h); }
  for (let i=0;i<300;i++){ g.fillStyle=`rgba(0,0,0,${Math.random()*.15})`; g.fillRect(Math.random()*w,Math.random()*h,2,3); }
}, [14, 8]);
const plaidTex = (bg, line) => canvasTex(64, 64, (g,w,h) => {
  g.fillStyle = bg; g.fillRect(0,0,w,h); g.fillStyle = line;
  for (let i=0;i<w;i+=16){ g.fillRect(i,0,2,h); g.fillRect(0,i,w,2); }
  g.globalAlpha = .4; for (let i=8;i<w;i+=16){ g.fillRect(i,0,1,h); g.fillRect(0,i,w,1); }
}, [10, 6]);
const pique = canvasTex(64, 64, (g,w,h) => {
  g.fillStyle = '#fff'; g.fillRect(0,0,w,h);
  for (let y=0;y<h;y+=4) for (let x=(y/4)%2*2;x<w;x+=4){ g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x,y,2,2); }
}, [16, 10]);
const stubbleAlpha = (density) => canvasTex(512, 256, (g,w,h) => {
  g.fillStyle = '#000'; g.fillRect(0,0,w,h);
  for (let i=0;i<9000*density;i++){
    const u = 0.25 + (Math.random()-0.5)*0.34, v = 0.52 + Math.random()*0.36;
    const edge = Math.min(1, (0.17 - Math.abs(u-0.25))*9) * Math.min(1, (v-0.52)*6);
    g.fillStyle = `rgba(255,255,255,${Math.max(0,edge)*(.5+Math.random()*.5)})`;
    g.fillRect(u*w, v*h, 1.6, 1.6);
  }
});

export const LOOKS = {
  zach:  { label:'Zach', hair:0xb48a55, style:'quiff', iris:0x6f9cc8, brow:0x8a6a45, stubble:0x8a6a48, stubbleD:0.6,
           grin:true, top:'sweater', topColor:0x1f2126 },
  ed:    { label:'Ed', hair:0x2b2019, style:'swept', iris:0x5a3a22, brow:0x2b2019, stubble:0x3b2d24, stubbleD:1,
           grin:true, top:'shirt', topColor:0xa9cde3, plaid:['#a9cde3', '#5f8fb3'] },
  robin: { label:'Robin', hair:0x15100e, style:'curls', iris:0x3a2a1c, brow:0x15100e, grin:true, glasses:0x6f8496,
           top:'polo', topColor:0xd8231c },
  // Nik: placeholder look until Nik confirms hair / facial hair / glasses / go-to top
  nik:   { label:'Nik', hair:0x4a3326, style:'short', iris:0x4f6b3a, brow:0x3e2b20, stubble:0x4a3828, stubbleD:0.45,
           grin:true, top:'sweater', topColor:0x2f5d50 },
};

const sphere = (r, mat, sx=1, sy=1, sz=1) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 36), mat);
  m.scale.set(sx, sy, sz); return m;
};
const UP = new THREE.Vector3(0,1,0);
const HEAD_C = new THREE.Vector3(0, 0.62, 0), HEAD_R = new THREE.Vector3(0.84, 0.75, 0.74);
const headPt = (az, el, k=1) => new THREE.Vector3(
  HEAD_C.x + HEAD_R.x*k*Math.cos(el)*Math.sin(az), HEAD_C.y + HEAD_R.y*k*Math.sin(el), HEAD_C.z + HEAD_R.z*k*Math.cos(el)*Math.cos(az));

// Returns { group, arms, ears, neck } — group origin is the belly centre, bear faces +z.
export function makeBear(lookName) {
  const L = LOOKS[lookName] || {};
  const furMat = plush(0xe8a07a), lightMat = plush(0xfbe2cc), pinkMat = plush(0xf3a3a0);
  const darkMat = new THREE.MeshStandardMaterial({ color:0x2a1d18, roughness:0.25, metalness:0.1 });

  const group = new THREE.Group();
  const BODY_R = 1, BODY_S = [1.0, 1.08, 0.82];
  group.add(sphere(BODY_R, furMat, ...BODY_S));
  for (const s of [-1, 1]) {
    const leg = sphere(0.42, furMat, 1, 0.85, 1.25); leg.position.set(0.52*s, -0.82, 0.38); group.add(leg);
    const pad = sphere(0.26, lightMat, 1, 1, 0.35); pad.position.set(0.52*s, -0.84, 0.86); group.add(pad);
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Group(); shoulder.position.set(0.82*s, 0.42, 0.12); group.add(shoulder);
    const arm = sphere(0.27, furMat, 0.9, 1.7, 0.9); arm.position.set(0.12*s, -0.38, 0.1); arm.rotation.z = 0.35*s;
    shoulder.add(arm); arms.push({ shoulder, s, arm });
  }
  const neck = new THREE.Group(); neck.position.y = 0.95; group.add(neck);
  const head = sphere(0.78, furMat, 1.08, 0.96, 0.95); head.position.y = 0.62; neck.add(head);
  const snout = sphere(0.32, lightMat, 1.15, 0.85, 0.8); snout.position.set(0, 0.46, 0.68); neck.add(snout);
  const nose = sphere(0.1, darkMat, 1.3, 0.85, 0.8); nose.position.set(0, 0.58, 0.94); neck.add(nose);
  const eyeMat = darkMat.clone(); if (L.iris) eyeMat.color.set(L.iris);
  for (const s of [-1,1]) {
    const eye = sphere(0.085, eyeMat); eye.position.set(0.3*s, 0.8, 0.66); neck.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.022,12,12), new THREE.MeshBasicMaterial({color:0xffffff}));
    glint.position.set(0.3*s+0.03, 0.83, 0.74); neck.add(glint);
    const cheek = sphere(0.12, pinkMat, 1, 0.6, 0.4); cheek.position.set(0.5*s, 0.52, 0.6); neck.add(cheek);
  }
  const ears = [];
  for (const s of [-1,1]) {
    const ear = new THREE.Group(); ear.position.set(0.58*s, 1.2, 0); neck.add(ear);
    ear.add(sphere(0.27, furMat, 1, 1, 0.55));
    const inner = sphere(0.16, pinkMat, 1, 1, 0.4); inner.position.z = 0.1; ear.add(inner);
    ears.push({ ear, s });
  }
  if (!LOOKS[lookName]) return { group, arms, ears, neck };

  const look = new THREE.Group(); neck.add(look);
  const tuft = (mat, pos, dir, r, stretch) => {
    const m = sphere(r, mat, 0.85, stretch, 0.85);
    m.position.copy(pos); m.quaternion.setFromUnitVectors(UP, dir.clone().normalize()); look.add(m); return m;
  };

  // Hair
  const hairMat = plush(L.hair); hairMat.sheenColor = new THREE.Color(0x777777); hairMat.bumpScale = 1.2;
  if (L.style !== 'curls') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.78, 48, 24, 0, Math.PI*2, 0, L.style === 'quiff' ? 1.05 : 1.15), hairMat);
    cap.scale.set(1.12, 1.0, 0.99); cap.position.copy(HEAD_C); cap.rotation.x = -0.32; look.add(cap);
  }
  if (L.style === 'quiff') {
    for (let i=0;i<9;i++){
      const az = -0.75 + i*0.19, el = 0.72 + Math.sin(i*1.7)*0.06;
      tuft(hairMat, headPt(az, el, 1.02), new THREE.Vector3(Math.sin(az)*0.5 + 0.35, 1.1, 0.75), 0.13 + (i%3)*0.015, 2.1);
    }
  } else if (L.style === 'swept') {
    for (let i=0;i<8;i++){ const az = -0.7 + i*0.2; tuft(hairMat, headPt(az, 0.8, 1.0), new THREE.Vector3(Math.sin(az)*0.3, 0.6, -1), 0.12, 2.0); }
    tuft(hairMat, headPt(0.15, 1.15, 1.02), new THREE.Vector3(0.3, 1, 0.2), 0.07, 2.4);
  } else if (L.style === 'short') {
    for (let i=0;i<7;i++){
      const az = -0.6 + i*0.2;
      tuft(hairMat, headPt(az, 0.86 + Math.sin(i*2.3)*0.04, 1.0), new THREE.Vector3(Math.sin(az)*0.4, 1, 0.55), 0.1, 1.5);
    }
  } else if (L.style === 'curls') {
    const rnd = (i) => (Math.sin(i*12.9898)*43758.5453) % 1;
    for (let i=0;i<140;i++){
      const az = -2.6 + Math.abs(rnd(i))*5.2, el = 0.25 + Math.abs(rnd(i+500))*1.3;
      if (Math.abs(az) < 0.9 && el < 0.62) continue;
      const c = sphere(0.1 + Math.abs(rnd(i+70))*0.07, hairMat); c.position.copy(headPt(az, el, 1.06 + Math.abs(rnd(i+900))*0.14)); look.add(c);
    }
    for (const s of [-1,1]) for (let j=0;j<5;j++){
      const c = sphere(0.12, hairMat); c.position.copy(headPt(s*(1.35+j*0.12), 0.1 - j*0.07, 1.12)); look.add(c);
    }
  }

  // Pupils + brows
  for (const s of [-1,1]) {
    const pupil = sphere(0.04, darkMat); pupil.position.set(0.3*s, 0.8, 0.735); look.add(pupil);
    const brow = sphere(0.1, plush(L.brow), 1.1, 0.28, 0.4);
    brow.position.set(0.3*s, 0.96, 0.66); brow.rotation.z = -0.12*s; look.add(brow);
  }
  if (L.grin) {
    const lip = new THREE.Mesh(new THREE.CircleGeometry(0.135, 40, Math.PI, Math.PI), new THREE.MeshStandardMaterial({ color:0x7a2d2a, roughness:0.6 }));
    lip.position.set(0, 0.395, 0.935); lip.rotation.x = 0.38; look.add(lip);
    const teeth = new THREE.Mesh(new THREE.CircleGeometry(0.12, 40, Math.PI, Math.PI), new THREE.MeshStandardMaterial({ color:0xfffdf6, roughness:0.3 }));
    teeth.scale.y = 0.55; teeth.position.set(0, 0.392, 0.94); teeth.rotation.x = 0.38; look.add(teeth);
  }
  if (L.stubble) {
    const mat = new THREE.MeshStandardMaterial({ color:L.stubble, alphaMap:stubbleAlpha(L.stubbleD), transparent:true, depthWrite:false, roughness:1 });
    const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 48, 36), mat);
    s1.scale.set(1.15*1.025, 0.85*1.025, 0.8*1.025); s1.position.copy(snout.position); look.add(s1);
    const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.78, 48, 36), mat);
    s2.scale.set(1.08*1.012, 0.96*1.012, 0.95*1.012); s2.position.set(0, 0.62, 0); look.add(s2);
  }
  if (L.glasses) {
    const frame = new THREE.MeshStandardMaterial({ color:L.glasses, metalness:0.6, roughness:0.3 });
    const lens = new THREE.MeshPhysicalMaterial({ color:0xffffff, transparent:true, opacity:0.25, roughness:0.05 });
    for (const s of [-1,1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.016, 10, 4), frame);
      rim.rotation.z = Math.PI/4; rim.scale.set(1.25, 0.8, 1); rim.position.set(0.3*s, 0.8, 0.8); look.add(rim);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.18), lens); glass.position.set(0.3*s, 0.8, 0.8); look.add(glass);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6), frame);
      arm.rotation.x = Math.PI/2; arm.position.set(0.52*s, 0.82, 0.5); arm.rotation.y = 0.35*s; look.add(arm);
    }
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16), frame);
    bridge.rotation.z = Math.PI/2; bridge.position.set(0, 0.84, 0.83); look.add(bridge);
  }

  // Clothes
  const map = L.top === 'sweater' ? knitTex : L.top === 'shirt' ? plaidTex(...L.plaid) : pique;
  const cloth = new THREE.MeshStandardMaterial({ color: L.top === 'shirt' ? 0xffffff : L.topColor, map, bumpMap:map, bumpScale:0.4, roughness:0.95 });
  group.add(sphere(BODY_R, cloth, BODY_S[0]*1.03, BODY_S[1]*1.03, BODY_S[2]*1.035));
  arms.forEach(a => a.arm.material = cloth);
  if (L.top === 'sweater') {
    const crew = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 16, 48), cloth);
    crew.rotation.x = Math.PI/2 - 0.25; crew.position.set(0, 0.96, 0.1); group.add(crew);
  } else {
    for (const s of [-1,1]) {
      const shape = new THREE.Shape(); shape.moveTo(0,0); shape.lineTo(0.32*s, 0.04); shape.lineTo(0.06*s, -0.3); shape.lineTo(0,0);
      const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth:0.03, bevelEnabled:false }), cloth);
      wing.position.set(0.02*s, 0.98, 0.5); wing.rotation.x = -0.5; group.add(wing);
    }
    if (L.top === 'polo') for (const y of [0.78, 0.64]) {
      const b = sphere(0.035, new THREE.MeshStandardMaterial({ color:0xf3d9d5 }), 1, 1, 0.4); b.position.set(0, y, 0.74); group.add(b);
    }
  }
  return { group, arms, ears, neck };
}

// Satellite kit: fishbowl helmet, backpack bus, two solar wings, antenna with a blinking light.
const panelTex = canvasTex(256, 128, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#1d3b7a'); grd.addColorStop(1, '#2c5bb0');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(190,215,255,.55)'; g.lineWidth = 2;
  for (let x=0;x<=w;x+=32){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,h); g.stroke(); }
  for (let y=0;y<=h;y+=32){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); }
  g.strokeStyle = '#c9d3e0'; g.lineWidth = 6; g.strokeRect(0, 0, w, h);
});
export function makeSatelliteBear(lookName) {
  const b = makeBear(lookName);
  const sat = new THREE.Group(); sat.add(b.group);
  const metal = new THREE.MeshStandardMaterial({ color:0xd9dde3, metalness:0.8, roughness:0.3 });
  const foil = new THREE.MeshStandardMaterial({ color:0xd4a64a, metalness:0.9, roughness:0.35 });
  // backpack bus in gold foil
  const pack = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.55), foil); pack.position.set(0, 0.2, -0.95); sat.add(pack);
  // solar wings on a boom
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.2, 12), metal);
  boom.rotation.z = Math.PI/2; boom.position.set(0, 0.25, -0.95); sat.add(boom);
  const panelMat = new THREE.MeshStandardMaterial({ map:panelTex, metalness:0.6, roughness:0.35, side:THREE.DoubleSide });
  const wings = [];
  for (const s of [-1, 1]) {
    const wing = new THREE.Group(); wing.position.set(s*1.15, 0.25, -0.95); sat.add(wing);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.04), panelMat); panel.position.x = s*0.8; wing.add(panel);
    wings.push(wing);
  }
  // fishbowl helmet + collar ring
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(1.32, 48, 36),
    new THREE.MeshPhysicalMaterial({ color:0xdff2ff, transparent:true, opacity:0.16, roughness:0.02, metalness:0, clearcoat:1, depthWrite:false }));
  helmet.position.set(0, 0.95 + 0.66, 0.02); helmet.renderOrder = 2; sat.add(helmet);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.09, 16, 48), metal);
  collar.rotation.x = Math.PI/2; collar.position.set(0, 0.78, 0.05); sat.add(collar);
  // antenna with blinking tip
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8), metal); ant.position.set(0.3, 1.15, -1.05); sat.add(ant);
  const blink = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color:0xff5a4a }));
  blink.position.set(0.3, 1.62, -1.05); sat.add(blink);
  return { ...b, sat, wings, blink };
}

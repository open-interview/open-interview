/**
 * 16-bit Pixel Art Illustration Generator v4
 * Smaller characters, guaranteed no overlaps
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const IMAGES_DIR = 'blog-output/images';
const W = 800, H = 500;

// Canvas is 800x500 pixels
// We'll work in a 200x125 grid (4px per unit)
const UNIT = 4;
const GW = 200; // grid width
const GH = 125; // grid height

const PAL = {
  bg: '#2C1810',
  floor: '#8B7355', floorLine: '#7A6448',
  wall: '#D4C4A8', wallDark: '#B8A888', wallLight: '#E8DCC8',
  skin: ['#FFE0BD', '#FFCD94', '#EAC086', '#C68642', '#8D5524'],
  hair: ['#1a1a1a', '#3D2314', '#8B6914', '#D4A84B', '#A0522D'],
  shirt: ['#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#F39C12', '#1ABC9C'],
  pants: '#2C3E50',
  shoes: '#1a1a1a',
  wood: '#A0522D', woodDark: '#8B4513',
  metal: '#95A5A6', metalDark: '#7F8C8D',
  screen: '#4FC3F7', screenDark: '#0288D1',
  plant: '#27AE60', plantDark: '#1E8449', pot: '#D35400',
  white: '#FFFFFF', black: '#000000',
  gray: '#BDC3C7',
  gold: '#FFD700', red: '#E74C3C', blue: '#3498DB', green: '#2ECC71',
};

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
let _id = 0;
const uid = () => `id${++_id}`;

const ANIM = {
  float: id => `@keyframes ${id}{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`,
  bounce: id => `@keyframes ${id}{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`,
};
let _styles = [];
const addAnim = (type) => { const id = uid(); addStyle(ANIM[type](id)); return id; };
const addStyle = css => { if (!_styles.includes(css)) _styles.push(css); };
const getStyles = () => _styles.join('\n');
const resetStyles = () => { _styles = []; _id = 0; };

// Draw a rectangle in grid units
const box = (x, y, w, h, fill) => 
  `<rect x="${x*UNIT}" y="${y*UNIT}" width="${w*UNIT}" height="${h*UNIT}" fill="${fill}"/>`;

// Simple character: 12 wide x 20 tall grid units
// Positioned by CENTER-BOTTOM (feet position)
function person(cx, by, opts = {}) {
  const { 
    skin = pick(PAL.skin), 
    hair = pick(PAL.hair), 
    shirt = pick(PAL.shirt),
    pose = 'stand',
    anim = null,
    delay = 0 
  } = opts;
  
  // Character bounds: x from cx-6 to cx+6, y from by-20 to by
  const x = cx - 6;
  const y = by - 20;
  
  let animAttr = '';
  if (anim === 'float') {
    const id = addAnim('float');
    animAttr = `style="animation:${id} 2s ease-in-out ${delay}s infinite"`;
  } else if (anim === 'bounce') {
    const id = addAnim('bounce');
    animAttr = `style="animation:${id} 0.6s ease-in-out ${delay}s infinite"`;
  }
  
  let s = `<g ${animAttr}>`;
  
  // Shadow
  s += `<ellipse cx="${cx*UNIT}" cy="${by*UNIT}" rx="${5*UNIT}" ry="${1.5*UNIT}" fill="rgba(0,0,0,0.2)"/>`;
  
  if (pose === 'sit') {
    // Sitting pose (shorter)
    const sy = y + 6; // shift down
    s += box(x+3, sy, 6, 3, hair);      // hair
    s += box(x+3, sy+3, 6, 4, skin);    // head
    s += box(x+4, sy+4, 1, 1, PAL.black); // eye
    s += box(x+7, sy+4, 1, 1, PAL.black); // eye
    s += box(x+2, sy+7, 8, 5, shirt);   // body
    s += box(x+1, sy+9, 2, 3, shirt);   // arm
    s += box(x+9, sy+9, 2, 3, shirt);   // arm
    s += box(x+2, sy+12, 8, 2, PAL.pants); // legs bent
    s += box(x+1, sy+13, 3, 2, PAL.shoes); // foot
    s += box(x+8, sy+13, 3, 2, PAL.shoes); // foot
  } else if (pose === 'wave') {
    s += box(x+3, y, 6, 3, hair);       // hair
    s += box(x+3, y+3, 6, 4, skin);     // head
    s += box(x+4, y+4, 1, 1, PAL.black);  // eye
    s += box(x+7, y+4, 1, 1, PAL.black);  // eye
    s += box(x+5, y+6, 2, 1, '#C4956A');  // smile
    s += box(x+2, y+7, 8, 6, shirt);    // body
    s += box(x+1, y+8, 2, 4, shirt);    // left arm down
    s += box(x+9, y+7, 2, 2, shirt);    // right arm up
    s += box(x+10, y+4, 2, 4, shirt);   // arm going up
    s += box(x+11, y+2, 2, 3, skin);    // hand waving
    s += box(x+3, y+13, 3, 6, PAL.pants); // leg
    s += box(x+6, y+13, 3, 6, PAL.pants); // leg
    s += box(x+3, y+19, 3, 1, PAL.shoes);
    s += box(x+6, y+19, 3, 1, PAL.shoes);
  } else if (pose === 'cheer') {
    s += box(x+3, y+1, 6, 3, hair);     // hair
    s += box(x+3, y+4, 6, 4, skin);     // head
    s += box(x+4, y+5, 1, 1, PAL.black);  // eye
    s += box(x+7, y+5, 1, 1, PAL.black);  // eye
    s += box(x+4, y+7, 4, 1, '#8B4513');  // open mouth
    s += box(x+2, y+8, 8, 6, shirt);    // body
    // Both arms up
    s += box(x, y+6, 2, 3, shirt);      // left arm
    s += box(x-1, y+3, 2, 4, skin);     // left hand
    s += box(x+10, y+6, 2, 3, shirt);   // right arm
    s += box(x+11, y+3, 2, 4, skin);    // right hand
    s += box(x+3, y+14, 3, 5, PAL.pants);
    s += box(x+6, y+14, 3, 5, PAL.pants);
    s += box(x+3, y+19, 3, 1, PAL.shoes);
    s += box(x+6, y+19, 3, 1, PAL.shoes);
  } else {
    // Standing (default)
    s += box(x+3, y, 6, 3, hair);       // hair
    s += box(x+3, y+3, 6, 4, skin);     // head
    s += box(x+4, y+4, 1, 1, PAL.black);  // eye
    s += box(x+7, y+4, 1, 1, PAL.black);  // eye
    s += box(x+2, y+7, 8, 6, shirt);    // body
    s += box(x+1, y+8, 2, 4, shirt);    // left arm
    s += box(x+9, y+8, 2, 4, shirt);    // right arm
    s += box(x+1, y+12, 2, 1, skin);    // left hand
    s += box(x+9, y+12, 2, 1, skin);    // right hand
    s += box(x+3, y+13, 3, 6, PAL.pants); // left leg
    s += box(x+6, y+13, 3, 6, PAL.pants); // right leg
    s += box(x+3, y+19, 3, 1, PAL.shoes);
    s += box(x+6, y+19, 3, 1, PAL.shoes);
  }
  
  s += '</g>';
  return s;
}

// Objects
function desk(x, y, w = 40) {
  let s = '';
  s += box(x, y-8, w, 2, PAL.wood);
  s += box(x, y-6, w, 1, PAL.woodDark);
  s += box(x+2, y-5, w-4, 4, PAL.woodDark);
  s += box(x+3, y-1, 2, 3, PAL.woodDark);
  s += box(x+w-5, y-1, 2, 3, PAL.woodDark);
  return s;
}

function chair(x, y, color = '#E74C3C') {
  let s = '';
  s += box(x, y-12, 10, 2, color);
  s += box(x+1, y-10, 8, 6, color);
  s += box(x, y-4, 10, 2, color);
  s += box(x+1, y-2, 2, 4, PAL.metal);
  s += box(x+7, y-2, 2, 4, PAL.metal);
  return s;
}

function monitor(x, y, w = 22, h = 14) {
  let s = '';
  s += box(x, y-h-4, w, h, PAL.metalDark);
  s += box(x+1, y-h-3, w-2, h-2, PAL.black);
  s += box(x+2, y-h-2, w-4, h-4, PAL.screen);
  // Code lines
  s += box(x+3, y-h, 8, 1, '#FFF');
  s += box(x+3, y-h+2, 12, 1, '#AED581');
  s += box(x+3, y-h+4, 6, 1, '#FFB74D');
  s += box(x+3, y-h+6, 10, 1, '#4FC3F7');
  // Stand
  s += box(x+w/2-2, y-4, 4, 2, PAL.metal);
  s += box(x+w/2-4, y-2, 8, 2, PAL.metalDark);
  return s;
}

function laptop(x, y) {
  let s = '';
  s += box(x, y-10, 18, 8, PAL.metalDark);
  s += box(x+1, y-9, 16, 6, PAL.screen);
  s += box(x+2, y-8, 6, 1, '#FFF');
  s += box(x+2, y-6, 10, 1, '#AED581');
  s += box(x-1, y-2, 20, 3, PAL.metal);
  return s;
}

function plant(x, y) {
  let s = '';
  s += box(x+2, y-16, 6, 8, PAL.plant);
  s += box(x+1, y-14, 3, 5, PAL.plantDark);
  s += box(x+6, y-13, 3, 4, PAL.plantDark);
  s += box(x+3, y-8, 4, 2, PAL.plantDark);
  s += box(x+2, y-6, 6, 6, PAL.pot);
  s += box(x+3, y-6, 4, 1, '#3E2723');
  return s;
}

function windowObj(x, y, w = 24, h = 30) {
  let s = '';
  s += box(x, y, w, h, PAL.white);
  s += box(x+2, y+2, w-4, h-4, '#87CEEB');
  s += box(x+w-8, y+4, 4, 4, '#FFD93D'); // sun
  s += box(x+4, y+8, 6, 2, PAL.white); // cloud
  s += box(x+w/2-1, y, 2, h, PAL.white); // cross
  s += box(x, y+h/2-1, w, 2, PAL.white);
  return s;
}

function whiteboard(x, y, w = 40, h = 24) {
  let s = '';
  s += box(x, y, w, h, PAL.white);
  s += box(x, y, w, 1, PAL.gray);
  s += box(x, y+h-1, w, 1, PAL.gray);
  s += box(x, y, 1, h, PAL.gray);
  s += box(x+w-1, y, 1, h, PAL.gray);
  s += box(x+3, y+4, w*0.5, 2, PAL.blue);
  s += box(x+3, y+8, w*0.7, 2, PAL.red);
  s += box(x+3, y+12, w*0.4, 2, PAL.green);
  s += box(x+3, y+16, w*0.6, 2, PAL.blue);
  return s;
}

function speechBubble(x, y, text) {
  const w = Math.max(text.length * 2.5 + 6, 16);
  let s = '';
  s += box(x, y, w, 8, PAL.white);
  s += box(x+2, y+8, 2, 2, PAL.white);
  s += box(x, y, w, 0.5, PAL.gray);
  s += box(x, y+7.5, w, 0.5, PAL.gray);
  s += box(x, y, 0.5, 8, PAL.gray);
  s += box(x+w-0.5, y, 0.5, 8, PAL.gray);
  s += `<text x="${(x+3)*UNIT}" y="${(y+5.5)*UNIT}" fill="${PAL.black}" font-size="${UNIT*2.8}" font-family="monospace" font-weight="bold">${text}</text>`;
  return s;
}

function trophy(x, y) {
  let s = '';
  s += box(x+4, y, 12, 3, PAL.gold);
  s += box(x+6, y+3, 8, 10, PAL.gold);
  s += box(x+2, y+3, 4, 4, PAL.gold);
  s += box(x+14, y+3, 4, 4, PAL.gold);
  s += box(x+7, y+13, 6, 4, PAL.gold);
  s += box(x+5, y+17, 10, 3, '#B8860B');
  return s;
}

function star(x, y, c = PAL.gold) {
  let s = '';
  s += box(x+2, y, 2, 2, c);
  s += box(x, y+2, 6, 2, c);
  s += box(x+1, y+4, 4, 2, c);
  s += box(x, y+5, 2, 2, c);
  s += box(x+4, y+5, 2, 2, c);
  return s;
}

function clock(x, y) {
  let s = '';
  s += box(x, y, 12, 12, PAL.white);
  s += box(x+1, y+1, 10, 10, '#F5F5F5');
  s += box(x+5, y+3, 1, 4, PAL.black);
  s += box(x+5, y+6, 4, 1, PAL.black);
  return s;
}

function codePanel(x, y, w = 30, h = 24) {
  let s = '';
  s += box(x, y, w, h, '#1a1a2e');
  s += box(x+2, y+3, 12, 1, '#AED581');
  s += box(x+2, y+6, 20, 1, '#4FC3F7');
  s += box(x+2, y+9, 8, 1, '#FFB74D');
  s += box(x+2, y+12, 16, 1, '#F48FB1');
  s += box(x+2, y+15, 10, 1, '#AED581');
  s += box(x+2, y+18, 18, 1, '#4FC3F7');
  return s;
}

function videoPanel(x, y) {
  let s = '';
  s += box(x, y, 40, 36, PAL.metalDark);
  s += box(x+1, y+1, 38, 34, '#1a1a2e');
  // 4 video boxes
  s += box(x+3, y+3, 15, 13, '#2C3E50');
  s += box(x+21, y+3, 15, 13, '#2C3E50');
  s += box(x+3, y+19, 15, 13, '#2C3E50');
  s += box(x+21, y+19, 15, 13, '#2C3E50');
  // Face circles
  s += `<circle cx="${(x+10.5)*UNIT}" cy="${(y+9.5)*UNIT}" r="${4*UNIT}" fill="${PAL.skin[0]}"/>`;
  s += `<circle cx="${(x+28.5)*UNIT}" cy="${(y+9.5)*UNIT}" r="${4*UNIT}" fill="${PAL.skin[1]}"/>`;
  s += `<circle cx="${(x+10.5)*UNIT}" cy="${(y+25.5)*UNIT}" r="${4*UNIT}" fill="${PAL.skin[2]}"/>`;
  s += `<circle cx="${(x+28.5)*UNIT}" cy="${(y+25.5)*UNIT}" r="${4*UNIT}" fill="${PAL.skin[3]}"/>`;
  return s;
}

// Background
function background() {
  let s = '';
  s += box(0, 0, GW, 75, PAL.wall);
  s += box(0, 72, GW, 3, PAL.wallDark);
  s += box(0, 75, GW, 50, PAL.floor);
  for (let i = 0; i < GW; i += 12) s += box(i, 75, 0.5, 50, PAL.floorLine);
  return s;
}

function darkBackground() {
  let s = '';
  s += box(0, 0, GW, GH, '#1a1a2e');
  s += box(0, 85, GW, 40, '#2C3E50');
  return s;
}

// Additional tech objects
function server(x, y) {
  let s = '';
  s += box(x, y, 14, 28, '#2C3E50');
  s += box(x+1, y+2, 12, 4, '#1a1a2e');
  s += box(x+2, y+3, 2, 2, '#2ECC71'); // green LED
  s += box(x+10, y+3, 2, 2, '#3498DB'); // blue LED
  s += box(x+1, y+8, 12, 4, '#1a1a2e');
  s += box(x+2, y+9, 2, 2, '#2ECC71');
  s += box(x+1, y+14, 12, 4, '#1a1a2e');
  s += box(x+2, y+15, 2, 2, '#E74C3C'); // red LED
  s += box(x+1, y+20, 12, 4, '#1a1a2e');
  s += box(x+2, y+21, 2, 2, '#2ECC71');
  return s;
}

function database(x, y) {
  let s = '';
  s += `<ellipse cx="${(x+10)*UNIT}" cy="${(y+3)*UNIT}" rx="${10*UNIT}" ry="${3*UNIT}" fill="#3498DB"/>`;
  s += box(x, y+3, 20, 16, '#3498DB');
  s += `<ellipse cx="${(x+10)*UNIT}" cy="${(y+19)*UNIT}" rx="${10*UNIT}" ry="${3*UNIT}" fill="#2980B9"/>`;
  s += `<ellipse cx="${(x+10)*UNIT}" cy="${(y+11)*UNIT}" rx="${10*UNIT}" ry="${3*UNIT}" fill="#2980B9" opacity="0.5"/>`;
  return s;
}

function cloud(x, y, size = 1) {
  const s = size;
  let r = '';
  r += `<ellipse cx="${(x+8*s)*UNIT}" cy="${(y+6*s)*UNIT}" rx="${8*s*UNIT}" ry="${6*s*UNIT}" fill="#ECF0F1"/>`;
  r += `<ellipse cx="${(x+18*s)*UNIT}" cy="${(y+8*s)*UNIT}" rx="${10*s*UNIT}" ry="${7*s*UNIT}" fill="#ECF0F1"/>`;
  r += `<ellipse cx="${(x+30*s)*UNIT}" cy="${(y+6*s)*UNIT}" rx="${8*s*UNIT}" ry="${6*s*UNIT}" fill="#ECF0F1"/>`;
  return r;
}

function apiBox(x, y, label = 'API') {
  let s = '';
  s += box(x, y, 24, 14, '#9B59B6');
  s += box(x+1, y+1, 22, 12, '#8E44AD');
  s += `<text x="${(x+12)*UNIT}" y="${(y+9)*UNIT}" text-anchor="middle" fill="#FFF" font-size="${UNIT*3}" font-family="monospace" font-weight="bold">${label}</text>`;
  return s;
}

function gitBranch(x, y) {
  let s = '';
  // Main branch line
  s += box(x, y+8, 40, 2, '#2ECC71');
  // Branch point
  s += `<circle cx="${(x+15)*UNIT}" cy="${(y+9)*UNIT}" r="${2*UNIT}" fill="#2ECC71"/>`;
  // Feature branch
  s += box(x+15, y+2, 2, 6, '#3498DB');
  s += box(x+15, y+2, 20, 2, '#3498DB');
  s += `<circle cx="${(x+35)*UNIT}" cy="${(y+3)*UNIT}" r="${2*UNIT}" fill="#3498DB"/>`;
  // Merge point
  s += `<circle cx="${(x+35)*UNIT}" cy="${(y+9)*UNIT}" r="${2*UNIT}" fill="#2ECC71"/>`;
  // Commits
  s += `<circle cx="${(x+5)*UNIT}" cy="${(y+9)*UNIT}" r="${1.5*UNIT}" fill="#FFF"/>`;
  s += `<circle cx="${(x+25)*UNIT}" cy="${(y+9)*UNIT}" r="${1.5*UNIT}" fill="#FFF"/>`;
  return s;
}

function terminal(x, y, w = 35, h = 22) {
  let s = '';
  s += box(x, y, w, h, '#1a1a2e');
  s += box(x, y, w, 3, '#2C3E50');
  s += `<circle cx="${(x+2)*UNIT}" cy="${(y+1.5)*UNIT}" r="${UNIT}" fill="#E74C3C"/>`;
  s += `<circle cx="${(x+5)*UNIT}" cy="${(y+1.5)*UNIT}" r="${UNIT}" fill="#F1C40F"/>`;
  s += `<circle cx="${(x+8)*UNIT}" cy="${(y+1.5)*UNIT}" r="${UNIT}" fill="#2ECC71"/>`;
  s += box(x+2, y+5, 2, 2, '#2ECC71');
  s += box(x+5, y+5, 15, 2, '#FFF');
  s += box(x+2, y+9, 2, 2, '#2ECC71');
  s += box(x+5, y+9, 20, 2, '#4FC3F7');
  s += box(x+2, y+13, 2, 2, '#2ECC71');
  s += box(x+5, y+13, 8, 2, '#F1C40F');
  s += box(x+2, y+17, 4, 2, '#2ECC71'); // cursor
  return s;
}

function mobilePhone(x, y) {
  let s = '';
  s += box(x, y, 12, 22, '#2C3E50');
  s += box(x+1, y+2, 10, 17, '#4FC3F7');
  s += box(x+4, y+1, 4, 1, '#1a1a2e'); // speaker
  s += `<circle cx="${(x+6)*UNIT}" cy="${(y+20.5)*UNIT}" r="${1.5*UNIT}" fill="#1a1a2e"/>`;
  // App icons
  s += box(x+2, y+3, 3, 3, '#E74C3C');
  s += box(x+6, y+3, 3, 3, '#2ECC71');
  s += box(x+2, y+7, 3, 3, '#3498DB');
  s += box(x+6, y+7, 3, 3, '#F1C40F');
  return s;
}

function rocket(x, y) {
  let s = '';
  // Body
  s += box(x+4, y, 8, 18, '#ECF0F1');
  s += box(x+5, y+4, 6, 4, '#3498DB'); // window
  // Nose
  s += box(x+5, y-3, 6, 3, '#E74C3C');
  s += box(x+6, y-5, 4, 2, '#E74C3C');
  // Fins
  s += box(x, y+14, 4, 6, '#E74C3C');
  s += box(x+12, y+14, 4, 6, '#E74C3C');
  // Flames
  s += box(x+5, y+18, 2, 4, '#F1C40F');
  s += box(x+9, y+18, 2, 4, '#F1C40F');
  s += box(x+6, y+20, 4, 3, '#E74C3C');
  return s;
}

function bug(x, y) {
  let s = '';
  s += `<ellipse cx="${(x+6)*UNIT}" cy="${(y+8)*UNIT}" rx="${6*UNIT}" ry="${8*UNIT}" fill="#E74C3C"/>`;
  s += box(x+2, y+2, 3, 3, PAL.white); // eye
  s += box(x+7, y+2, 3, 3, PAL.white);
  s += box(x+3, y+3, 1, 1, PAL.black);
  s += box(x+8, y+3, 1, 1, PAL.black);
  // Legs
  s += box(x-2, y+5, 3, 1, '#C0392B');
  s += box(x+11, y+5, 3, 1, '#C0392B');
  s += box(x-2, y+9, 3, 1, '#C0392B');
  s += box(x+11, y+9, 3, 1, '#C0392B');
  // Antennae
  s += box(x+3, y-2, 1, 3, '#C0392B');
  s += box(x+8, y-2, 1, 3, '#C0392B');
  return s;
}

function checkmark(x, y, c = '#2ECC71') {
  let s = '';
  s += box(x, y+6, 2, 4, c);
  s += box(x+2, y+8, 2, 4, c);
  s += box(x+4, y+6, 2, 4, c);
  s += box(x+6, y+4, 2, 4, c);
  s += box(x+8, y+2, 2, 4, c);
  s += box(x+10, y, 2, 4, c);
  return s;
}

function lock(x, y) {
  let s = '';
  s += box(x+2, y, 8, 6, 'transparent');
  s += `<rect x="${(x+2)*UNIT}" y="${y*UNIT}" width="${8*UNIT}" height="${6*UNIT}" fill="none" stroke="#F1C40F" stroke-width="${UNIT}"/>`;
  s += box(x, y+6, 12, 10, '#F1C40F');
  s += box(x+5, y+9, 2, 4, '#1a1a2e');
  return s;
}

function lightningBolt(x, y, c = '#F1C40F') {
  let s = '';
  s += box(x+6, y, 4, 4, c);
  s += box(x+4, y+4, 4, 4, c);
  s += box(x+2, y+8, 8, 2, c);
  s += box(x+4, y+10, 4, 4, c);
  s += box(x+2, y+14, 4, 4, c);
  return s;
}

function gear(x, y, c = '#95A5A6') {
  let s = '';
  s += `<circle cx="${(x+8)*UNIT}" cy="${(y+8)*UNIT}" r="${6*UNIT}" fill="${c}"/>`;
  s += `<circle cx="${(x+8)*UNIT}" cy="${(y+8)*UNIT}" r="${2*UNIT}" fill="#2C3E50"/>`;
  // Teeth
  s += box(x+6, y-1, 4, 3, c);
  s += box(x+6, y+14, 4, 3, c);
  s += box(x-1, y+6, 3, 4, c);
  s += box(x+14, y+6, 3, 4, c);
  return s;
}

function chartBar(x, y, w = 40, h = 24) {
  let s = '';
  s += box(x, y, w, h, '#1a1a2e');
  // Bars
  s += box(x+4, y+16, 5, 6, '#E74C3C');
  s += box(x+11, y+10, 5, 12, '#3498DB');
  s += box(x+18, y+6, 5, 16, '#2ECC71');
  s += box(x+25, y+12, 5, 10, '#F1C40F');
  s += box(x+32, y+4, 5, 18, '#9B59B6');
  // Axis
  s += box(x+2, y+22, w-4, 1, '#FFF');
  s += box(x+2, y+2, 1, 20, '#FFF');
  return s;
}

function pieChart(x, y) {
  let s = '';
  const cx = x + 12, cy = y + 12, r = 12;
  s += `<circle cx="${cx*UNIT}" cy="${cy*UNIT}" r="${r*UNIT}" fill="#3498DB"/>`;
  // Slices (simplified as boxes for pixel look)
  s += box(x, y, 12, 12, '#E74C3C');
  s += box(x+12, y+12, 12, 12, '#2ECC71');
  s += box(x, y+12, 6, 12, '#F1C40F');
  return s;
}

// SCENES - Character width is 12 units, so minimum spacing is 20 units
const FLOOR = 100; // y position of floor for standing

const SCENES = {
  collaboration: () => {
    let s = background();
    
    // Window (left)
    s += windowObj(5, 15, 22, 28);
    
    // Whiteboard (center-left wall)
    s += whiteboard(35, 12, 38, 22);
    
    // Desk with sitting person (left side)
    s += desk(8, FLOOR, 35);
    s += chair(18, FLOOR, '#3498DB');
    s += laptop(12, FLOOR-8);
    s += person(24, FLOOR, { pose: 'sit', shirt: '#3498DB', anim: 'float' });
    
    // Two standing people (right side, 30 units apart)
    s += person(110, FLOOR, { pose: 'stand', shirt: '#E74C3C' });
    s += person(150, FLOOR, { pose: 'stand', shirt: '#2ECC71', anim: 'float', delay: 0.3 });
    
    // Plant (far right)
    s += plant(180, FLOOR);
    
    // Speech bubble
    s += speechBubble(120, 50, 'Great!');
    
    return s;
  },

  remote: () => {
    let s = background();
    
    // Window
    s += windowObj(5, 12, 26, 32);
    
    // Desk with person (center)
    s += desk(45, FLOOR, 50);
    s += chair(65, FLOOR, '#9B59B6');
    s += monitor(52, FLOOR-8, 24, 16);
    s += laptop(80, FLOOR-8);
    s += person(70, FLOOR, { pose: 'sit', shirt: '#9B59B6', anim: 'float' });
    
    // Video call panel (right wall)
    s += videoPanel(130, 15);
    
    // Plant
    s += plant(180, FLOOR);
    
    return s;
  },

  meeting: () => {
    let s = background();
    
    // Whiteboard
    s += whiteboard(5, 10, 45, 26);
    
    // Presenter (left, standing)
    s += person(25, FLOOR, { pose: 'stand', shirt: '#E74C3C', anim: 'float' });
    
    // Conference table
    s += desk(70, FLOOR, 70);
    
    // Two attendees (well spaced - 40 units apart)
    s += chair(85, FLOOR, '#3498DB');
    s += person(90, FLOOR, { pose: 'sit', shirt: '#3498DB' });
    
    s += chair(125, FLOOR, '#2ECC71');
    s += person(130, FLOOR, { pose: 'sit', shirt: '#2ECC71', anim: 'float', delay: 0.2 });
    
    // Laptops
    s += laptop(78, FLOOR-8);
    s += laptop(118, FLOOR-8);
    
    // Speech bubble
    s += speechBubble(35, 28, 'Q3 Goals');
    
    // Plant
    s += plant(175, FLOOR);
    
    return s;
  },

  coding: () => {
    let s = background();
    
    // Dual monitor desk
    s += desk(10, FLOOR, 55);
    s += monitor(15, FLOOR-8, 22, 14);
    s += monitor(40, FLOOR-8, 22, 14);
    s += chair(32, FLOOR, '#1ABC9C');
    s += person(38, FLOOR, { pose: 'sit', shirt: '#1ABC9C', anim: 'float' });
    
    // Code panel on wall
    s += codePanel(90, 15, 35, 28);
    
    // Colleague (far right)
    s += person(160, FLOOR, { pose: 'stand', shirt: '#E74C3C', anim: 'float', delay: 0.5 });
    
    // Speech bubble
    s += speechBubble(145, 52, 'LGTM!');
    
    // Plant
    s += plant(180, FLOOR);
    
    return s;
  },

  success: () => {
    let s = darkBackground();
    
    // Trophy (center top)
    s += trophy(90, 25);
    
    // Stars
    s += star(75, 20);
    s += star(120, 18);
    s += star(70, 40);
    s += star(125, 38);
    
    // Confetti (fixed positions)
    const colors = [PAL.red, PAL.blue, PAL.green, PAL.gold, '#E91E63'];
    [[20,15],[45,10],[70,8],[130,12],[155,18],[180,10],[35,25],[165,22]].forEach((p, i) => {
      s += box(p[0], p[1], 2, 2, colors[i % colors.length]);
    });
    
    // Four celebrating people (40 units apart)
    s += person(35, FLOOR, { pose: 'cheer', shirt: '#E74C3C', anim: 'bounce' });
    s += person(80, FLOOR, { pose: 'wave', shirt: '#3498DB', anim: 'bounce', delay: 0.1 });
    s += person(125, FLOOR, { pose: 'cheer', shirt: '#2ECC71', anim: 'bounce', delay: 0.2 });
    s += person(170, FLOOR, { pose: 'cheer', shirt: '#9B59B6', anim: 'bounce', delay: 0.3 });
    
    // Speech bubble
    s += speechBubble(75, 5, 'We did it!');
    
    return s;
  },

  brainstorm: () => {
    let s = background();
    
    // Whiteboard with sticky notes
    s += whiteboard(5, 8, 50, 28);
    // Sticky notes
    s += box(10, 12, 8, 6, '#FFEB3B');
    s += box(22, 10, 8, 6, '#FF7043');
    s += box(34, 14, 8, 6, '#4FC3F7');
    s += box(12, 22, 8, 6, '#AED581');
    s += box(26, 20, 8, 6, '#F48FB1');
    s += box(40, 24, 8, 6, '#CE93D8');
    
    // Light bulb
    s += box(150, 12, 8, 10, '#FFEB3B');
    s += box(151, 22, 6, 3, PAL.gray);
    s += box(146, 8, 2, 2, '#FFF');
    s += box(160, 10, 2, 2, '#FFF');
    
    // Three people (40 units apart)
    s += person(75, FLOOR, { pose: 'stand', shirt: '#E74C3C', anim: 'float' });
    s += person(120, FLOOR, { pose: 'stand', shirt: '#3498DB' });
    s += person(165, FLOOR, { pose: 'wave', shirt: '#2ECC71', anim: 'float', delay: 0.4 });
    
    // Speech bubbles
    s += speechBubble(60, 48, 'What if...');
    s += speechBubble(150, 45, 'Yes!');
    
    return s;
  },

  default: () => {
    let s = background();
    s += windowObj(5, 12, 24, 30);
    s += desk(40, FLOOR, 55);
    s += chair(62, FLOOR, '#3498DB');
    s += monitor(48, FLOOR-8, 24, 16);
    s += laptop(76, FLOOR-8);
    s += person(68, FLOOR, { pose: 'sit', shirt: '#3498DB', anim: 'float' });
    s += clock(140, 20);
    s += plant(170, FLOOR);
    return s;
  },

  // === TECHNICAL SCENES ===
  
  devops: () => {
    let s = darkBackground();
    // Server rack
    s += server(10, 55);
    s += server(28, 55);
    s += server(46, 55);
    // Cloud
    s += cloud(70, 8, 1.2);
    // Arrows connecting
    s += box(60, 70, 20, 2, '#3498DB');
    s += box(78, 60, 2, 12, '#3498DB');
    // Terminal
    s += terminal(120, 50, 40, 26);
    // DevOps engineer
    s += person(175, FLOOR, { pose: 'stand', shirt: '#1ABC9C', anim: 'float' });
    s += speechBubble(155, 48, 'Deployed!');
    return s;
  },

  api: () => {
    let s = darkBackground();
    // API boxes
    s += apiBox(20, 30, 'REST');
    s += apiBox(60, 30, 'GraphQL');
    s += apiBox(100, 30, 'gRPC');
    // Connecting lines
    s += box(44, 36, 16, 2, '#F1C40F');
    s += box(84, 36, 16, 2, '#F1C40F');
    // Database
    s += database(140, 25);
    s += box(124, 36, 16, 2, '#F1C40F');
    // Developer
    s += desk(30, FLOOR, 50);
    s += chair(50, FLOOR, '#3498DB');
    s += laptop(38, FLOOR-8);
    s += person(55, FLOOR, { pose: 'sit', shirt: '#3498DB', anim: 'float' });
    // Another dev
    s += person(140, FLOOR, { pose: 'stand', shirt: '#E74C3C' });
    s += speechBubble(125, 55, 'JSON');
    return s;
  },

  database: () => {
    let s = darkBackground();
    // Multiple databases
    s += database(20, 30);
    s += database(60, 30);
    s += database(100, 30);
    // Labels
    s += `<text x="${30*UNIT}" y="${60*UNIT}" text-anchor="middle" fill="#FFF" font-size="${UNIT*2.5}" font-family="monospace">SQL</text>`;
    s += `<text x="${70*UNIT}" y="${60*UNIT}" text-anchor="middle" fill="#FFF" font-size="${UNIT*2.5}" font-family="monospace">NoSQL</text>`;
    s += `<text x="${110*UNIT}" y="${60*UNIT}" text-anchor="middle" fill="#FFF" font-size="${UNIT*2.5}" font-family="monospace">Cache</text>`;
    // DBA
    s += desk(130, FLOOR, 45);
    s += chair(148, FLOOR, '#9B59B6');
    s += monitor(138, FLOOR-8, 22, 14);
    s += person(153, FLOOR, { pose: 'sit', shirt: '#9B59B6', anim: 'float' });
    return s;
  },

  security: () => {
    let s = darkBackground();
    // Shield/Lock
    s += lock(90, 20);
    // Security elements
    s += box(70, 45, 60, 2, '#2ECC71');
    s += checkmark(75, 50);
    s += checkmark(95, 50);
    s += checkmark(115, 50);
    // Terminal with security scan
    s += terminal(10, 40, 45, 30);
    // Security engineer
    s += person(160, FLOOR, { pose: 'stand', shirt: '#E74C3C', anim: 'float' });
    s += speechBubble(140, 50, 'Secure!');
    return s;
  },

  debugging: () => {
    let s = background();
    // Bug
    s += bug(85, 15);
    // X mark over bug
    s += box(83, 13, 2, 20, '#E74C3C');
    s += box(95, 13, 2, 20, '#E74C3C');
    // Terminal
    s += terminal(120, 15, 40, 28);
    // Developer at desk
    s += desk(10, FLOOR, 50);
    s += chair(30, FLOOR, '#F39C12');
    s += monitor(18, FLOOR-8, 24, 16);
    s += person(35, FLOOR, { pose: 'sit', shirt: '#F39C12', anim: 'float' });
    s += speechBubble(50, 55, 'Found it!');
    // Colleague helping
    s += person(170, FLOOR, { pose: 'stand', shirt: '#3498DB' });
    return s;
  },

  testing: () => {
    let s = background();
    // Test results panel
    s += box(10, 15, 50, 35, '#1a1a2e');
    s += box(12, 18, 46, 3, '#2C3E50');
    s += `<text x="${35*UNIT}" y="${21*UNIT}" text-anchor="middle" fill="#FFF" font-size="${UNIT*2}" font-family="monospace">Test Results</text>`;
    s += checkmark(15, 25, '#2ECC71');
    s += `<text x="${32*UNIT}" y="${31*UNIT}" fill="#2ECC71" font-size="${UNIT*2}" font-family="monospace">✓ 42 passed</text>`;
    s += checkmark(15, 35, '#2ECC71');
    s += `<text x="${32*UNIT}" y="${41*UNIT}" fill="#2ECC71" font-size="${UNIT*2}" font-family="monospace">✓ 0 failed</text>`;
    // QA engineer
    s += desk(80, FLOOR, 45);
    s += chair(98, FLOOR, '#2ECC71');
    s += monitor(88, FLOOR-8, 22, 14);
    s += person(103, FLOOR, { pose: 'sit', shirt: '#2ECC71', anim: 'float' });
    // Celebrating
    s += person(165, FLOOR, { pose: 'cheer', shirt: '#3498DB', anim: 'bounce' });
    return s;
  },

  git: () => {
    let s = background();
    // Git branch visualization
    s += gitBranch(30, 25);
    s += gitBranch(30, 50);
    // Labels
    s += `<text x="${10*UNIT}" y="${34*UNIT}" fill="#2ECC71" font-size="${UNIT*2.5}" font-family="monospace">main</text>`;
    s += `<text x="${10*UNIT}" y="${59*UNIT}" fill="#3498DB" font-size="${UNIT*2.5}" font-family="monospace">feat</text>`;
    // Developer
    s += desk(100, FLOOR, 50);
    s += chair(120, FLOOR, '#F39C12');
    s += laptop(108, FLOOR-8);
    s += person(125, FLOOR, { pose: 'sit', shirt: '#F39C12', anim: 'float' });
    s += speechBubble(140, 55, 'Merged!');
    return s;
  },

  deploy: () => {
    let s = darkBackground();
    // Rocket
    s += rocket(90, 20);
    // Stars
    s += star(30, 15);
    s += star(60, 25);
    s += star(130, 10);
    s += star(160, 30);
    // Cloud
    s += cloud(140, 50, 0.8);
    // Two celebrating devs
    s += person(40, FLOOR, { pose: 'cheer', shirt: '#E74C3C', anim: 'bounce' });
    s += person(170, FLOOR, { pose: 'wave', shirt: '#3498DB', anim: 'bounce', delay: 0.2 });
    s += speechBubble(75, 5, 'Launched!');
    return s;
  },

  mobile: () => {
    let s = background();
    // Large phone mockup
    s += box(80, 15, 40, 65, '#2C3E50');
    s += box(82, 20, 36, 55, '#4FC3F7');
    s += box(95, 17, 10, 2, '#1a1a2e');
    // App content
    s += box(85, 25, 30, 8, '#FFF');
    s += box(85, 36, 14, 14, '#E74C3C');
    s += box(101, 36, 14, 14, '#2ECC71');
    s += box(85, 53, 14, 14, '#3498DB');
    s += box(101, 53, 14, 14, '#F1C40F');
    // Mobile dev
    s += desk(10, FLOOR, 45);
    s += chair(28, FLOOR, '#9B59B6');
    s += laptop(18, FLOOR-8);
    s += person(33, FLOOR, { pose: 'sit', shirt: '#9B59B6', anim: 'float' });
    // Small phone
    s += mobilePhone(160, 60);
    s += person(175, FLOOR, { pose: 'stand', shirt: '#1ABC9C' });
    return s;
  },

  cloud: () => {
    let s = darkBackground();
    // Big cloud
    s += cloud(60, 10, 1.5);
    // Services in cloud
    s += apiBox(70, 35, 'λ');
    s += database(105, 30);
    s += server(140, 35);
    // Arrows down
    s += box(80, 55, 2, 15, '#F1C40F');
    s += box(115, 55, 2, 15, '#F1C40F');
    s += box(145, 55, 2, 15, '#F1C40F');
    // Cloud architect
    s += person(30, FLOOR, { pose: 'stand', shirt: '#F39C12', anim: 'float' });
    s += person(180, FLOOR, { pose: 'stand', shirt: '#3498DB' });
    s += speechBubble(10, 50, 'Scalable!');
    return s;
  },

  analytics: () => {
    let s = background();
    // Charts
    s += chartBar(10, 20, 45, 28);
    s += pieChart(70, 22);
    // Trend line
    s += box(120, 40, 50, 20, '#1a1a2e');
    s += box(125, 55, 5, 2, '#2ECC71');
    s += box(132, 50, 5, 2, '#2ECC71');
    s += box(139, 45, 5, 2, '#2ECC71');
    s += box(146, 40, 5, 2, '#2ECC71');
    s += box(153, 35, 5, 2, '#2ECC71');
    // Data analyst
    s += desk(60, FLOOR, 50);
    s += chair(80, FLOOR, '#9B59B6');
    s += monitor(68, FLOOR-8, 24, 16);
    s += person(85, FLOOR, { pose: 'sit', shirt: '#9B59B6', anim: 'float' });
    s += speechBubble(100, 55, '+25%!');
    // Plant
    s += plant(175, FLOOR);
    return s;
  },

  performance: () => {
    let s = darkBackground();
    // Speed gauge
    s += `<circle cx="${100*UNIT}" cy="${50*UNIT}" r="${30*UNIT}" fill="#2C3E50"/>`;
    s += `<circle cx="${100*UNIT}" cy="${50*UNIT}" r="${25*UNIT}" fill="#1a1a2e"/>`;
    s += box(98, 30, 4, 18, '#2ECC71'); // needle pointing up (fast)
    s += `<text x="${100*UNIT}" y="${70*UNIT}" text-anchor="middle" fill="#2ECC71" font-size="${UNIT*3}" font-family="monospace">FAST</text>`;
    // Lightning bolts
    s += lightningBolt(30, 30);
    s += lightningBolt(160, 35);
    // Performance engineer
    s += person(50, FLOOR, { pose: 'cheer', shirt: '#2ECC71', anim: 'bounce' });
    s += person(155, FLOOR, { pose: 'stand', shirt: '#3498DB', anim: 'float' });
    s += speechBubble(135, 50, '10ms!');
    return s;
  },

  architecture: () => {
    let s = background();
    // Architecture diagram on whiteboard
    s += whiteboard(5, 8, 70, 40);
    // Boxes representing services
    s += box(12, 14, 15, 8, '#3498DB');
    s += box(32, 14, 15, 8, '#E74C3C');
    s += box(52, 14, 15, 8, '#2ECC71');
    s += box(22, 28, 15, 8, '#F1C40F');
    s += box(42, 28, 15, 8, '#9B59B6');
    // Connecting lines
    s += box(27, 22, 1, 6, '#333');
    s += box(47, 22, 1, 6, '#333');
    s += box(29, 32, 13, 1, '#333');
    // Architect
    s += person(95, FLOOR, { pose: 'stand', shirt: '#1ABC9C', anim: 'float' });
    // Team member
    s += person(145, FLOOR, { pose: 'stand', shirt: '#E74C3C' });
    s += speechBubble(125, 50, 'Microservices');
    s += plant(180, FLOOR);
    return s;
  },

  agile: () => {
    let s = background();
    // Kanban board
    s += box(5, 10, 80, 50, '#FFF');
    s += box(5, 10, 80, 6, '#2C3E50');
    // Columns
    s += box(31, 16, 1, 44, '#BDC3C7');
    s += box(58, 16, 1, 44, '#BDC3C7');
    // Headers
    s += `<text x="${18*UNIT}" y="${14*UNIT}" text-anchor="middle" fill="#FFF" font-size="${UNIT*2}" font-family="monospace">TODO</text>`;
    s += `<text x="${44*UNIT}" y="${14*UNIT}" text-anchor="middle" fill="#FFF" font-size="${UNIT*2}" font-family="monospace">DOING</text>`;
    s += `<text x="${70*UNIT}" y="${14*UNIT}" text-anchor="middle" fill="#FFF" font-size="${UNIT*2}" font-family="monospace">DONE</text>`;
    // Cards
    s += box(8, 20, 20, 8, '#FFEB3B');
    s += box(8, 30, 20, 8, '#FFEB3B');
    s += box(35, 20, 20, 8, '#4FC3F7');
    s += box(62, 20, 20, 8, '#AED581');
    s += box(62, 30, 20, 8, '#AED581');
    s += box(62, 40, 20, 8, '#AED581');
    // Scrum master
    s += person(110, FLOOR, { pose: 'stand', shirt: '#E74C3C', anim: 'float' });
    // Team
    s += person(155, FLOOR, { pose: 'stand', shirt: '#3498DB' });
    s += speechBubble(90, 50, 'Sprint!');
    return s;
  },

  learning: () => {
    let s = background();
    // Book/documentation
    s += box(10, 25, 35, 30, '#3498DB');
    s += box(12, 27, 31, 26, '#FFF');
    s += box(14, 30, 27, 2, '#333');
    s += box(14, 35, 20, 2, '#333');
    s += box(14, 40, 25, 2, '#333');
    s += box(14, 45, 15, 2, '#333');
    // Video/tutorial
    s += box(55, 20, 45, 30, '#1a1a2e');
    s += box(57, 22, 41, 26, '#2C3E50');
    // Play button
    s += box(73, 30, 10, 12, '#E74C3C');
    // Light bulb (learning)
    s += box(150, 15, 10, 14, '#FFEB3B');
    s += box(152, 29, 6, 4, PAL.gray);
    // Student
    s += desk(110, FLOOR, 45);
    s += chair(128, FLOOR, '#9B59B6');
    s += laptop(118, FLOOR-8);
    s += person(133, FLOOR, { pose: 'sit', shirt: '#9B59B6', anim: 'float' });
    s += speechBubble(145, 55, 'Aha!');
    return s;
  },

  interview: () => {
    let s = background();
    // Whiteboard with code
    s += whiteboard(5, 10, 50, 30);
    s += box(10, 15, 40, 2, '#333');
    s += box(12, 20, 35, 2, '#3498DB');
    s += box(12, 25, 25, 2, '#2ECC71');
    // Interviewer desk
    s += desk(100, FLOOR, 45);
    s += chair(118, FLOOR, '#2C3E50');
    s += laptop(108, FLOOR-8);
    s += person(123, FLOOR, { pose: 'sit', shirt: '#2C3E50' });
    // Candidate at whiteboard
    s += person(45, FLOOR, { pose: 'stand', shirt: '#3498DB', anim: 'float' });
    s += speechBubble(55, 50, 'O(n log n)');
    s += plant(175, FLOOR);
    return s;
  },

  startup: () => {
    let s = darkBackground();
    // Rocket launching
    s += rocket(85, 15);
    // Stars
    s += star(20, 10);
    s += star(50, 25);
    s += star(140, 15);
    s += star(170, 30);
    // Growth chart
    s += box(10, 55, 40, 25, '#1a1a2e');
    s += box(15, 75, 5, 3, '#2ECC71');
    s += box(22, 70, 5, 8, '#2ECC71');
    s += box(29, 63, 5, 15, '#2ECC71');
    s += box(36, 55, 5, 23, '#2ECC71');
    // Founders
    s += person(130, FLOOR, { pose: 'cheer', shirt: '#E74C3C', anim: 'bounce' });
    s += person(175, FLOOR, { pose: 'wave', shirt: '#3498DB', anim: 'bounce', delay: 0.2 });
    s += speechBubble(110, 50, 'Series A!');
    return s;
  },

  opensource: () => {
    let s = background();
    // GitHub-style contribution graph
    s += box(10, 20, 70, 35, '#1a1a2e');
    const greens = ['#0e4429', '#006d32', '#26a641', '#39d353'];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 12; col++) {
        const c = greens[Math.floor(Math.random() * greens.length)];
        s += box(14 + col * 5, 25 + row * 6, 4, 4, c);
      }
    }
    // Star count
    s += star(90, 25);
    s += `<text x="${105*UNIT}" y="${32*UNIT}" fill="#F1C40F" font-size="${UNIT*3}" font-family="monospace">1.2k</text>`;
    // Fork icon
    s += gitBranch(90, 45);
    // Contributor
    s += person(150, FLOOR, { pose: 'wave', shirt: '#2ECC71', anim: 'float' });
    s += speechBubble(130, 50, 'PR merged!');
    return s;
  },

  review: () => {
    let s = background();
    // Code review panel
    s += box(5, 15, 60, 40, '#1a1a2e');
    s += box(7, 18, 56, 3, '#2C3E50');
    // Diff view
    s += box(7, 24, 56, 4, '#3E2723'); // deleted line
    s += box(7, 30, 56, 4, '#1B5E20'); // added line
    s += box(7, 36, 56, 4, '#1B5E20');
    s += box(7, 42, 56, 4, '#333');
    s += box(7, 48, 56, 4, '#1B5E20');
    // Comment
    s += box(70, 30, 35, 15, '#FFF');
    s += `<text x="${87*UNIT}" y="${40*UNIT}" text-anchor="middle" fill="#333" font-size="${UNIT*2}" font-family="monospace">LGTM! 👍</text>`;
    // Reviewer
    s += desk(120, FLOOR, 45);
    s += chair(138, FLOOR, '#E74C3C');
    s += monitor(128, FLOOR-8, 22, 14);
    s += person(143, FLOOR, { pose: 'sit', shirt: '#E74C3C', anim: 'float' });
    return s;
  },

  monitoring: () => {
    let s = darkBackground();
    // Dashboard with multiple panels
    s += box(5, 10, 90, 55, '#2C3E50');
    // CPU panel
    s += box(8, 13, 40, 23, '#1a1a2e');
    s += `<text x="${28*UNIT}" y="${20*UNIT}" text-anchor="middle" fill="#FFF" font-size="${UNIT*2}" font-family="monospace">CPU: 45%</text>`;
    s += box(12, 25, 32, 8, '#333');
    s += box(12, 25, 14, 8, '#2ECC71');
    // Memory panel
    s += box(52, 13, 40, 23, '#1a1a2e');
    s += `<text x="${72*UNIT}" y="${20*UNIT}" text-anchor="middle" fill="#FFF" font-size="${UNIT*2}" font-family="monospace">MEM: 72%</text>`;
    s += box(56, 25, 32, 8, '#333');
    s += box(56, 25, 23, 8, '#F1C40F');
    // Alerts panel
    s += box(8, 40, 84, 22, '#1a1a2e');
    s += checkmark(12, 45, '#2ECC71');
    s += `<text x="${35*UNIT}" y="${52*UNIT}" fill="#2ECC71" font-size="${UNIT*2}" font-family="monospace">All systems operational</text>`;
    // SRE
    s += person(130, FLOOR, { pose: 'stand', shirt: '#1ABC9C', anim: 'float' });
    s += person(175, FLOOR, { pose: 'stand', shirt: '#3498DB' });
    return s;
  },
};

const KEYWORDS = {
  collaboration: ['collaboration', 'team', 'together', 'pair', 'group', 'teamwork', 'cooperat'],
  remote: ['remote', 'home', 'wfh', 'distributed', 'virtual', 'video', 'hybrid', 'zoom'],
  meeting: ['meeting', 'standup', 'presentation', 'demo', 'sync', 'planning', 'review', 'retro'],
  coding: ['code', 'coding', 'programming', 'develop', 'software', 'engineer', 'implement'],
  success: ['success', 'celebrate', 'win', 'achieve', 'launch', 'milestone', 'ship', 'release', 'congrat'],
  brainstorm: ['brainstorm', 'idea', 'ideation', 'creative', 'innovation', 'workshop'],
  // Technical scenes
  devops: ['devops', 'deploy', 'ci/cd', 'pipeline', 'jenkins', 'docker', 'kubernetes', 'k8s', 'container', 'infrastructure'],
  api: ['api', 'rest', 'graphql', 'endpoint', 'microservice', 'service', 'integration', 'webhook'],
  database: ['database', 'sql', 'nosql', 'mongo', 'postgres', 'mysql', 'redis', 'data', 'query', 'schema'],
  security: ['security', 'auth', 'authentication', 'authorization', 'encrypt', 'ssl', 'https', 'vulnerability', 'penetration'],
  debugging: ['debug', 'bug', 'fix', 'issue', 'error', 'troubleshoot', 'investigate', 'trace', 'breakpoint'],
  testing: ['test', 'testing', 'qa', 'quality', 'unit', 'integration', 'e2e', 'coverage', 'jest', 'cypress'],
  git: ['git', 'github', 'gitlab', 'version', 'branch', 'merge', 'commit', 'pull request', 'pr'],
  deploy: ['deploy', 'deployment', 'release', 'production', 'staging', 'rollout', 'ship'],
  mobile: ['mobile', 'ios', 'android', 'app', 'react native', 'flutter', 'swift', 'kotlin'],
  cloud: ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'lambda', 'function', 's3', 'ec2'],
  analytics: ['analytics', 'metrics', 'dashboard', 'report', 'data', 'insight', 'kpi', 'chart', 'graph'],
  performance: ['performance', 'speed', 'optimize', 'fast', 'latency', 'cache', 'cdn', 'load'],
  architecture: ['architecture', 'design', 'system', 'scalab', 'pattern', 'microservice', 'monolith', 'diagram'],
  agile: ['agile', 'scrum', 'kanban', 'sprint', 'backlog', 'story', 'epic', 'jira', 'ticket'],
  learning: ['learn', 'tutorial', 'course', 'training', 'onboard', 'documentation', 'guide', 'education'],
  interview: ['interview', 'hiring', 'recruit', 'candidate', 'whiteboard', 'algorithm', 'leetcode'],
  startup: ['startup', 'founder', 'entrepreneur', 'mvp', 'funding', 'investor', 'pitch', 'growth'],
  opensource: ['opensource', 'open source', 'contributor', 'community', 'fork', 'star', 'license', 'maintainer'],
  review: ['review', 'code review', 'pr review', 'feedback', 'approve', 'comment', 'diff'],
  monitoring: ['monitor', 'observability', 'logging', 'alert', 'grafana', 'prometheus', 'datadog', 'sre', 'uptime'],
};

function detectScene(title, content = '') {
  const text = `${title} ${content}`.toLowerCase();
  let best = 'default', score = 0;
  for (const [scene, kws] of Object.entries(KEYWORDS)) {
    const s = kws.filter(k => text.includes(k)).length;
    if (s > score) { score = s; best = scene; }
  }
  return best;
}

function generateSVG(sceneType, title) {
  resetStyles();
  
  const scene = SCENES[sceneType] || SCENES.default;
  const content = scene();
  const styles = getStyles();
  const esc = t => String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs><style>${styles}</style></defs>
  <rect width="${W}" height="${H}" fill="${PAL.bg}"/>
  ${content}
  <rect x="${W*0.1}" y="${H-50}" width="${W*0.8}" height="38" rx="6" fill="rgba(0,0,0,0.8)"/>
  <text x="${W/2}" y="${H-25}" text-anchor="middle" fill="${PAL.white}" font-size="16" font-family="monospace" font-weight="bold">${esc(title.substring(0,40))}</text>
</svg>`;
}

async function ensureDir() {
  try { await fs.promises.mkdir(IMAGES_DIR, { recursive: true }); } catch {}
}

export async function generatePixelIllustration(title, content = '', filename = null, options = {}) {
  await ensureDir();
  const sceneType = options.scene || detectScene(title, content);
  const svg = generateSVG(sceneType, title);
  const hash = crypto.createHash('md5').update(String(title)).digest('hex').slice(0, 8);
  const outputFilename = filename || `pixel-${hash}`;
  const outputPath = path.join(IMAGES_DIR, `${outputFilename}.svg`);
  await fs.promises.writeFile(outputPath, svg, 'utf-8');
  return { path: outputPath, scene: sceneType, filename: `${outputFilename}.svg` };
}

export function generatePixelSceneSVG(sceneName, title = '') {
  resetStyles();
  return generateSVG(sceneName, title || sceneName.charAt(0).toUpperCase() + sceneName.slice(1));
}

export function getAvailablePixelScenes() {
  return Object.keys(SCENES);
}

export { detectScene as detectPixelScene };

export default {
  generatePixelIllustration,
  generatePixelSceneSVG,
  getAvailablePixelScenes,
  detectPixelScene: detectScene,
};

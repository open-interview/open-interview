/**
 * Cartoon Illustration Generator
 * Modern flat-style cartoon strips inspired by LinkedIn/corporate illustrations
 * Features: Warm colors, stylized humans, office scenes, playful aesthetic
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const IMAGES_DIR = 'blog-output/images';
const W = 800, H = 500;

// Warm, modern color palette (LinkedIn-style)
const PALETTE = {
  // Backgrounds
  cream: '#FAF5F0',
  warmWhite: '#FDF8F3',
  softPeach: '#FFE8D6',
  
  // Primary accent colors
  orange: '#E86A33',
  coral: '#F4845F',
  mustard: '#E5A84B',
  teal: '#2D8B8B',
  navy: '#1E3A5F',
  
  // Skin tones (diverse)
  skin1: '#FFDAB9',
  skin2: '#D4A574',
  skin3: '#8D5524',
  skin4: '#C68642',
  skin5: '#E0AC69',
  
  // Hair colors
  hairBlack: '#2C2C2C',
  hairBrown: '#5C4033',
  hairBlonde: '#D4A84B',
  hairRed: '#B55239',
  hairGray: '#8B8B8B',
  
  // Clothing colors
  blue: '#4A90D9',
  green: '#5BA88B',
  purple: '#7B68A6',
  red: '#D64545',
  pink: '#E8A0BF',
  gray: '#6B7280',
  darkGray: '#374151',
  
  // UI elements
  white: '#FFFFFF',
  lightGray: '#E5E7EB',
  shadow: 'rgba(0,0,0,0.1)',
};

// Randomize from array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const skinTones = [PALETTE.skin1, PALETTE.skin2, PALETTE.skin3, PALETTE.skin4, PALETTE.skin5];
const hairColors = [PALETTE.hairBlack, PALETTE.hairBrown, PALETTE.hairBlonde, PALETTE.hairRed, PALETTE.hairGray];
const clothingColors = [PALETTE.blue, PALETTE.green, PALETTE.purple, PALETTE.red, PALETTE.orange, PALETTE.teal, PALETTE.navy, PALETTE.coral];


// ============== HUMAN FIGURE COMPONENTS ==============

/**
 * Generate a stylized cartoon person
 * @param {number} x - Center X position
 * @param {number} y - Base Y position (feet level)
 * @param {object} options - Customization options
 */
function person(x, y, options = {}) {
  const {
    scale = 1,
    skin = pick(skinTones),
    hair = pick(hairColors),
    shirt = pick(clothingColors),
    pants = PALETTE.darkGray,
    pose = 'standing',
    facing = 'right',
    hasLaptop = false,
    hasPhone = false,
    sitting = false,
  } = options;

  const s = scale;
  const flip = facing === 'left' ? -1 : 1;
  
  // Adjust Y for sitting
  const baseY = sitting ? y - 30 * s : y;
  
  // Body proportions (cartoon style - larger head)
  const headRadius = 22 * s;
  const bodyHeight = 45 * s;
  const legLength = 40 * s;
  const armLength = 35 * s;
  
  const headY = baseY - legLength - bodyHeight - headRadius;
  const shoulderY = baseY - legLength - bodyHeight + 10 * s;
  const hipY = baseY - legLength;
  
  let svg = `<g class="person" transform="translate(${x}, 0)">`;
  
  // Shadow
  svg += `<ellipse cx="0" cy="${y + 5}" rx="${20 * s}" ry="${6 * s}" fill="${PALETTE.shadow}"/>`;
  
  // Legs
  if (sitting) {
    // Sitting legs (bent forward)
    svg += `<path d="M${-8 * s} ${hipY} Q${-15 * s} ${hipY + 20 * s} ${-25 * s} ${hipY + 25 * s}" 
            stroke="${pants}" stroke-width="${12 * s}" stroke-linecap="round" fill="none"/>`;
    svg += `<path d="M${8 * s} ${hipY} Q${15 * s} ${hipY + 20 * s} ${25 * s} ${hipY + 25 * s}" 
            stroke="${pants}" stroke-width="${12 * s}" stroke-linecap="round" fill="none"/>`;
  } else {
    // Standing legs
    svg += `<path d="M${-8 * s} ${hipY} L${-10 * s} ${y}" 
            stroke="${pants}" stroke-width="${12 * s}" stroke-linecap="round" fill="none"/>`;
    svg += `<path d="M${8 * s} ${hipY} L${10 * s} ${y}" 
            stroke="${pants}" stroke-width="${12 * s}" stroke-linecap="round" fill="none"/>`;
  }
  
  // Shoes
  if (!sitting) {
    svg += `<ellipse cx="${-10 * s}" cy="${y}" rx="${10 * s}" ry="${5 * s}" fill="${PALETTE.darkGray}"/>`;
    svg += `<ellipse cx="${10 * s}" cy="${y}" rx="${10 * s}" ry="${5 * s}" fill="${PALETTE.darkGray}"/>`;
  }
  
  // Body/Torso
  svg += `<path d="M0 ${shoulderY} L0 ${hipY}" 
          stroke="${shirt}" stroke-width="${24 * s}" stroke-linecap="round" fill="none"/>`;
  
  // Arms based on pose
  const armY = shoulderY + 5 * s;
  if (pose === 'waving') {
    svg += `<path d="M${-12 * s * flip} ${armY} Q${-30 * s * flip} ${armY - 20 * s} ${-25 * s * flip} ${armY - 40 * s}" 
            stroke="${shirt}" stroke-width="${10 * s}" stroke-linecap="round" fill="none"/>`;
    svg += `<circle cx="${-25 * s * flip}" cy="${armY - 42 * s}" r="${7 * s}" fill="${skin}"/>`;
    svg += `<path d="M${12 * s * flip} ${armY} L${25 * s * flip} ${armY + 25 * s}" 
            stroke="${shirt}" stroke-width="${10 * s}" stroke-linecap="round" fill="none"/>`;
    svg += `<circle cx="${25 * s * flip}" cy="${armY + 27 * s}" r="${7 * s}" fill="${skin}"/>`;
  } else if (pose === 'pointing') {
    svg += `<path d="M${12 * s * flip} ${armY} L${40 * s * flip} ${armY - 15 * s}" 
            stroke="${shirt}" stroke-width="${10 * s}" stroke-linecap="round" fill="none"/>`;
    svg += `<circle cx="${42 * s * flip}" cy="${armY - 17 * s}" r="${7 * s}" fill="${skin}"/>`;
    svg += `<path d="M${-12 * s * flip} ${armY} L${-20 * s * flip} ${armY + 20 * s}" 
            stroke="${shirt}" stroke-width="${10 * s}" stroke-linecap="round" fill="none"/>`;
  } else if (hasLaptop || sitting) {
    // Arms forward for laptop
    svg += `<path d="M${-12 * s} ${armY} Q${-20 * s} ${armY + 10 * s} ${-15 * s} ${armY + 25 * s}" 
            stroke="${shirt}" stroke-width="${10 * s}" stroke-linecap="round" fill="none"/>`;
    svg += `<path d="M${12 * s} ${armY} Q${20 * s} ${armY + 10 * s} ${15 * s} ${armY + 25 * s}" 
            stroke="${shirt}" stroke-width="${10 * s}" stroke-linecap="round" fill="none"/>`;
    svg += `<circle cx="${-15 * s}" cy="${armY + 27 * s}" r="${7 * s}" fill="${skin}"/>`;
    svg += `<circle cx="${15 * s}" cy="${armY + 27 * s}" r="${7 * s}" fill="${skin}"/>`;
  } else {
    // Default standing arms
    svg += `<path d="M${-12 * s} ${armY} L${-18 * s} ${armY + armLength}" 
            stroke="${shirt}" stroke-width="${10 * s}" stroke-linecap="round" fill="none"/>`;
    svg += `<path d="M${12 * s} ${armY} L${18 * s} ${armY + armLength}" 
            stroke="${shirt}" stroke-width="${10 * s}" stroke-linecap="round" fill="none"/>`;
    svg += `<circle cx="${-18 * s}" cy="${armY + armLength + 2 * s}" r="${7 * s}" fill="${skin}"/>`;
    svg += `<circle cx="${18 * s}" cy="${armY + armLength + 2 * s}" r="${7 * s}" fill="${skin}"/>`;
  }
  
  // Head
  svg += `<circle cx="0" cy="${headY}" r="${headRadius}" fill="${skin}"/>`;
  
  // Hair (different styles)
  const hairStyle = Math.floor(Math.random() * 4);
  if (hairStyle === 0) {
    // Short hair
    svg += `<path d="M${-headRadius * 0.9} ${headY - 5 * s} 
            Q${-headRadius * 0.5} ${headY - headRadius * 1.3} 0 ${headY - headRadius * 1.1}
            Q${headRadius * 0.5} ${headY - headRadius * 1.3} ${headRadius * 0.9} ${headY - 5 * s}" 
            fill="${hair}"/>`;
  } else if (hairStyle === 1) {
    // Longer hair
    svg += `<ellipse cx="0" cy="${headY - 8 * s}" rx="${headRadius * 1.1}" ry="${headRadius * 0.8}" fill="${hair}"/>`;
    svg += `<path d="M${-headRadius * 1.1} ${headY - 5 * s} L${-headRadius * 1.2} ${headY + 15 * s}" 
            stroke="${hair}" stroke-width="${8 * s}" stroke-linecap="round"/>`;
    svg += `<path d="M${headRadius * 1.1} ${headY - 5 * s} L${headRadius * 1.2} ${headY + 15 * s}" 
            stroke="${hair}" stroke-width="${8 * s}" stroke-linecap="round"/>`;
  } else if (hairStyle === 2) {
    // Bun/top knot
    svg += `<circle cx="0" cy="${headY - headRadius - 5 * s}" r="${10 * s}" fill="${hair}"/>`;
    svg += `<path d="M${-headRadius * 0.8} ${headY - 10 * s} Q0 ${headY - headRadius * 1.2} ${headRadius * 0.8} ${headY - 10 * s}" 
            fill="${hair}"/>`;
  } else {
    // Curly/afro
    svg += `<circle cx="0" cy="${headY - 5 * s}" r="${headRadius * 1.2}" fill="${hair}"/>`;
  }
  
  // Face
  const eyeY = headY - 3 * s;
  const eyeSpacing = 8 * s;
  // Eyes
  svg += `<circle cx="${-eyeSpacing}" cy="${eyeY}" r="${3 * s}" fill="${PALETTE.white}"/>`;
  svg += `<circle cx="${eyeSpacing}" cy="${eyeY}" r="${3 * s}" fill="${PALETTE.white}"/>`;
  svg += `<circle cx="${-eyeSpacing + 1 * s * flip}" cy="${eyeY}" r="${2 * s}" fill="${PALETTE.hairBlack}"/>`;
  svg += `<circle cx="${eyeSpacing + 1 * s * flip}" cy="${eyeY}" r="${2 * s}" fill="${PALETTE.hairBlack}"/>`;
  
  // Smile
  svg += `<path d="M${-6 * s} ${headY + 6 * s} Q0 ${headY + 12 * s} ${6 * s} ${headY + 6 * s}" 
          stroke="${PALETTE.hairBlack}" stroke-width="${2 * s}" fill="none" stroke-linecap="round"/>`;
  
  // Glasses (random)
  if (Math.random() > 0.6) {
    svg += `<circle cx="${-eyeSpacing}" cy="${eyeY}" r="${6 * s}" fill="none" stroke="${PALETTE.darkGray}" stroke-width="${1.5 * s}"/>`;
    svg += `<circle cx="${eyeSpacing}" cy="${eyeY}" r="${6 * s}" fill="none" stroke="${PALETTE.darkGray}" stroke-width="${1.5 * s}"/>`;
    svg += `<line x1="${-eyeSpacing + 6 * s}" y1="${eyeY}" x2="${eyeSpacing - 6 * s}" y2="${eyeY}" stroke="${PALETTE.darkGray}" stroke-width="${1.5 * s}"/>`;
  }
  
  svg += '</g>';
  return svg;
}


// ============== FURNITURE & OBJECTS ==============

function desk(x, y, width = 120, height = 60) {
  return `
    <g class="desk">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="${PALETTE.mustard}"/>
      <rect x="${x}" y="${y}" width="${width}" height="8" rx="4" fill="${PALETTE.orange}" opacity="0.3"/>
      <rect x="${x + 10}" y="${y + height}" width="12" height="40" fill="${PALETTE.mustard}"/>
      <rect x="${x + width - 22}" y="${y + height}" width="12" height="40" fill="${PALETTE.mustard}"/>
    </g>
  `;
}

function chair(x, y, color = PALETTE.teal) {
  return `
    <g class="chair">
      <rect x="${x}" y="${y}" width="50" height="8" rx="4" fill="${color}"/>
      <rect x="${x + 5}" y="${y - 50}" width="40" height="50" rx="8" fill="${color}"/>
      <rect x="${x + 20}" y="${y + 8}" width="10" height="30" fill="${PALETTE.darkGray}"/>
      <ellipse cx="${x + 25}" cy="${y + 40}" rx="20" ry="6" fill="${PALETTE.darkGray}"/>
    </g>
  `;
}

function laptop(x, y, scale = 1) {
  const s = scale;
  return `
    <g class="laptop">
      <rect x="${x}" y="${y}" width="${60 * s}" height="${40 * s}" rx="4" fill="${PALETTE.gray}"/>
      <rect x="${x + 3 * s}" y="${y + 3 * s}" width="${54 * s}" height="${34 * s}" rx="2" fill="#4A90D9"/>
      <rect x="${x - 5 * s}" y="${y + 40 * s}" width="${70 * s}" height="${5 * s}" rx="2" fill="${PALETTE.gray}"/>
    </g>
  `;
}

function monitor(x, y, scale = 1) {
  const s = scale;
  return `
    <g class="monitor">
      <rect x="${x}" y="${y}" width="${80 * s}" height="${55 * s}" rx="4" fill="${PALETTE.darkGray}"/>
      <rect x="${x + 4 * s}" y="${y + 4 * s}" width="${72 * s}" height="${47 * s}" rx="2" fill="#4A90D9"/>
      <rect x="${x + 35 * s}" y="${y + 55 * s}" width="${10 * s}" height="${15 * s}" fill="${PALETTE.darkGray}"/>
      <rect x="${x + 25 * s}" y="${y + 70 * s}" width="${30 * s}" height="${5 * s}" rx="2" fill="${PALETTE.darkGray}"/>
    </g>
  `;
}

function plant(x, y, scale = 1) {
  const s = scale;
  return `
    <g class="plant">
      <rect x="${x}" y="${y}" width="${25 * s}" height="${30 * s}" rx="4" fill="${PALETTE.coral}"/>
      <ellipse cx="${x + 12.5 * s}" cy="${y - 5 * s}" rx="${20 * s}" ry="${25 * s}" fill="${PALETTE.green}"/>
      <ellipse cx="${x + 5 * s}" cy="${y - 15 * s}" rx="${12 * s}" ry="${18 * s}" fill="${PALETTE.teal}"/>
      <ellipse cx="${x + 20 * s}" cy="${y - 10 * s}" rx="${10 * s}" ry="${15 * s}" fill="#5BA88B"/>
    </g>
  `;
}

function coffeeTable(x, y) {
  return `
    <g class="coffee-table">
      <ellipse cx="${x}" cy="${y}" rx="40" ry="20" fill="${PALETTE.mustard}"/>
      <rect x="${x - 5}" y="${y}" width="10" height="35" fill="${PALETTE.mustard}"/>
    </g>
  `;
}

function whiteboard(x, y, width = 150, height = 100) {
  return `
    <g class="whiteboard">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="${PALETTE.white}" stroke="${PALETTE.gray}" stroke-width="3"/>
      <line x1="${x + 20}" y1="${y + 25}" x2="${x + width - 20}" y2="${y + 25}" stroke="${PALETTE.blue}" stroke-width="2"/>
      <line x1="${x + 20}" y1="${y + 45}" x2="${x + width - 40}" y2="${y + 45}" stroke="${PALETTE.orange}" stroke-width="2"/>
      <line x1="${x + 20}" y1="${y + 65}" x2="${x + width - 30}" y2="${y + 65}" stroke="${PALETTE.teal}" stroke-width="2"/>
      <rect x="${x + 20}" y="${y + 75}" width="30" height="15" rx="2" fill="${PALETTE.coral}" opacity="0.5"/>
      <rect x="${x + 60}" y="${y + 75}" width="40" height="15" rx="2" fill="${PALETTE.teal}" opacity="0.5"/>
    </g>
  `;
}

function bookshelf(x, y, width = 80, height = 120) {
  return `
    <g class="bookshelf">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${PALETTE.mustard}"/>
      <rect x="${x + 5}" y="${y + 10}" width="15" height="25" fill="${PALETTE.blue}"/>
      <rect x="${x + 22}" y="${y + 10}" width="12" height="25" fill="${PALETTE.coral}"/>
      <rect x="${x + 36}" y="${y + 10}" width="18" height="25" fill="${PALETTE.teal}"/>
      <rect x="${x + 56}" y="${y + 10}" width="14" height="25" fill="${PALETTE.purple}"/>
      <rect x="${x}" y="${y + 40}" width="${width}" height="4" fill="${PALETTE.orange}" opacity="0.3"/>
      <rect x="${x + 8}" y="${y + 50}" width="20" height="22" fill="${PALETTE.green}"/>
      <rect x="${x + 30}" y="${y + 50}" width="16" height="22" fill="${PALETTE.orange}"/>
      <rect x="${x + 50}" y="${y + 50}" width="22" height="22" fill="${PALETTE.navy}"/>
      <rect x="${x}" y="${y + 78}" width="${width}" height="4" fill="${PALETTE.orange}" opacity="0.3"/>
    </g>
  `;
}

function pictureFrame(x, y, width = 60, height = 45, color = PALETTE.coral) {
  return `
    <g class="picture-frame">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="2" fill="${PALETTE.white}" stroke="${PALETTE.darkGray}" stroke-width="3"/>
      <rect x="${x + 5}" y="${y + 5}" width="${width - 10}" height="${height - 10}" fill="${color}" opacity="0.6"/>
      <circle cx="${x + width/2}" cy="${y + height/2}" r="${Math.min(width, height) * 0.25}" fill="${PALETTE.white}" opacity="0.4"/>
    </g>
  `;
}

function window(x, y, width = 100, height = 120) {
  return `
    <g class="window">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#87CEEB" rx="4"/>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${PALETTE.white}" stroke-width="8" rx="4"/>
      <line x1="${x + width/2}" y1="${y}" x2="${x + width/2}" y2="${y + height}" stroke="${PALETTE.white}" stroke-width="4"/>
      <line x1="${x}" y1="${y + height/2}" x2="${x + width}" y2="${y + height/2}" stroke="${PALETTE.white}" stroke-width="4"/>
    </g>
  `;
}

function speechBubble(x, y, text, tailDirection = 'bottom-left') {
  const padding = 15;
  const fontSize = 14;
  const lines = text.split('\n');
  const maxLineLength = Math.max(...lines.map(l => l.length));
  const width = Math.max(80, maxLineLength * 8 + padding * 2);
  const height = lines.length * 20 + padding * 2;
  
  let tailPath = '';
  if (tailDirection === 'bottom-left') {
    tailPath = `M${x + 20} ${y + height} L${x + 10} ${y + height + 15} L${x + 35} ${y + height}`;
  } else if (tailDirection === 'bottom-right') {
    tailPath = `M${x + width - 35} ${y + height} L${x + width - 10} ${y + height + 15} L${x + width - 20} ${y + height}`;
  }
  
  return `
    <g class="speech-bubble">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${PALETTE.white}" stroke="${PALETTE.lightGray}" stroke-width="2"/>
      <path d="${tailPath}" fill="${PALETTE.white}" stroke="${PALETTE.lightGray}" stroke-width="2"/>
      <rect x="${x}" y="${y + height - 5}" width="${width}" height="10" fill="${PALETTE.white}"/>
      ${lines.map((line, i) => `<text x="${x + padding}" y="${y + padding + 12 + i * 20}" fill="${PALETTE.darkGray}" font-size="${fontSize}" font-family="system-ui, -apple-system, sans-serif">${line}</text>`).join('')}
    </g>
  `;
}


// ============== SCENE PANELS ==============

function scenePanel(x, y, width, height, bgColor, content) {
  return `
    <g class="scene-panel">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${bgColor}"/>
      ${content}
    </g>
  `;
}

function floatingShape(x, y, type = 'square', size = 20, color = PALETTE.coral, opacity = 0.6) {
  if (type === 'square') {
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="3" fill="${color}" opacity="${opacity}"/>`;
  } else if (type === 'circle') {
    return `<circle cx="${x + size/2}" cy="${y + size/2}" r="${size/2}" fill="${color}" opacity="${opacity}"/>`;
  } else if (type === 'diamond') {
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2" fill="${color}" opacity="${opacity}" transform="rotate(45 ${x + size/2} ${y + size/2})"/>`;
  }
  return '';
}

// ============== SCENE COMPOSITIONS ==============

const SCENES = {
  // Office meeting scene
  meeting: (title) => {
    return `
      ${scenePanel(40, 30, 320, 280, PALETTE.mustard, `
        ${whiteboard(70, 50, 120, 80)}
        ${person(120, 260, { pose: 'pointing', facing: 'right', scale: 0.8 })}
        ${person(220, 260, { pose: 'standing', facing: 'left', scale: 0.8 })}
        ${person(280, 260, { pose: 'standing', facing: 'left', scale: 0.75 })}
      `)}
      ${scenePanel(380, 30, 180, 130, PALETTE.softPeach, `
        ${desk(400, 80, 80, 30)}
        ${person(440, 150, { sitting: true, scale: 0.6, hasLaptop: true })}
        ${laptop(415, 60, 0.6)}
      `)}
      ${scenePanel(580, 30, 180, 130, PALETTE.coral, `
        ${person(620, 120, { pose: 'waving', scale: 0.65 })}
        ${person(700, 120, { scale: 0.6, facing: 'left' })}
        ${person(740, 120, { scale: 0.55, facing: 'left' })}
      `)}
      ${scenePanel(380, 180, 380, 130, PALETTE.teal, `
        ${coffeeTable(480, 260)}
        ${person(420, 280, { sitting: true, scale: 0.7 })}
        ${person(540, 280, { sitting: true, scale: 0.7, facing: 'left' })}
        ${person(620, 280, { scale: 0.65 })}
      `)}
      ${floatingShape(30, 320, 'square', 25, PALETTE.coral)}
      ${floatingShape(750, 20, 'circle', 30, PALETTE.teal, 0.4)}
      ${floatingShape(560, 320, 'diamond', 18, PALETTE.mustard)}
    `;
  },

  // Remote work / home office
  remote: (title) => {
    return `
      ${scenePanel(40, 30, 350, 280, PALETTE.softPeach, `
        ${window(80, 50, 80, 100)}
        ${desk(120, 200, 150, 40)}
        ${chair(160, 250, PALETTE.teal)}
        ${person(195, 290, { sitting: true, scale: 0.85, hasLaptop: true })}
        ${laptop(155, 175, 0.8)}
        ${plant(280, 180, 0.8)}
        ${pictureFrame(200, 60, 50, 40, PALETTE.teal)}
      `)}
      ${scenePanel(410, 30, 180, 130, PALETTE.mustard, `
        ${person(460, 130, { scale: 0.7, pose: 'waving' })}
        ${speechBubble(480, 40, 'Hello!', 'bottom-left')}
      `)}
      ${scenePanel(610, 30, 150, 130, PALETTE.teal, `
        ${monitor(640, 50, 0.7)}
        ${floatingShape(620, 100, 'circle', 15, PALETTE.white, 0.5)}
        ${floatingShape(730, 60, 'square', 12, PALETTE.coral)}
      `)}
      ${scenePanel(410, 180, 350, 130, PALETTE.coral, `
        ${person(480, 280, { scale: 0.7 })}
        ${person(560, 280, { scale: 0.65, facing: 'left' })}
        ${person(640, 280, { scale: 0.7, pose: 'pointing' })}
        ${person(720, 280, { scale: 0.6 })}
      `)}
      ${floatingShape(25, 280, 'diamond', 20, PALETTE.mustard)}
      ${floatingShape(770, 320, 'circle', 25, PALETTE.softPeach)}
    `;
  },

  // Collaboration / teamwork
  collaboration: (title) => {
    return `
      ${scenePanel(40, 30, 280, 200, PALETTE.mustard, `
        ${desk(70, 120, 180, 45)}
        ${person(120, 210, { sitting: true, scale: 0.75, facing: 'right' })}
        ${person(220, 210, { sitting: true, scale: 0.75, facing: 'left' })}
        ${laptop(90, 95, 0.7)}
        ${laptop(170, 95, 0.7)}
      `)}
      ${scenePanel(340, 30, 200, 200, PALETTE.softPeach, `
        ${person(400, 190, { scale: 0.8, pose: 'pointing', facing: 'right' })}
        ${whiteboard(420, 50, 100, 70)}
      `)}
      ${scenePanel(560, 30, 200, 200, PALETTE.teal, `
        ${bookshelf(590, 50, 70, 100)}
        ${person(700, 190, { scale: 0.75 })}
        ${plant(680, 140, 0.6)}
      `)}
      ${scenePanel(40, 250, 720, 70, PALETTE.coral, `
        ${person(100, 300, { scale: 0.5 })}
        ${person(180, 300, { scale: 0.5 })}
        ${person(260, 300, { scale: 0.5 })}
        ${person(340, 300, { scale: 0.5 })}
        ${person(420, 300, { scale: 0.5 })}
        ${person(500, 300, { scale: 0.5 })}
        ${person(580, 300, { scale: 0.5 })}
        ${person(660, 300, { scale: 0.5 })}
      `)}
      ${floatingShape(25, 15, 'circle', 20, PALETTE.coral)}
      ${floatingShape(770, 250, 'square', 22, PALETTE.mustard)}
    `;
  },

  // Presentation / demo
  presentation: (title) => {
    return `
      ${scenePanel(40, 30, 400, 280, PALETTE.softPeach, `
        ${whiteboard(80, 50, 200, 140)}
        ${person(180, 260, { scale: 0.9, pose: 'pointing', facing: 'right' })}
        ${plant(320, 180, 0.9)}
      `)}
      ${scenePanel(460, 30, 150, 130, PALETTE.mustard, `
        ${person(500, 130, { scale: 0.7, sitting: true })}
        ${person(560, 130, { scale: 0.65, sitting: true })}
      `)}
      ${scenePanel(630, 30, 130, 130, PALETTE.teal, `
        ${person(680, 130, { scale: 0.7, sitting: true })}
        ${speechBubble(650, 40, '👍', 'bottom-left')}
      `)}
      ${scenePanel(460, 180, 300, 130, PALETTE.coral, `
        ${person(520, 280, { scale: 0.7, sitting: true })}
        ${person(600, 280, { scale: 0.65, sitting: true })}
        ${person(680, 280, { scale: 0.7, sitting: true })}
      `)}
      ${floatingShape(30, 320, 'diamond', 18, PALETTE.teal)}
      ${floatingShape(770, 15, 'circle', 25, PALETTE.mustard, 0.5)}
    `;
  },

  // Coding / development
  coding: (title) => {
    return `
      ${scenePanel(40, 30, 350, 280, PALETTE.navy, `
        ${monitor(100, 80, 1.2)}
        ${desk(70, 200, 200, 40)}
        ${chair(140, 250, PALETTE.orange)}
        ${person(175, 290, { sitting: true, scale: 0.85, hasLaptop: true })}
        ${plant(280, 180, 0.7)}
      `)}
      ${scenePanel(410, 30, 180, 130, PALETTE.mustard, `
        ${laptop(440, 60, 0.9)}
        ${floatingShape(420, 40, 'circle', 15, PALETTE.coral)}
        ${floatingShape(560, 100, 'square', 12, PALETTE.teal)}
      `)}
      ${scenePanel(610, 30, 150, 130, PALETTE.softPeach, `
        ${person(670, 130, { scale: 0.7, pose: 'waving' })}
      `)}
      ${scenePanel(410, 180, 350, 130, PALETTE.teal, `
        ${person(480, 280, { scale: 0.7 })}
        ${person(560, 280, { scale: 0.65, facing: 'left' })}
        ${speechBubble(500, 190, 'Code review?', 'bottom-left')}
      `)}
      ${floatingShape(25, 320, 'square', 22, PALETTE.orange)}
      ${floatingShape(770, 320, 'diamond', 20, PALETTE.coral)}
    `;
  },

  // Interview / hiring
  interview: (title) => {
    return `
      ${scenePanel(40, 30, 350, 280, PALETTE.softPeach, `
        ${desk(100, 150, 180, 40)}
        ${person(150, 240, { scale: 0.85, sitting: true })}
        ${person(280, 240, { scale: 0.85, sitting: true, facing: 'left' })}
        ${pictureFrame(120, 50, 70, 50, PALETTE.teal)}
        ${plant(300, 100, 0.7)}
      `)}
      ${scenePanel(410, 30, 350, 130, PALETTE.mustard, `
        ${person(480, 130, { scale: 0.7 })}
        ${person(560, 130, { scale: 0.65 })}
        ${person(640, 130, { scale: 0.7 })}
        ${person(720, 130, { scale: 0.65 })}
      `)}
      ${scenePanel(410, 180, 350, 130, PALETTE.teal, `
        ${speechBubble(450, 200, 'Welcome to\nthe team!', 'bottom-right')}
        ${person(650, 280, { scale: 0.75, pose: 'waving' })}
      `)}
      ${floatingShape(25, 320, 'circle', 25, PALETTE.coral)}
      ${floatingShape(770, 20, 'diamond', 22, PALETTE.mustard)}
    `;
  },

  // Success / celebration
  success: (title) => {
    return `
      ${scenePanel(40, 30, 720, 280, PALETTE.mustard, `
        ${person(150, 260, { scale: 0.9, pose: 'waving' })}
        ${person(280, 260, { scale: 0.85, pose: 'waving' })}
        ${person(410, 260, { scale: 0.9, pose: 'waving' })}
        ${person(540, 260, { scale: 0.85, pose: 'waving' })}
        ${person(670, 260, { scale: 0.9, pose: 'waving' })}
        ${floatingShape(100, 50, 'circle', 30, PALETTE.coral, 0.7)}
        ${floatingShape(250, 80, 'diamond', 25, PALETTE.teal, 0.6)}
        ${floatingShape(400, 40, 'square', 28, PALETTE.softPeach, 0.7)}
        ${floatingShape(550, 70, 'circle', 22, PALETTE.orange, 0.6)}
        ${floatingShape(700, 50, 'diamond', 20, PALETTE.purple, 0.7)}
      `)}
      ${floatingShape(25, 320, 'square', 25, PALETTE.teal)}
      ${floatingShape(770, 320, 'circle', 28, PALETTE.coral)}
    `;
  },

  // Brainstorming / ideation
  brainstorm: (title) => {
    return `
      ${scenePanel(40, 30, 400, 280, PALETTE.mustard, `
        ${whiteboard(80, 50, 180, 120)}
        ${person(180, 260, { scale: 0.85, pose: 'pointing' })}
        ${person(300, 260, { scale: 0.8 })}
        ${floatingShape(280, 60, 'circle', 25, PALETTE.coral, 0.7)}
        ${floatingShape(320, 100, 'diamond', 20, PALETTE.teal, 0.6)}
        ${floatingShape(350, 50, 'square', 18, PALETTE.softPeach, 0.7)}
      `)}
      ${scenePanel(460, 30, 300, 130, PALETTE.softPeach, `
        ${person(520, 130, { scale: 0.7, pose: 'waving' })}
        ${speechBubble(540, 40, 'Great idea!', 'bottom-left')}
        ${person(640, 130, { scale: 0.65 })}
      `)}
      ${scenePanel(460, 180, 300, 130, PALETTE.teal, `
        ${laptop(500, 210, 0.8)}
        ${person(620, 280, { scale: 0.7, sitting: true })}
        ${floatingShape(480, 190, 'circle', 15, PALETTE.white, 0.5)}
      `)}
      ${floatingShape(25, 320, 'diamond', 22, PALETTE.coral)}
      ${floatingShape(770, 15, 'circle', 28, PALETTE.mustard, 0.5)}
    `;
  },

  // Learning / training
  learning: (title) => {
    return `
      ${scenePanel(40, 30, 350, 280, PALETTE.softPeach, `
        ${monitor(100, 60, 1.1)}
        ${desk(80, 180, 180, 40)}
        ${person(170, 260, { sitting: true, scale: 0.85 })}
        ${bookshelf(280, 80, 60, 90)}
      `)}
      ${scenePanel(410, 30, 350, 130, PALETTE.teal, `
        ${person(480, 130, { scale: 0.7 })}
        ${person(560, 130, { scale: 0.65 })}
        ${person(640, 130, { scale: 0.7 })}
        ${speechBubble(500, 40, 'Questions?', 'bottom-left')}
      `)}
      ${scenePanel(410, 180, 350, 130, PALETTE.mustard, `
        ${laptop(450, 210, 0.7)}
        ${laptop(550, 210, 0.7)}
        ${laptop(650, 210, 0.7)}
        ${floatingShape(430, 190, 'circle', 12, PALETTE.coral, 0.6)}
        ${floatingShape(720, 260, 'square', 15, PALETTE.teal, 0.5)}
      `)}
      ${floatingShape(25, 320, 'square', 20, PALETTE.teal)}
      ${floatingShape(770, 320, 'diamond', 22, PALETTE.coral)}
    `;
  },

  // Design / creative
  design: (title) => {
    return `
      ${scenePanel(40, 30, 350, 280, PALETTE.coral, `
        ${monitor(100, 60, 1.1)}
        ${desk(80, 180, 180, 40)}
        ${person(170, 260, { sitting: true, scale: 0.85 })}
        ${plant(290, 160, 0.8)}
        ${pictureFrame(280, 50, 55, 45, PALETTE.teal)}
        ${pictureFrame(340, 60, 40, 35, PALETTE.mustard)}
      `)}
      ${scenePanel(410, 30, 180, 130, PALETTE.mustard, `
        ${floatingShape(440, 50, 'circle', 30, PALETTE.coral, 0.7)}
        ${floatingShape(500, 80, 'square', 25, PALETTE.teal, 0.6)}
        ${floatingShape(460, 110, 'diamond', 20, PALETTE.softPeach, 0.7)}
      `)}
      ${scenePanel(610, 30, 150, 130, PALETTE.teal, `
        ${person(670, 130, { scale: 0.7, pose: 'pointing' })}
      `)}
      ${scenePanel(410, 180, 350, 130, PALETTE.softPeach, `
        ${person(480, 280, { scale: 0.7 })}
        ${person(580, 280, { scale: 0.7, facing: 'left' })}
        ${speechBubble(500, 190, 'Love the colors!', 'bottom-left')}
      `)}
      ${floatingShape(25, 15, 'circle', 25, PALETTE.mustard)}
      ${floatingShape(770, 320, 'square', 22, PALETTE.teal)}
    `;
  },

  // Standup / agile
  standup: (title) => {
    return `
      ${scenePanel(40, 30, 720, 180, PALETTE.mustard, `
        ${whiteboard(60, 50, 140, 100)}
        ${person(280, 180, { scale: 0.75 })}
        ${person(360, 180, { scale: 0.7 })}
        ${person(440, 180, { scale: 0.75 })}
        ${person(520, 180, { scale: 0.7 })}
        ${person(600, 180, { scale: 0.75 })}
        ${person(680, 180, { scale: 0.7 })}
      `)}
      ${scenePanel(40, 230, 350, 90, PALETTE.softPeach, `
        ${floatingShape(80, 250, 'square', 20, PALETTE.coral, 0.6)}
        ${floatingShape(150, 260, 'circle', 18, PALETTE.teal, 0.5)}
        ${floatingShape(220, 250, 'diamond', 16, PALETTE.mustard, 0.6)}
        ${floatingShape(290, 260, 'square', 22, PALETTE.orange, 0.5)}
      `)}
      ${scenePanel(410, 230, 350, 90, PALETTE.teal, `
        ${speechBubble(450, 245, 'Sprint goals ✓', 'bottom-right')}
      `)}
      ${floatingShape(25, 15, 'diamond', 20, PALETTE.coral)}
      ${floatingShape(770, 330, 'circle', 25, PALETTE.mustard)}
    `;
  },

  // Default / general
  default: (title) => {
    return `
      ${scenePanel(40, 30, 350, 200, PALETTE.softPeach, `
        ${desk(80, 120, 150, 40)}
        ${person(155, 200, { sitting: true, scale: 0.8, hasLaptop: true })}
        ${laptop(100, 95, 0.75)}
        ${plant(240, 100, 0.7)}
      `)}
      ${scenePanel(410, 30, 350, 200, PALETTE.mustard, `
        ${person(500, 190, { scale: 0.8 })}
        ${person(600, 190, { scale: 0.75, facing: 'left' })}
        ${person(700, 190, { scale: 0.8 })}
      `)}
      ${scenePanel(40, 250, 720, 70, PALETTE.teal, `
        ${floatingShape(80, 265, 'circle', 20, PALETTE.white, 0.5)}
        ${floatingShape(200, 270, 'square', 15, PALETTE.coral, 0.6)}
        ${floatingShape(350, 265, 'diamond', 18, PALETTE.mustard, 0.5)}
        ${floatingShape(500, 270, 'circle', 16, PALETTE.softPeach, 0.6)}
        ${floatingShape(650, 265, 'square', 20, PALETTE.orange, 0.5)}
      `)}
      ${floatingShape(25, 15, 'diamond', 20, PALETTE.coral)}
      ${floatingShape(770, 250, 'circle', 22, PALETTE.mustard)}
    `;
  },
};


// ============== KEYWORD DETECTION ==============

const KEYWORDS = {
  meeting: ['meeting', 'standup', 'sync', 'discuss', 'agenda', 'scrum', 'sprint', 'planning', 'retrospective', 'daily'],
  remote: ['remote', 'home', 'wfh', 'distributed', 'async', 'virtual', 'zoom', 'video call', 'hybrid'],
  collaboration: ['collaboration', 'team', 'together', 'pair', 'mob', 'group', 'collective', 'shared', 'cooperative'],
  presentation: ['presentation', 'demo', 'showcase', 'pitch', 'keynote', 'slides', 'present', 'show', 'explain'],
  coding: ['code', 'coding', 'programming', 'develop', 'software', 'engineer', 'debug', 'build', 'implement', 'api', 'frontend', 'backend'],
  interview: ['interview', 'hire', 'hiring', 'recruit', 'candidate', 'job', 'career', 'onboard', 'talent'],
  success: ['success', 'celebrate', 'win', 'achieve', 'launch', 'ship', 'complete', 'milestone', 'goal', 'done'],
  brainstorm: ['brainstorm', 'idea', 'ideation', 'creative', 'innovation', 'think', 'concept', 'workshop'],
  learning: ['learn', 'training', 'course', 'tutorial', 'education', 'study', 'workshop', 'bootcamp', 'mentor'],
  design: ['design', 'ui', 'ux', 'creative', 'visual', 'graphic', 'prototype', 'figma', 'sketch', 'wireframe'],
  standup: ['standup', 'daily', 'agile', 'scrum', 'sprint', 'kanban', 'jira', 'backlog'],
};

function detectSceneType(title, content = '') {
  const text = `${title} ${content}`.toLowerCase();
  let best = 'default', score = 0;

  for (const [scene, kws] of Object.entries(KEYWORDS)) {
    let s = 0;
    for (const kw of kws) {
      if (text.includes(kw)) s += title.toLowerCase().includes(kw) ? 3 : 1;
    }
    if (s > score) { score = s; best = scene; }
  }
  return best;
}

// ============== SVG GENERATION ==============

function generateSVG(sceneType, title) {
  const scene = SCENES[sceneType] || SCENES.default;
  const content = scene(title);
  
  // Title bar at bottom
  const titleBar = `
    <rect x="200" y="${H - 60}" width="${W - 400}" height="45" rx="22" fill="${PALETTE.white}" stroke="${PALETTE.lightGray}" stroke-width="2"/>
    <text x="${W / 2}" y="${H - 32}" text-anchor="middle" fill="${PALETTE.darkGray}" font-size="14" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-weight="500">${escapeXml(title.substring(0, 50))}</text>
  `;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${PALETTE.cream}"/>
      <stop offset="100%" stop-color="${PALETTE.warmWhite}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  ${content}
  ${titleBar}
</svg>`;
}

function escapeXml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function ensureImagesDir() {
  try { await fs.promises.mkdir(IMAGES_DIR, { recursive: true }); } catch {}
}

// ============== EXPORTS ==============

export async function generateCartoonIllustration(title, content = '', filename = null, options = {}) {
  await ensureImagesDir();
  
  const sceneType = options.scene || detectSceneType(title, content);
  const svg = generateSVG(sceneType, title);
  
  const hash = crypto.createHash('md5').update(String(title)).digest('hex').slice(0, 8);
  const outputFilename = filename || `cartoon-${hash}`;
  const outputPath = path.join(IMAGES_DIR, `${outputFilename}.svg`);
  
  await fs.promises.writeFile(outputPath, svg, 'utf-8');
  
  return { path: outputPath, scene: sceneType, filename: `${outputFilename}.svg` };
}

export function generateCartoonSceneSVG(sceneName, title = '') {
  const displayTitle = title || `${sceneName.charAt(0).toUpperCase() + sceneName.slice(1)} Scene`;
  return generateSVG(sceneName, displayTitle);
}

export function getAvailableCartoonScenes() {
  return Object.keys(SCENES);
}

export { detectSceneType as detectCartoonScene };

export default { 
  generateCartoonIllustration, 
  generateCartoonSceneSVG, 
  getAvailableCartoonScenes, 
  detectCartoonScene: detectSceneType 
};

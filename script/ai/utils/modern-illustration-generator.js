/**
 * Modern Illustration Generator v2
 * Inspired by: Stripe, Notion, Linear, Slack, Figma illustration systems
 * 
 * Key improvements:
 * - Proper human proportions with larger heads (cartoon style)
 * - Soft gradients and subtle shadows
 * - Organic shapes and curves
 * - Layered depth with overlapping elements
 * - Consistent, harmonious color palette
 * - Clean, minimal aesthetic
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const IMAGES_DIR = 'blog-output/images';
const W = 800, H = 500;

// Modern, harmonious color palette (inspired by top design systems)
const COLORS = {
  // Backgrounds - soft, warm neutrals
  bg: {
    cream: '#FBF8F4',
    warmGray: '#F5F3F0',
    softBlue: '#F0F4F8',
    softPink: '#FDF2F4',
    softGreen: '#F0F7F4',
  },
  
  // Primary accent colors - vibrant but not harsh
  accent: {
    coral: '#FF6B6B',
    orange: '#FF9F43',
    yellow: '#FECA57',
    teal: '#00D2D3',
    blue: '#54A0FF',
    purple: '#9B59B6',
    pink: '#FD79A8',
    green: '#26DE81',
  },
  
  // Skin tones - natural range
  skin: {
    light: '#FFE4C9',
    fair: '#F5D0B5',
    medium: '#D4A574',
    tan: '#C68642',
    brown: '#8D5524',
    dark: '#5C3D2E',
  },
  
  // Hair colors
  hair: {
    black: '#2D3436',
    darkBrown: '#5D4037',
    brown: '#8D6E63',
    auburn: '#A1543F',
    blonde: '#DEB887',
    gray: '#95A5A6',
    red: '#C0392B',
  },
  
  // Clothing - modern, muted tones
  clothing: {
    navy: '#2C3E50',
    charcoal: '#34495E',
    slate: '#5D6D7E',
    rust: '#E17055',
    sage: '#81B29A',
    lavender: '#A29BFE',
    blush: '#FAB1A0',
    mustard: '#F9CA24',
    teal: '#00B894',
    coral: '#FF7675',
  },
  
  // UI elements
  white: '#FFFFFF',
  shadow: 'rgba(0,0,0,0.08)',
  shadowDark: 'rgba(0,0,0,0.15)',
  border: '#E8E8E8',
};

// Helper functions
const pick = (obj) => {
  const values = Object.values(obj);
  return values[Math.floor(Math.random() * values.length)];
};

const pickFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const lerp = (a, b, t) => a + (b - a) * t;

// Generate unique gradient ID
let gradientCounter = 0;
const uniqueId = (prefix) => `${prefix}_${++gradientCounter}`;


// ============== IMPROVED HUMAN FIGURES ==============
// Inspired by Notion/Slack style - larger heads, softer shapes, more character

function modernPerson(x, y, options = {}) {
  const {
    scale = 1,
    skin = pick(COLORS.skin),
    hair = pick(COLORS.hair),
    shirt = pick(COLORS.clothing),
    pants = COLORS.clothing.charcoal,
    pose = 'standing', // standing, sitting, waving, working, presenting
    facing = 'front', // front, left, right
    gender = pickFrom(['male', 'female']),
    hasAccessory = Math.random() > 0.7,
  } = options;

  const s = scale;
  const id = uniqueId('person');
  
  // Improved proportions - larger head ratio (cartoon style)
  const headSize = 32 * s;
  const bodyWidth = 28 * s;
  const bodyHeight = 40 * s;
  const legLength = 45 * s;
  const totalHeight = headSize * 2 + bodyHeight + legLength;
  
  // Position calculations
  const headY = y - totalHeight + headSize;
  const shoulderY = headY + headSize + 5 * s;
  const hipY = shoulderY + bodyHeight;
  const feetY = y;
  
  let svg = '';
  
  // Defs for gradients
  const skinGradId = uniqueId('skinGrad');
  const shirtGradId = uniqueId('shirtGrad');
  const hairGradId = uniqueId('hairGrad');
  
  svg += `
  <defs>
    <linearGradient id="${skinGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${skin}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${skin}" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="${shirtGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${shirt}"/>
      <stop offset="100%" stop-color="${shirt}" stop-opacity="0.8"/>
    </linearGradient>
    <linearGradient id="${hairGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${hair}"/>
      <stop offset="100%" stop-color="${hair}" stop-opacity="0.7"/>
    </linearGradient>
    <filter id="shadow_${id}" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.1"/>
    </filter>
  </defs>`;
  
  svg += `<g class="modern-person" transform="translate(${x}, 0)" filter="url(#shadow_${id})">`;
  
  // Ground shadow
  svg += `<ellipse cx="0" cy="${feetY + 3 * s}" rx="${22 * s}" ry="${5 * s}" fill="${COLORS.shadow}"/>`;
  
  // === LEGS ===
  if (pose === 'sitting') {
    // Sitting - legs bent forward
    svg += `
      <path d="M${-10 * s} ${hipY} 
               Q${-15 * s} ${hipY + 15 * s} ${-30 * s} ${hipY + 20 * s}
               L${-30 * s} ${hipY + 25 * s}
               Q${-12 * s} ${hipY + 20 * s} ${-6 * s} ${hipY + 5 * s} Z" 
            fill="${pants}"/>
      <path d="M${10 * s} ${hipY} 
               Q${15 * s} ${hipY + 15 * s} ${30 * s} ${hipY + 20 * s}
               L${30 * s} ${hipY + 25 * s}
               Q${12 * s} ${hipY + 20 * s} ${6 * s} ${hipY + 5 * s} Z" 
            fill="${pants}"/>`;
    // Shoes
    svg += `
      <ellipse cx="${-32 * s}" cy="${hipY + 23 * s}" rx="${8 * s}" ry="${4 * s}" fill="${COLORS.clothing.charcoal}"/>
      <ellipse cx="${32 * s}" cy="${hipY + 23 * s}" rx="${8 * s}" ry="${4 * s}" fill="${COLORS.clothing.charcoal}"/>`;
  } else {
    // Standing legs
    svg += `
      <path d="M${-6 * s} ${hipY} 
               L${-8 * s} ${feetY - 5 * s}
               L${-14 * s} ${feetY - 5 * s}
               L${-14 * s} ${hipY}
               Q${-10 * s} ${hipY - 3 * s} ${-6 * s} ${hipY} Z" 
            fill="${pants}"/>
      <path d="M${6 * s} ${hipY} 
               L${8 * s} ${feetY - 5 * s}
               L${14 * s} ${feetY - 5 * s}
               L${14 * s} ${hipY}
               Q${10 * s} ${hipY - 3 * s} ${6 * s} ${hipY} Z" 
            fill="${pants}"/>`;
    // Shoes
    svg += `
      <ellipse cx="${-11 * s}" cy="${feetY}" rx="${10 * s}" ry="${5 * s}" fill="${COLORS.clothing.charcoal}"/>
      <ellipse cx="${11 * s}" cy="${feetY}" rx="${10 * s}" ry="${5 * s}" fill="${COLORS.clothing.charcoal}"/>`;
  }
  
  // === BODY/TORSO ===
  svg += `
    <path d="M${-bodyWidth/2} ${shoulderY + 5 * s}
             Q${-bodyWidth/2 - 3 * s} ${(shoulderY + hipY) / 2} ${-bodyWidth/2 + 2 * s} ${hipY}
             L${bodyWidth/2 - 2 * s} ${hipY}
             Q${bodyWidth/2 + 3 * s} ${(shoulderY + hipY) / 2} ${bodyWidth/2} ${shoulderY + 5 * s}
             Q0 ${shoulderY} ${-bodyWidth/2} ${shoulderY + 5 * s} Z"
          fill="url(#${shirtGradId})"/>`;
  
  // Collar detail
  svg += `
    <path d="M${-8 * s} ${shoulderY + 3 * s} Q0 ${shoulderY + 10 * s} ${8 * s} ${shoulderY + 3 * s}"
          fill="none" stroke="${COLORS.white}" stroke-width="${2 * s}" opacity="0.5"/>`;
  
  // === ARMS ===
  const armWidth = 8 * s;
  const armY = shoulderY + 8 * s;
  
  if (pose === 'waving') {
    // Left arm waving up
    svg += `
      <path d="M${-bodyWidth/2 + 2 * s} ${armY}
               Q${-bodyWidth/2 - 15 * s} ${armY - 10 * s} ${-bodyWidth/2 - 10 * s} ${armY - 35 * s}"
            stroke="url(#${shirtGradId})" stroke-width="${armWidth}" stroke-linecap="round" fill="none"/>
      <circle cx="${-bodyWidth/2 - 10 * s}" cy="${armY - 38 * s}" r="${6 * s}" fill="url(#${skinGradId})"/>`;
    // Right arm down
    svg += `
      <path d="M${bodyWidth/2 - 2 * s} ${armY}
               Q${bodyWidth/2 + 10 * s} ${armY + 15 * s} ${bodyWidth/2 + 5 * s} ${armY + 30 * s}"
            stroke="url(#${shirtGradId})" stroke-width="${armWidth}" stroke-linecap="round" fill="none"/>
      <circle cx="${bodyWidth/2 + 5 * s}" cy="${armY + 33 * s}" r="${6 * s}" fill="url(#${skinGradId})"/>`;
  } else if (pose === 'presenting') {
    // Right arm pointing
    svg += `
      <path d="M${bodyWidth/2 - 2 * s} ${armY}
               Q${bodyWidth/2 + 20 * s} ${armY - 5 * s} ${bodyWidth/2 + 35 * s} ${armY - 15 * s}"
            stroke="url(#${shirtGradId})" stroke-width="${armWidth}" stroke-linecap="round" fill="none"/>
      <circle cx="${bodyWidth/2 + 38 * s}" cy="${armY - 17 * s}" r="${6 * s}" fill="url(#${skinGradId})"/>`;
    // Left arm relaxed
    svg += `
      <path d="M${-bodyWidth/2 + 2 * s} ${armY}
               Q${-bodyWidth/2 - 8 * s} ${armY + 10 * s} ${-bodyWidth/2 - 5 * s} ${armY + 25 * s}"
            stroke="url(#${shirtGradId})" stroke-width="${armWidth}" stroke-linecap="round" fill="none"/>
      <circle cx="${-bodyWidth/2 - 5 * s}" cy="${armY + 28 * s}" r="${6 * s}" fill="url(#${skinGradId})"/>`;
  } else if (pose === 'working' || pose === 'sitting') {
    // Both arms forward (typing)
    svg += `
      <path d="M${-bodyWidth/2 + 2 * s} ${armY}
               Q${-bodyWidth/2 - 5 * s} ${armY + 8 * s} ${-bodyWidth/2 + 5 * s} ${armY + 20 * s}"
            stroke="url(#${shirtGradId})" stroke-width="${armWidth}" stroke-linecap="round" fill="none"/>
      <circle cx="${-bodyWidth/2 + 5 * s}" cy="${armY + 23 * s}" r="${6 * s}" fill="url(#${skinGradId})"/>
      <path d="M${bodyWidth/2 - 2 * s} ${armY}
               Q${bodyWidth/2 + 5 * s} ${armY + 8 * s} ${bodyWidth/2 - 5 * s} ${armY + 20 * s}"
            stroke="url(#${shirtGradId})" stroke-width="${armWidth}" stroke-linecap="round" fill="none"/>
      <circle cx="${bodyWidth/2 - 5 * s}" cy="${armY + 23 * s}" r="${6 * s}" fill="url(#${skinGradId})"/>`;
  } else {
    // Default standing arms
    svg += `
      <path d="M${-bodyWidth/2 + 2 * s} ${armY}
               Q${-bodyWidth/2 - 10 * s} ${armY + 15 * s} ${-bodyWidth/2 - 3 * s} ${armY + 30 * s}"
            stroke="url(#${shirtGradId})" stroke-width="${armWidth}" stroke-linecap="round" fill="none"/>
      <circle cx="${-bodyWidth/2 - 3 * s}" cy="${armY + 33 * s}" r="${6 * s}" fill="url(#${skinGradId})"/>
      <path d="M${bodyWidth/2 - 2 * s} ${armY}
               Q${bodyWidth/2 + 10 * s} ${armY + 15 * s} ${bodyWidth/2 + 3 * s} ${armY + 30 * s}"
            stroke="url(#${shirtGradId})" stroke-width="${armWidth}" stroke-linecap="round" fill="none"/>
      <circle cx="${bodyWidth/2 + 3 * s}" cy="${armY + 33 * s}" r="${6 * s}" fill="url(#${skinGradId})"/>`;
  }
  
  // === HEAD ===
  svg += `<circle cx="0" cy="${headY}" r="${headSize}" fill="url(#${skinGradId})"/>`;
  
  // === HAIR ===
  const hairStyle = Math.floor(Math.random() * 5);
  if (hairStyle === 0) {
    // Short neat hair
    svg += `
      <path d="M${-headSize * 0.85} ${headY - headSize * 0.2}
               Q${-headSize * 0.5} ${headY - headSize * 1.1} 0 ${headY - headSize * 0.95}
               Q${headSize * 0.5} ${headY - headSize * 1.1} ${headSize * 0.85} ${headY - headSize * 0.2}
               Q${headSize * 0.6} ${headY - headSize * 0.5} 0 ${headY - headSize * 0.6}
               Q${-headSize * 0.6} ${headY - headSize * 0.5} ${-headSize * 0.85} ${headY - headSize * 0.2} Z"
            fill="url(#${hairGradId})"/>`;
  } else if (hairStyle === 1) {
    // Wavy/longer hair
    svg += `
      <ellipse cx="0" cy="${headY - headSize * 0.3}" rx="${headSize * 1.1}" ry="${headSize * 0.8}" fill="url(#${hairGradId})"/>
      <path d="M${-headSize * 1.1} ${headY - headSize * 0.1} 
               Q${-headSize * 1.2} ${headY + headSize * 0.3} ${-headSize * 0.9} ${headY + headSize * 0.5}"
            stroke="url(#${hairGradId})" stroke-width="${8 * s}" stroke-linecap="round" fill="none"/>
      <path d="M${headSize * 1.1} ${headY - headSize * 0.1} 
               Q${headSize * 1.2} ${headY + headSize * 0.3} ${headSize * 0.9} ${headY + headSize * 0.5}"
            stroke="url(#${hairGradId})" stroke-width="${8 * s}" stroke-linecap="round" fill="none"/>`;
  } else if (hairStyle === 2) {
    // Bun/updo
    svg += `
      <circle cx="0" cy="${headY - headSize - 5 * s}" r="${12 * s}" fill="url(#${hairGradId})"/>
      <path d="M${-headSize * 0.7} ${headY - headSize * 0.4}
               Q0 ${headY - headSize * 1.1} ${headSize * 0.7} ${headY - headSize * 0.4}"
            fill="url(#${hairGradId})"/>`;
  } else if (hairStyle === 3) {
    // Curly/afro
    svg += `
      <circle cx="0" cy="${headY - headSize * 0.2}" r="${headSize * 1.15}" fill="url(#${hairGradId})"/>`;
  } else {
    // Slicked back
    svg += `
      <path d="M${-headSize * 0.9} ${headY}
               Q${-headSize * 0.7} ${headY - headSize * 0.9} 0 ${headY - headSize * 0.85}
               Q${headSize * 0.7} ${headY - headSize * 0.9} ${headSize * 0.9} ${headY}
               L${headSize * 0.7} ${headY - headSize * 0.3}
               Q0 ${headY - headSize * 0.5} ${-headSize * 0.7} ${headY - headSize * 0.3} Z"
            fill="url(#${hairGradId})"/>`;
  }
  
  // === FACE ===
  const eyeY = headY - 2 * s;
  const eyeSpacing = 10 * s;
  
  // Eyes - simple dots with highlights
  svg += `
    <circle cx="${-eyeSpacing}" cy="${eyeY}" r="${4 * s}" fill="${COLORS.clothing.charcoal}"/>
    <circle cx="${eyeSpacing}" cy="${eyeY}" r="${4 * s}" fill="${COLORS.clothing.charcoal}"/>
    <circle cx="${-eyeSpacing + 1.5 * s}" cy="${eyeY - 1.5 * s}" r="${1.5 * s}" fill="${COLORS.white}"/>
    <circle cx="${eyeSpacing + 1.5 * s}" cy="${eyeY - 1.5 * s}" r="${1.5 * s}" fill="${COLORS.white}"/>`;
  
  // Eyebrows
  svg += `
    <path d="M${-eyeSpacing - 5 * s} ${eyeY - 8 * s} Q${-eyeSpacing} ${eyeY - 10 * s} ${-eyeSpacing + 5 * s} ${eyeY - 8 * s}"
          stroke="${hair}" stroke-width="${2 * s}" fill="none" stroke-linecap="round"/>
    <path d="M${eyeSpacing - 5 * s} ${eyeY - 8 * s} Q${eyeSpacing} ${eyeY - 10 * s} ${eyeSpacing + 5 * s} ${eyeY - 8 * s}"
          stroke="${hair}" stroke-width="${2 * s}" fill="none" stroke-linecap="round"/>`;
  
  // Smile
  svg += `
    <path d="M${-8 * s} ${headY + 10 * s} Q0 ${headY + 18 * s} ${8 * s} ${headY + 10 * s}"
          stroke="${COLORS.clothing.charcoal}" stroke-width="${2.5 * s}" fill="none" stroke-linecap="round"/>`;
  
  // Nose (subtle)
  svg += `
    <path d="M0 ${headY + 2 * s} L${2 * s} ${headY + 6 * s} L0 ${headY + 7 * s}"
          stroke="${skin}" stroke-width="${1.5 * s}" fill="none" stroke-linecap="round" opacity="0.5"/>`;
  
  // Cheeks (blush)
  svg += `
    <circle cx="${-eyeSpacing - 5 * s}" cy="${headY + 5 * s}" r="${5 * s}" fill="#FFB6B6" opacity="0.3"/>
    <circle cx="${eyeSpacing + 5 * s}" cy="${headY + 5 * s}" r="${5 * s}" fill="#FFB6B6" opacity="0.3"/>`;
  
  // === ACCESSORIES ===
  if (hasAccessory) {
    const accessoryType = Math.floor(Math.random() * 3);
    if (accessoryType === 0) {
      // Glasses
      svg += `
        <circle cx="${-eyeSpacing}" cy="${eyeY}" r="${7 * s}" fill="none" stroke="${COLORS.clothing.charcoal}" stroke-width="${1.5 * s}"/>
        <circle cx="${eyeSpacing}" cy="${eyeY}" r="${7 * s}" fill="none" stroke="${COLORS.clothing.charcoal}" stroke-width="${1.5 * s}"/>
        <line x1="${-eyeSpacing + 7 * s}" y1="${eyeY}" x2="${eyeSpacing - 7 * s}" y2="${eyeY}" 
              stroke="${COLORS.clothing.charcoal}" stroke-width="${1.5 * s}"/>`;
    } else if (accessoryType === 1) {
      // Earrings (small dots)
      svg += `
        <circle cx="${-headSize - 2 * s}" cy="${headY + 5 * s}" r="${2 * s}" fill="${COLORS.accent.coral}"/>
        <circle cx="${headSize + 2 * s}" cy="${headY + 5 * s}" r="${2 * s}" fill="${COLORS.accent.coral}"/>`;
    }
  }
  
  svg += '</g>';
  return svg;
}


// ============== MODERN FURNITURE & OBJECTS ==============

function modernDesk(x, y, width = 140, height = 8) {
  const id = uniqueId('desk');
  return `
    <g class="modern-desk">
      <defs>
        <linearGradient id="${id}_grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#F5E6D3"/>
          <stop offset="100%" stop-color="#E8D5C4"/>
        </linearGradient>
      </defs>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="url(#${id}_grad)"/>
      <rect x="${x}" y="${y}" width="${width}" height="3" rx="2" fill="#DEC9B8" opacity="0.5"/>
      <rect x="${x + 15}" y="${y + height}" width="8" height="50" rx="2" fill="#C4B5A5"/>
      <rect x="${x + width - 23}" y="${y + height}" width="8" height="50" rx="2" fill="#C4B5A5"/>
    </g>
  `;
}

function modernChair(x, y, color = COLORS.accent.teal) {
  const id = uniqueId('chair');
  return `
    <g class="modern-chair">
      <defs>
        <linearGradient id="${id}_grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${color}"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.7"/>
        </linearGradient>
      </defs>
      <!-- Seat -->
      <ellipse cx="${x}" cy="${y}" rx="28" ry="10" fill="url(#${id}_grad)"/>
      <!-- Back -->
      <path d="M${x - 22} ${y - 5} Q${x - 25} ${y - 35} ${x - 18} ${y - 55}
               Q${x} ${y - 65} ${x + 18} ${y - 55}
               Q${x + 25} ${y - 35} ${x + 22} ${y - 5}"
            fill="url(#${id}_grad)"/>
      <!-- Stem -->
      <rect x="${x - 4}" y="${y + 5}" width="8" height="25" rx="2" fill="#5D6D7E"/>
      <!-- Base -->
      <ellipse cx="${x}" cy="${y + 32}" rx="22" ry="6" fill="#5D6D7E"/>
    </g>
  `;
}

function modernLaptop(x, y, scale = 1, screenColor = COLORS.accent.blue) {
  const s = scale;
  const id = uniqueId('laptop');
  return `
    <g class="modern-laptop">
      <defs>
        <linearGradient id="${id}_screen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${screenColor}"/>
          <stop offset="100%" stop-color="${screenColor}" stop-opacity="0.7"/>
        </linearGradient>
        <filter id="${id}_glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <!-- Screen -->
      <rect x="${x}" y="${y}" width="${70 * s}" height="${45 * s}" rx="4" fill="#2D3436"/>
      <rect x="${x + 3 * s}" y="${y + 3 * s}" width="${64 * s}" height="${39 * s}" rx="2" fill="url(#${id}_screen)" filter="url(#${id}_glow)"/>
      <!-- Screen content hint -->
      <rect x="${x + 8 * s}" y="${y + 10 * s}" width="${30 * s}" height="${3 * s}" rx="1" fill="${COLORS.white}" opacity="0.4"/>
      <rect x="${x + 8 * s}" y="${y + 18 * s}" width="${45 * s}" height="${3 * s}" rx="1" fill="${COLORS.white}" opacity="0.3"/>
      <rect x="${x + 8 * s}" y="${y + 26 * s}" width="${35 * s}" height="${3 * s}" rx="1" fill="${COLORS.white}" opacity="0.3"/>
      <!-- Base -->
      <path d="M${x - 5 * s} ${y + 45 * s} 
               L${x + 75 * s} ${y + 45 * s}
               L${x + 70 * s} ${y + 50 * s}
               L${x} ${y + 50 * s} Z"
            fill="#5D6D7E"/>
      <rect x="${x + 25 * s}" y="${y + 46 * s}" width="${20 * s}" height="${2 * s}" rx="1" fill="#7F8C8D"/>
    </g>
  `;
}

function modernPlant(x, y, scale = 1, potColor = COLORS.accent.coral) {
  const s = scale;
  const id = uniqueId('plant');
  return `
    <g class="modern-plant">
      <defs>
        <linearGradient id="${id}_pot" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${potColor}"/>
          <stop offset="100%" stop-color="${potColor}" stop-opacity="0.7"/>
        </linearGradient>
        <linearGradient id="${id}_leaf" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#26DE81"/>
          <stop offset="100%" stop-color="#1ABC9C"/>
        </linearGradient>
      </defs>
      <!-- Pot -->
      <path d="M${x} ${y} L${x + 30 * s} ${y} L${x + 25 * s} ${y + 35 * s} L${x + 5 * s} ${y + 35 * s} Z"
            fill="url(#${id}_pot)"/>
      <ellipse cx="${x + 15 * s}" cy="${y}" rx="${15 * s}" ry="${5 * s}" fill="${potColor}"/>
      <!-- Leaves -->
      <ellipse cx="${x + 15 * s}" cy="${y - 25 * s}" rx="${18 * s}" ry="${25 * s}" fill="url(#${id}_leaf)"/>
      <ellipse cx="${x + 5 * s}" cy="${y - 15 * s}" rx="${12 * s}" ry="${20 * s}" fill="#1ABC9C" transform="rotate(-20 ${x + 5 * s} ${y - 15 * s})"/>
      <ellipse cx="${x + 25 * s}" cy="${y - 15 * s}" rx="${12 * s}" ry="${20 * s}" fill="#2ECC71" transform="rotate(20 ${x + 25 * s} ${y - 15 * s})"/>
    </g>
  `;
}

function modernWindow(x, y, width = 100, height = 130) {
  const id = uniqueId('window');
  return `
    <g class="modern-window">
      <defs>
        <linearGradient id="${id}_sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#74B9FF"/>
          <stop offset="100%" stop-color="#A8E6CF"/>
        </linearGradient>
      </defs>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="url(#${id}_sky)"/>
      <!-- Window frame -->
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="none" stroke="${COLORS.white}" stroke-width="10"/>
      <line x1="${x + width/2}" y1="${y}" x2="${x + width/2}" y2="${y + height}" stroke="${COLORS.white}" stroke-width="5"/>
      <line x1="${x}" y1="${y + height/2}" x2="${x + width}" y2="${y + height/2}" stroke="${COLORS.white}" stroke-width="5"/>
      <!-- Sun hint -->
      <circle cx="${x + width * 0.7}" cy="${y + height * 0.25}" r="15" fill="#FFEAA7" opacity="0.8"/>
      <!-- Cloud hint -->
      <ellipse cx="${x + width * 0.3}" cy="${y + height * 0.35}" rx="20" ry="10" fill="${COLORS.white}" opacity="0.6"/>
    </g>
  `;
}

function modernWhiteboard(x, y, width = 180, height = 120) {
  const id = uniqueId('board');
  return `
    <g class="modern-whiteboard">
      <defs>
        <filter id="${id}_shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.1"/>
        </filter>
      </defs>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${COLORS.white}" filter="url(#${id}_shadow)"/>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="none" stroke="#E8E8E8" stroke-width="3"/>
      <!-- Content -->
      <rect x="${x + 20}" y="${y + 25}" width="${width * 0.5}" height="6" rx="3" fill="${COLORS.accent.blue}" opacity="0.7"/>
      <rect x="${x + 20}" y="${y + 45}" width="${width * 0.7}" height="6" rx="3" fill="${COLORS.accent.coral}" opacity="0.6"/>
      <rect x="${x + 20}" y="${y + 65}" width="${width * 0.4}" height="6" rx="3" fill="${COLORS.accent.teal}" opacity="0.6"/>
      <!-- Sticky notes -->
      <rect x="${x + width - 60}" y="${y + 80}" width="35" height="30" rx="2" fill="${COLORS.accent.yellow}" opacity="0.8" transform="rotate(-5 ${x + width - 42} ${y + 95})"/>
      <rect x="${x + width - 90}" y="${y + 85}" width="35" height="30" rx="2" fill="${COLORS.accent.pink}" opacity="0.7" transform="rotate(3 ${x + width - 72} ${y + 100})"/>
    </g>
  `;
}

function modernBookshelf(x, y, width = 90, height = 140) {
  const id = uniqueId('shelf');
  const bookColors = [COLORS.accent.blue, COLORS.accent.coral, COLORS.accent.teal, COLORS.accent.purple, COLORS.accent.yellow];
  return `
    <g class="modern-bookshelf">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="#E8D5C4"/>
      <!-- Shelves -->
      <rect x="${x}" y="${y + 45}" width="${width}" height="5" fill="#D4C4B5"/>
      <rect x="${x}" y="${y + 95}" width="${width}" height="5" fill="#D4C4B5"/>
      <!-- Books row 1 -->
      <rect x="${x + 8}" y="${y + 10}" width="12" height="32" rx="1" fill="${bookColors[0]}"/>
      <rect x="${x + 22}" y="${y + 15}" width="10" height="27" rx="1" fill="${bookColors[1]}"/>
      <rect x="${x + 34}" y="${y + 8}" width="14" height="34" rx="1" fill="${bookColors[2]}"/>
      <rect x="${x + 50}" y="${y + 12}" width="11" height="30" rx="1" fill="${bookColors[3]}"/>
      <rect x="${x + 63}" y="${y + 10}" width="16" height="32" rx="1" fill="${bookColors[4]}"/>
      <!-- Books row 2 -->
      <rect x="${x + 10}" y="${y + 55}" width="15" height="35" rx="1" fill="${bookColors[2]}"/>
      <rect x="${x + 27}" y="${y + 60}" width="12" height="30" rx="1" fill="${bookColors[0]}"/>
      <rect x="${x + 41}" y="${y + 52}" width="18" height="38" rx="1" fill="${bookColors[4]}"/>
      <rect x="${x + 61}" y="${y + 58}" width="14" height="32" rx="1" fill="${bookColors[1]}"/>
      <!-- Decorative item -->
      <circle cx="${x + 25}" cy="${y + 115}" r="12" fill="${COLORS.accent.coral}" opacity="0.7"/>
      <rect x="${x + 50}" y="${y + 105}" width="25" height="25" rx="3" fill="${COLORS.accent.teal}" opacity="0.6"/>
    </g>
  `;
}

function floatingDecor(x, y, type = 'circle', size = 25, color = COLORS.accent.coral, opacity = 0.6) {
  const id = uniqueId('decor');
  if (type === 'circle') {
    return `<circle cx="${x}" cy="${y}" r="${size/2}" fill="${color}" opacity="${opacity}"/>`;
  } else if (type === 'square') {
    return `<rect x="${x - size/2}" y="${y - size/2}" width="${size}" height="${size}" rx="${size * 0.15}" fill="${color}" opacity="${opacity}"/>`;
  } else if (type === 'diamond') {
    return `<rect x="${x - size/2}" y="${y - size/2}" width="${size}" height="${size}" rx="3" fill="${color}" opacity="${opacity}" transform="rotate(45 ${x} ${y})"/>`;
  } else if (type === 'blob') {
    return `
      <path d="M${x} ${y - size/2} 
               Q${x + size/2} ${y - size/3} ${x + size/2} ${y}
               Q${x + size/2} ${y + size/2} ${x} ${y + size/2}
               Q${x - size/2} ${y + size/3} ${x - size/2} ${y}
               Q${x - size/2} ${y - size/2} ${x} ${y - size/2} Z"
            fill="${color}" opacity="${opacity}"/>`;
  }
  return '';
}


// ============== SCENE COMPOSITIONS ==============

const SCENES = {
  // Modern office collaboration
  collaboration: (title) => {
    const bgColor = pick(COLORS.bg);
    return `
      <!-- Main workspace panel -->
      <rect x="50" y="40" width="380" height="320" rx="20" fill="${COLORS.bg.warmGray}"/>
      ${modernWhiteboard(80, 60, 160, 100)}
      ${modernDesk(100, 240, 180)}
      ${modernChair(190, 290, COLORS.accent.teal)}
      ${modernPerson(190, 340, { pose: 'sitting', scale: 0.85 })}
      ${modernLaptop(130, 215, 0.7)}
      ${modernPlant(300, 220, 0.8)}
      
      <!-- Side panel - video call -->
      <rect x="450" y="40" width="300" height="150" rx="16" fill="${COLORS.bg.softBlue}"/>
      ${modernPerson(520, 160, { pose: 'waving', scale: 0.6 })}
      ${modernPerson(620, 160, { pose: 'standing', scale: 0.55 })}
      ${modernPerson(700, 160, { pose: 'standing', scale: 0.5 })}
      
      <!-- Side panel - team -->
      <rect x="450" y="210" width="300" height="150" rx="16" fill="${COLORS.bg.softPink}"/>
      ${modernPerson(520, 330, { pose: 'presenting', scale: 0.6 })}
      ${modernPerson(620, 330, { pose: 'standing', scale: 0.6 })}
      ${modernPerson(700, 330, { pose: 'waving', scale: 0.55 })}
      
      <!-- Decorative elements -->
      ${floatingDecor(40, 380, 'circle', 30, COLORS.accent.coral, 0.5)}
      ${floatingDecor(760, 50, 'blob', 35, COLORS.accent.teal, 0.4)}
      ${floatingDecor(430, 380, 'diamond', 22, COLORS.accent.yellow, 0.5)}
    `;
  },

  // Remote work scene
  remote: (title) => {
    return `
      <!-- Home office panel -->
      <rect x="50" y="40" width="400" height="320" rx="20" fill="${COLORS.bg.softPink}"/>
      ${modernWindow(80, 60, 100, 120)}
      ${modernDesk(150, 250, 200)}
      ${modernChair(250, 300, COLORS.accent.coral)}
      ${modernPerson(250, 350, { pose: 'working', scale: 0.9 })}
      ${modernLaptop(180, 225, 0.85)}
      ${modernPlant(380, 230, 0.9)}
      ${modernBookshelf(80, 200, 60, 100)}
      
      <!-- Video call grid -->
      <rect x="470" y="40" width="140" height="100" rx="12" fill="${COLORS.bg.softBlue}"/>
      ${modernPerson(540, 120, { pose: 'waving', scale: 0.45 })}
      
      <rect x="620" y="40" width="140" height="100" rx="12" fill="${COLORS.bg.softGreen}"/>
      ${modernPerson(690, 120, { pose: 'standing', scale: 0.45 })}
      
      <rect x="470" y="150" width="140" height="100" rx="12" fill="${COLORS.bg.warmGray}"/>
      ${modernPerson(540, 230, { pose: 'standing', scale: 0.45 })}
      
      <rect x="620" y="150" width="140" height="100" rx="12" fill="${COLORS.bg.cream}"/>
      ${modernPerson(690, 230, { pose: 'waving', scale: 0.45 })}
      
      <!-- Chat bubbles -->
      <rect x="470" y="270" width="290" height="90" rx="16" fill="${COLORS.bg.softBlue}"/>
      <rect x="490" y="290" width="120" height="25" rx="12" fill="${COLORS.white}"/>
      <rect x="490" y="320" width="180" height="25" rx="12" fill="${COLORS.accent.blue}" opacity="0.3"/>
      
      ${floatingDecor(45, 380, 'blob', 28, COLORS.accent.yellow, 0.5)}
      ${floatingDecor(765, 380, 'circle', 25, COLORS.accent.coral, 0.4)}
    `;
  },

  // Meeting/presentation
  meeting: (title) => {
    return `
      <!-- Main presentation area -->
      <rect x="50" y="40" width="450" height="320" rx="20" fill="${COLORS.bg.warmGray}"/>
      ${modernWhiteboard(80, 60, 220, 150)}
      ${modernPerson(200, 320, { pose: 'presenting', scale: 0.95 })}
      ${modernPlant(420, 240, 0.85)}
      
      <!-- Audience panel -->
      <rect x="520" y="40" width="240" height="150" rx="16" fill="${COLORS.bg.softBlue}"/>
      ${modernPerson(580, 160, { pose: 'sitting', scale: 0.55 })}
      ${modernPerson(680, 160, { pose: 'sitting', scale: 0.55 })}
      
      <rect x="520" y="210" width="240" height="150" rx="16" fill="${COLORS.bg.softGreen}"/>
      ${modernPerson(580, 330, { pose: 'sitting', scale: 0.55 })}
      ${modernPerson(680, 330, { pose: 'sitting', scale: 0.55 })}
      
      ${floatingDecor(40, 380, 'diamond', 25, COLORS.accent.teal, 0.5)}
      ${floatingDecor(770, 50, 'circle', 30, COLORS.accent.coral, 0.4)}
      ${floatingDecor(500, 380, 'blob', 22, COLORS.accent.yellow, 0.5)}
    `;
  },

  // Coding/development
  coding: (title) => {
    return `
      <!-- Main coding workspace -->
      <rect x="50" y="40" width="420" height="320" rx="20" fill="${COLORS.bg.softBlue}"/>
      ${modernDesk(100, 250, 280)}
      ${modernChair(240, 300, COLORS.accent.purple)}
      ${modernPerson(240, 350, { pose: 'working', scale: 0.9 })}
      ${modernLaptop(140, 220, 1.0, COLORS.accent.purple)}
      ${modernLaptop(250, 225, 0.8, COLORS.accent.teal)}
      ${modernPlant(400, 230, 0.75)}
      
      <!-- Code snippets panel -->
      <rect x="490" y="40" width="270" height="180" rx="16" fill="#2D3436"/>
      <rect x="510" y="65" width="100" height="8" rx="4" fill="${COLORS.accent.purple}" opacity="0.7"/>
      <rect x="510" y="85" width="150" height="8" rx="4" fill="${COLORS.accent.teal}" opacity="0.6"/>
      <rect x="510" y="105" width="80" height="8" rx="4" fill="${COLORS.accent.coral}" opacity="0.6"/>
      <rect x="530" y="125" width="120" height="8" rx="4" fill="${COLORS.accent.blue}" opacity="0.5"/>
      <rect x="530" y="145" width="90" height="8" rx="4" fill="${COLORS.accent.yellow}" opacity="0.5"/>
      <rect x="510" y="165" width="60" height="8" rx="4" fill="${COLORS.accent.purple}" opacity="0.6"/>
      <rect x="510" y="185" width="140" height="8" rx="4" fill="${COLORS.accent.green}" opacity="0.5"/>
      
      <!-- Team panel -->
      <rect x="490" y="240" width="270" height="120" rx="16" fill="${COLORS.bg.softPink}"/>
      ${modernPerson(550, 330, { pose: 'standing', scale: 0.5 })}
      ${modernPerson(630, 330, { pose: 'waving', scale: 0.5 })}
      ${modernPerson(710, 330, { pose: 'standing', scale: 0.5 })}
      
      ${floatingDecor(40, 380, 'circle', 28, COLORS.accent.purple, 0.5)}
      ${floatingDecor(770, 380, 'diamond', 22, COLORS.accent.teal, 0.4)}
    `;
  },

  // Interview/hiring
  interview: (title) => {
    return `
      <!-- Interview room -->
      <rect x="50" y="40" width="400" height="320" rx="20" fill="${COLORS.bg.cream}"/>
      ${modernDesk(120, 200, 220)}
      ${modernPerson(180, 300, { pose: 'sitting', scale: 0.85 })}
      ${modernPerson(320, 300, { pose: 'sitting', scale: 0.85 })}
      ${modernPlant(380, 180, 0.7)}
      ${modernWindow(80, 60, 80, 100)}
      
      <!-- Candidate info panel -->
      <rect x="470" y="40" width="290" height="150" rx="16" fill="${COLORS.bg.softBlue}"/>
      <circle cx="540" cy="100" r="35" fill="${COLORS.accent.blue}" opacity="0.3"/>
      <rect x="590" y="70" width="100" height="10" rx="5" fill="${COLORS.accent.blue}" opacity="0.5"/>
      <rect x="590" y="90" width="140" height="8" rx="4" fill="${COLORS.clothing.slate}" opacity="0.4"/>
      <rect x="590" y="110" width="120" height="8" rx="4" fill="${COLORS.clothing.slate}" opacity="0.3"/>
      <rect x="590" y="130" width="80" height="8" rx="4" fill="${COLORS.clothing.slate}" opacity="0.3"/>
      
      <!-- Team panel -->
      <rect x="470" y="210" width="290" height="150" rx="16" fill="${COLORS.bg.softGreen}"/>
      ${modernPerson(540, 330, { pose: 'waving', scale: 0.55 })}
      ${modernPerson(630, 330, { pose: 'standing', scale: 0.55 })}
      ${modernPerson(720, 330, { pose: 'standing', scale: 0.55 })}
      
      ${floatingDecor(40, 380, 'blob', 30, COLORS.accent.coral, 0.4)}
      ${floatingDecor(770, 50, 'circle', 25, COLORS.accent.teal, 0.5)}
    `;
  },

  // Success/celebration
  success: (title) => {
    return `
      <!-- Celebration scene -->
      <rect x="50" y="40" width="700" height="320" rx="24" fill="${COLORS.bg.softPink}"/>
      
      <!-- Confetti/decorations -->
      ${floatingDecor(100, 80, 'circle', 20, COLORS.accent.coral, 0.7)}
      ${floatingDecor(200, 60, 'diamond', 18, COLORS.accent.yellow, 0.8)}
      ${floatingDecor(320, 90, 'circle', 15, COLORS.accent.teal, 0.6)}
      ${floatingDecor(450, 70, 'square', 16, COLORS.accent.purple, 0.7)}
      ${floatingDecor(550, 85, 'circle', 22, COLORS.accent.blue, 0.6)}
      ${floatingDecor(680, 65, 'diamond', 20, COLORS.accent.coral, 0.7)}
      ${floatingDecor(150, 120, 'square', 12, COLORS.accent.green, 0.5)}
      ${floatingDecor(600, 110, 'circle', 14, COLORS.accent.yellow, 0.6)}
      
      <!-- Celebrating people -->
      ${modernPerson(150, 320, { pose: 'waving', scale: 0.9 })}
      ${modernPerson(280, 320, { pose: 'waving', scale: 0.85 })}
      ${modernPerson(400, 320, { pose: 'waving', scale: 0.9 })}
      ${modernPerson(520, 320, { pose: 'waving', scale: 0.85 })}
      ${modernPerson(650, 320, { pose: 'waving', scale: 0.9 })}
      
      <!-- Trophy/achievement -->
      <circle cx="400" cy="180" r="50" fill="${COLORS.accent.yellow}" opacity="0.3"/>
      <circle cx="400" cy="180" r="35" fill="${COLORS.accent.yellow}" opacity="0.5"/>
      <text x="400" y="190" text-anchor="middle" font-size="40" fill="${COLORS.accent.coral}">🏆</text>
      
      ${floatingDecor(40, 380, 'blob', 35, COLORS.accent.yellow, 0.5)}
      ${floatingDecor(760, 380, 'circle', 30, COLORS.accent.teal, 0.4)}
    `;
  },

  // Brainstorming
  brainstorm: (title) => {
    return `
      <!-- Brainstorm room -->
      <rect x="50" y="40" width="450" height="320" rx="20" fill="${COLORS.bg.softGreen}"/>
      ${modernWhiteboard(80, 60, 200, 130)}
      ${modernPerson(200, 320, { pose: 'presenting', scale: 0.85 })}
      ${modernPerson(350, 320, { pose: 'standing', scale: 0.8 })}
      ${modernPlant(420, 240, 0.75)}
      
      <!-- Ideas floating -->
      ${floatingDecor(320, 80, 'circle', 35, COLORS.accent.yellow, 0.6)}
      ${floatingDecor(380, 120, 'circle', 25, COLORS.accent.coral, 0.5)}
      ${floatingDecor(420, 70, 'circle', 20, COLORS.accent.teal, 0.5)}
      
      <!-- Sticky notes panel -->
      <rect x="520" y="40" width="240" height="320" rx="16" fill="${COLORS.bg.warmGray}"/>
      <rect x="540" y="70" width="80" height="70" rx="4" fill="${COLORS.accent.yellow}" opacity="0.8" transform="rotate(-3 580 105)"/>
      <rect x="640" y="65" width="80" height="70" rx="4" fill="${COLORS.accent.pink}" opacity="0.8" transform="rotate(2 680 100)"/>
      <rect x="550" y="160" width="80" height="70" rx="4" fill="${COLORS.accent.blue}" opacity="0.7" transform="rotate(1 590 195)"/>
      <rect x="650" y="155" width="80" height="70" rx="4" fill="${COLORS.accent.green}" opacity="0.7" transform="rotate(-2 690 190)"/>
      <rect x="560" y="250" width="80" height="70" rx="4" fill="${COLORS.accent.coral}" opacity="0.7" transform="rotate(3 600 285)"/>
      <rect x="660" y="245" width="80" height="70" rx="4" fill="${COLORS.accent.purple}" opacity="0.7" transform="rotate(-1 700 280)"/>
      
      ${floatingDecor(40, 380, 'diamond', 25, COLORS.accent.coral, 0.5)}
      ${floatingDecor(770, 380, 'blob', 28, COLORS.accent.teal, 0.4)}
    `;
  },

  // Default scene
  default: (title) => {
    return `
      <!-- Main workspace -->
      <rect x="50" y="40" width="380" height="320" rx="20" fill="${COLORS.bg.warmGray}"/>
      ${modernDesk(100, 250, 200)}
      ${modernChair(200, 300, COLORS.accent.blue)}
      ${modernPerson(200, 350, { pose: 'working', scale: 0.9 })}
      ${modernLaptop(130, 225, 0.85)}
      ${modernPlant(320, 230, 0.8)}
      ${modernWindow(80, 60, 90, 110)}
      
      <!-- Side panels -->
      <rect x="450" y="40" width="310" height="150" rx="16" fill="${COLORS.bg.softBlue}"/>
      ${modernPerson(530, 160, { pose: 'standing', scale: 0.55 })}
      ${modernPerson(620, 160, { pose: 'waving', scale: 0.55 })}
      ${modernPerson(710, 160, { pose: 'standing', scale: 0.55 })}
      
      <rect x="450" y="210" width="310" height="150" rx="16" fill="${COLORS.bg.softPink}"/>
      ${modernBookshelf(480, 230, 70, 110)}
      ${modernPlant(600, 300, 0.6)}
      
      ${floatingDecor(40, 380, 'circle', 28, COLORS.accent.coral, 0.5)}
      ${floatingDecor(770, 50, 'diamond', 25, COLORS.accent.teal, 0.4)}
      ${floatingDecor(430, 380, 'blob', 22, COLORS.accent.yellow, 0.5)}
    `;
  },
};


// ============== KEYWORD DETECTION ==============

const KEYWORDS = {
  collaboration: ['collaboration', 'team', 'together', 'pair', 'group', 'collective', 'shared', 'cooperative', 'teamwork'],
  remote: ['remote', 'home', 'wfh', 'distributed', 'async', 'virtual', 'zoom', 'video call', 'hybrid', 'work from home'],
  meeting: ['meeting', 'standup', 'sync', 'discuss', 'agenda', 'scrum', 'sprint', 'planning', 'retrospective', 'presentation', 'demo'],
  coding: ['code', 'coding', 'programming', 'develop', 'software', 'engineer', 'debug', 'build', 'implement', 'api', 'frontend', 'backend', 'developer'],
  interview: ['interview', 'hire', 'hiring', 'recruit', 'candidate', 'job', 'career', 'onboard', 'talent', 'resume'],
  success: ['success', 'celebrate', 'win', 'achieve', 'launch', 'ship', 'complete', 'milestone', 'goal', 'done', 'congratulations'],
  brainstorm: ['brainstorm', 'idea', 'ideation', 'creative', 'innovation', 'think', 'concept', 'workshop', 'design thinking'],
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
  gradientCounter = 0; // Reset counter for each SVG
  
  const scene = SCENES[sceneType] || SCENES.default;
  const content = scene(title);
  
  // Modern title bar
  const titleBar = `
    <rect x="180" y="${H - 65}" width="${W - 360}" height="50" rx="25" fill="${COLORS.white}" 
          filter="url(#titleShadow)"/>
    <text x="${W / 2}" y="${H - 35}" text-anchor="middle" fill="${COLORS.clothing.charcoal}" 
          font-size="15" font-family="system-ui, -apple-system, 'SF Pro Display', sans-serif" font-weight="600">
      ${escapeXml(title.substring(0, 55))}
    </text>
  `;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="mainBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.bg.cream}"/>
      <stop offset="50%" stop-color="${COLORS.bg.warmGray}"/>
      <stop offset="100%" stop-color="${COLORS.bg.cream}"/>
    </linearGradient>
    <filter id="titleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.08"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#mainBg)"/>
  
  <!-- Scene content -->
  ${content}
  
  <!-- Title bar -->
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

export async function generateModernIllustration(title, content = '', filename = null, options = {}) {
  await ensureImagesDir();
  
  const sceneType = options.scene || detectSceneType(title, content);
  const svg = generateSVG(sceneType, title);
  
  const hash = crypto.createHash('md5').update(String(title)).digest('hex').slice(0, 8);
  const outputFilename = filename || `modern-${hash}`;
  const outputPath = path.join(IMAGES_DIR, `${outputFilename}.svg`);
  
  await fs.promises.writeFile(outputPath, svg, 'utf-8');
  
  return { path: outputPath, scene: sceneType, filename: `${outputFilename}.svg` };
}

export function generateModernSceneSVG(sceneName, title = '') {
  gradientCounter = 0;
  const displayTitle = title || `${sceneName.charAt(0).toUpperCase() + sceneName.slice(1)} Scene`;
  return generateSVG(sceneName, displayTitle);
}

export function getAvailableModernScenes() {
  return Object.keys(SCENES);
}

export { detectSceneType as detectModernScene };

export default { 
  generateModernIllustration, 
  generateModernSceneSVG, 
  getAvailableModernScenes, 
  detectModernScene: detectSceneType 
};

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type MascotState = 'idle' | 'walk' | 'jump' | 'flip' | 'wave' | 'dance' | 'sleep' | 'spin' | 'bounce' | 'shake' | 'nod' | 'wiggle' | 'celebrate' | 'sad';
type MascotType = 'coder' | 'goat' | 'giraffe' | 'penguin' | 'cat' | 'robot' | 'dog' | 'bunny' | 'fox' | 'owl' | 'duck' | 'frog';

const MASCOT_TYPES: MascotType[] = ['coder', 'goat', 'giraffe', 'penguin', 'cat', 'robot', 'dog', 'bunny', 'fox', 'owl', 'duck', 'frog'];

// Celebration messages per mascot
const CELEBRATE_MESSAGES: Record<MascotType, string[]> = {
  coder: ['🎉 You did it!', '💯 Perfect!', '🚀 Shipped!', '⭐ Brilliant!'],
  goat: ['🐐 GOAT move!', '🏆 Champion!', '🎸 Rock on!', '⭐ Legendary!'],
  giraffe: ['🦒 Sky high!', '🌟 Stellar!', '🎯 Nailed it!', '👏 Bravo!'],
  penguin: ['🐧 Ice cold!', '❄️ Smooth!', '🎉 Awesome!', '💎 Flawless!'],
  cat: ['😺 Purrfect!', '🐱 Meow-nificent!', '⭐ Clawsome!', '🎉 Yay!'],
  robot: ['🤖 Success!', '✅ Computed!', '🎯 Optimal!', '⚡ Executed!'],
  dog: ['🐕 Good job!', '🦴 Treat time!', '🎉 Woof woof!', '⭐ Best friend!'],
  bunny: ['🐰 Hop-tastic!', '🥕 Carrot earned!', '✨ Magical!', '🎉 Yippee!'],
  fox: ['🦊 Clever!', '🎯 Outsmarted!', '⭐ Sly win!', '🎉 Fantastic!'],
  owl: ['🦉 Wise choice!', '📚 Scholarly!', '🎓 A+ work!', '⭐ Brilliant!'],
  duck: ['🦆 Quack-tastic!', '💧 Smooth sailing!', '🎉 Ducky!', '⭐ Splendid!'],
  frog: ['🐸 Ribbiting!', '🪷 Leap of joy!', '🎉 Toad-ally!', '⭐ Amphibious!'],
};

// Disappointment messages per mascot
const SAD_MESSAGES: Record<MascotType, string[]> = {
  coder: ['🐛 Bug found...', '💔 Syntax error', '🔧 Try again!', '📝 Debug time'],
  goat: ['🐐 Baaad luck...', '😢 Missed it', '💪 Next time!', '🔄 Retry?'],
  giraffe: ['🦒 Fell short...', '😔 So close', '🌱 Keep growing!', '💪 Stand tall!'],
  penguin: ['🐧 Slipped up...', '❄️ Cold miss', '🔄 Waddle back!', '💪 Stay cool!'],
  cat: ['😿 Meow...', '🐱 Hairball...', '💤 Nap first?', '🔄 9 lives left!'],
  robot: ['🤖 Error...', '⚠️ Malfunction', '🔧 Recalibrating', '🔄 Rebooting...'],
  dog: ['🐕 Ruff day...', '😢 Whimper', '🦴 Treat needed', '💪 Fetch again!'],
  bunny: ['🐰 Oops...', '🥕 Missed carrot', '😢 Hop back!', '💪 Try again!'],
  fox: ['🦊 Outsmarted...', '😔 Tricky one', '🔄 Sneak back!', '💪 Stay sly!'],
  owl: ['🦉 Hoo knew...', '📚 Study more', '🌙 Sleep on it', '💪 Wisdom grows!'],
  duck: ['🦆 Quack...', '💧 Water off', '😢 Paddle on!', '💪 Duck it!'],
  frog: ['🐸 Ribbit...', '🪷 Missed lily', '😢 Hop back!', '💪 Leap again!'],
};

// Global event emitter for mascot reactions
export const mascotEvents = {
  celebrate: () => window.dispatchEvent(new CustomEvent('mascot-celebrate')),
  disappointed: () => window.dispatchEvent(new CustomEvent('mascot-sad')),
};

// Each mascot has unique tricks based on their personality
const MASCOT_TRICKS: Record<MascotType, MascotState[]> = {
  coder: ['wave', 'dance', 'nod', 'flip'],        // Coder: waves, dances, nods (thinking), flips (excited)
  goat: ['jump', 'shake', 'dance', 'bounce'],     // Goat: jumps high, shakes head, dances, bounces
  giraffe: ['nod', 'wave', 'wiggle', 'dance'],    // Giraffe: nods (tall), waves, wiggles neck, dances
  penguin: ['wiggle', 'wave', 'spin', 'dance'],   // Penguin: waddle wiggle, waves, spins on ice, dances
  cat: ['bounce', 'spin', 'shake', 'wave'],       // Cat: pounce bounce, spins, shakes, lazy wave
  robot: ['spin', 'nod', 'shake', 'dance'],       // Robot: spins, nods (processing), shakes (error), dances
  dog: ['jump', 'shake', 'spin', 'wave'],         // Dog: jumps (excited), shakes, spins (chasing tail), waves paw
  bunny: ['bounce', 'jump', 'wiggle', 'wave'],    // Bunny: bounces, hops high, wiggles nose, waves
  fox: ['spin', 'bounce', 'wave', 'dance'],       // Fox: spins (sly), bounces, waves, dances
  owl: ['nod', 'spin', 'wave', 'wiggle'],         // Owl: nods (wise), head spin, waves wing, wiggles
  duck: ['shake', 'wiggle', 'wave', 'dance'],     // Duck: shakes water off, waddle wiggle, waves, dances
  frog: ['jump', 'bounce', 'spin', 'wave'],       // Frog: big jump, bounces, spins, waves
};

const MASCOT_MESSAGES: Record<MascotType, Record<string, string>> = {
  coder: { wave: '👋 Debug time!', dance: '🎉 Ship it!', nod: '🤔 Hmm...', flip: '🚀 Deployed!' },
  goat: { jump: '🐐 GOAT jump!', shake: '🎸 Baaaa!', dance: '🎵 Groovy!', bounce: '⬆️ Boing!' },
  giraffe: { nod: '🦒 Indeed!', wave: '👋 Hi up here!', wiggle: '🌴 Stretchy!', dance: '🎵 Tall moves!' },
  penguin: { wiggle: '🐧 Waddle!', wave: '👋 Cool!', spin: '❄️ Wheee!', dance: '🕺 Slide!' },
  cat: { bounce: '😺 Pounce!', spin: '🌀 Zoomies!', shake: '😾 Meh.', wave: '🐱 *yawn*' },
  robot: { spin: '🤖 Rotating!', nod: '⚙️ Processing...', shake: '⚠️ Error 404!', dance: '🎛️ Beep boop!' },
  dog: { jump: '🐕 Ball?!', shake: '💦 Shake!', spin: '🌀 Tail!', wave: '🐾 Hi friend!' },
  bunny: { bounce: '🐰 Boing!', jump: '🥕 Hop hop!', wiggle: '👃 *sniff*', wave: '✨ Hewwo!' },
  fox: { spin: '🦊 Sneaky!', bounce: '🍂 Pounce!', wave: '👋 Hehe!', dance: '🎶 Ring-ding!' },
  owl: { nod: '🦉 Wise!', spin: '🔄 Whoooo!', wave: '📚 Hello!', wiggle: '🌙 Hoot!' },
  duck: { shake: '💧 Splash!', wiggle: '🦆 Waddle!', wave: '👋 Quack!', dance: '🎵 Duck dance!' },
  frog: { jump: '🐸 Ribbit!', bounce: '🪷 Boing!', spin: '🌀 Wheee!', wave: '👋 Croak!' },
};

const CoderSprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="10" y="4" width="12" height="4" fill="#4a3728" />
    <rect x="8" y="6" width="16" height="2" fill="#4a3728" />
    <rect x="10" y="8" width="12" height="10" fill="#ffd5b5" />
    {state === 'sleep' ? (
      <><rect x="12" y="12" width="3" height="1" fill="#333" /><rect x="17" y="12" width="3" height="1" fill="#333" /></>
    ) : (
      <><rect x="12" y="11" width="2" height="3" fill="#333" /><rect x="18" y="11" width="2" height="3" fill="#333" /></>
    )}
    <rect x="8" y="18" width="16" height="8" fill="#6366f1" />
    <rect x="10" y="26" width="4" height="4" fill="#374151" />
    <rect x="18" y="26" width="4" height="4" fill="#374151" />
  </>
);

const GoatSprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="8" y="2" width="2" height="6" fill="#d4a574" />
    <rect x="22" y="2" width="2" height="6" fill="#d4a574" />
    <rect x="10" y="6" width="12" height="12" fill="#f5f5f5" />
    {state === 'sleep' ? (
      <><rect x="12" y="11" width="3" height="1" fill="#333" /><rect x="17" y="11" width="3" height="1" fill="#333" /></>
    ) : (
      <><rect x="12" y="10" width="3" height="4" fill="#fbbf24" /><rect x="17" y="10" width="3" height="4" fill="#fbbf24" /></>
    )}
    <rect x="10" y="20" width="12" height="8" fill="#f5f5f5" />
    <rect x="10" y="28" width="3" height="4" fill="#d4a574" />
    <rect x="19" y="28" width="3" height="4" fill="#d4a574" />
  </>
);

const GiraffeSprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="12" y="0" width="2" height="4" fill="#92400e" />
    <rect x="18" y="0" width="2" height="4" fill="#92400e" />
    <rect x="10" y="4" width="12" height="10" fill="#fbbf24" />
    {state === 'sleep' ? (
      <><rect x="12" y="9" width="2" height="1" fill="#333" /><rect x="18" y="9" width="2" height="1" fill="#333" /></>
    ) : (
      <><rect x="12" y="8" width="2" height="3" fill="#333" /><rect x="18" y="8" width="2" height="3" fill="#333" /></>
    )}
    <rect x="8" y="20" width="16" height="8" fill="#fbbf24" />
    <rect x="9" y="28" width="3" height="4" fill="#fbbf24" />
    <rect x="20" y="28" width="3" height="4" fill="#fbbf24" />
  </>
);

const PenguinSprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="10" y="4" width="12" height="12" fill="#1f2937" />
    <rect x="12" y="8" width="8" height="8" fill="#f5f5f5" />
    {state === 'sleep' ? (
      <><rect x="13" y="10" width="2" height="1" fill="#333" /><rect x="17" y="10" width="2" height="1" fill="#333" /></>
    ) : (
      <><rect x="13" y="9" width="2" height="3" fill="#333" /><rect x="17" y="9" width="2" height="3" fill="#333" /></>
    )}
    <rect x="14" y="12" width="4" height="3" fill="#f97316" />
    <rect x="8" y="16" width="16" height="12" fill="#1f2937" />
    <rect x="10" y="28" width="4" height="4" fill="#f97316" />
    <rect x="18" y="28" width="4" height="4" fill="#f97316" />
  </>
);

const CatSprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="8" y="2" width="4" height="6" fill="#f97316" />
    <rect x="20" y="2" width="4" height="6" fill="#f97316" />
    <rect x="8" y="6" width="16" height="12" fill="#f97316" />
    {state === 'sleep' ? (
      <><rect x="11" y="11" width="3" height="1" fill="#333" /><rect x="18" y="11" width="3" height="1" fill="#333" /></>
    ) : (
      <><rect x="11" y="9" width="4" height="4" fill="#22c55e" /><rect x="17" y="9" width="4" height="4" fill="#22c55e" /></>
    )}
    <rect x="10" y="18" width="12" height="10" fill="#f97316" />
    <rect x="10" y="28" width="3" height="4" fill="#f97316" />
    <rect x="19" y="28" width="3" height="4" fill="#f97316" />
  </>
);

const RobotSprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="15" y="0" width="2" height="4" fill="#6b7280" />
    <rect x="14" y="0" width="4" height="2" fill="#ef4444" />
    <rect x="8" y="4" width="16" height="12" fill="#9ca3af" />
    {state === 'sleep' ? (
      <><rect x="12" y="9" width="3" height="2" fill="#ef4444" /><rect x="17" y="9" width="3" height="2" fill="#ef4444" /></>
    ) : (
      <><rect x="12" y="8" width="3" height="4" fill="#22d3ee" /><rect x="17" y="8" width="3" height="4" fill="#22d3ee" /></>
    )}
    <rect x="8" y="16" width="16" height="12" fill="#9ca3af" />
    <rect x="10" y="28" width="4" height="4" fill="#6b7280" />
    <rect x="18" y="28" width="4" height="4" fill="#6b7280" />
  </>
);

// Dog - golden retriever style
const DogSprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="6" y="6" width="6" height="8" fill="#d4a574" />
    <rect x="20" y="6" width="6" height="8" fill="#d4a574" />
    <rect x="8" y="4" width="16" height="14" fill="#f4c87a" />
    {state === 'sleep' ? (
      <><rect x="11" y="10" width="3" height="1" fill="#333" /><rect x="18" y="10" width="3" height="1" fill="#333" /></>
    ) : (
      <><rect x="11" y="9" width="3" height="3" fill="#4a3728" /><rect x="18" y="9" width="3" height="3" fill="#4a3728" /></>
    )}
    <rect x="14" y="13" width="4" height="3" fill="#333" />
    <rect x="15" y="16" width="2" height="2" fill="#ef4444" />
    <rect x="10" y="18" width="12" height="10" fill="#f4c87a" />
    <rect x="10" y="28" width="3" height="4" fill="#f4c87a" />
    <rect x="19" y="28" width="3" height="4" fill="#f4c87a" />
    <rect x="22" y="20" width="6" height="3" fill="#f4c87a" />
  </>
);

// Bunny - white with pink ears
const BunnySprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="10" y="0" width="4" height="10" fill="#fff" />
    <rect x="18" y="0" width="4" height="10" fill="#fff" />
    <rect x="11" y="1" width="2" height="8" fill="#fce7f3" />
    <rect x="19" y="1" width="2" height="8" fill="#fce7f3" />
    <rect x="8" y="8" width="16" height="12" fill="#fff" />
    {state === 'sleep' ? (
      <><rect x="11" y="12" width="3" height="1" fill="#333" /><rect x="18" y="12" width="3" height="1" fill="#333" /></>
    ) : (
      <><rect x="11" y="11" width="3" height="3" fill="#ef4444" /><rect x="18" y="11" width="3" height="3" fill="#ef4444" /></>
    )}
    <rect x="15" y="15" width="2" height="2" fill="#fce7f3" />
    <rect x="10" y="20" width="12" height="8" fill="#fff" />
    <rect x="11" y="28" width="4" height="4" fill="#fff" />
    <rect x="17" y="28" width="4" height="4" fill="#fff" />
    <rect x="22" y="22" width="4" height="4" fill="#fff" />
  </>
);

// Fox - orange with white chest
const FoxSprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="6" y="4" width="6" height="8" fill="#ea580c" />
    <rect x="20" y="4" width="6" height="8" fill="#ea580c" />
    <rect x="7" y="5" width="4" height="6" fill="#fff" />
    <rect x="21" y="5" width="4" height="6" fill="#fff" />
    <rect x="8" y="6" width="16" height="12" fill="#ea580c" />
    <rect x="12" y="14" width="8" height="4" fill="#fff" />
    {state === 'sleep' ? (
      <><rect x="11" y="10" width="3" height="1" fill="#333" /><rect x="18" y="10" width="3" height="1" fill="#333" /></>
    ) : (
      <><rect x="11" y="9" width="3" height="3" fill="#fbbf24" /><rect x="18" y="9" width="3" height="3" fill="#fbbf24" /></>
    )}
    <rect x="15" y="13" width="2" height="2" fill="#333" />
    <rect x="10" y="18" width="12" height="10" fill="#ea580c" />
    <rect x="13" y="18" width="6" height="8" fill="#fff" />
    <rect x="10" y="28" width="3" height="4" fill="#1f2937" />
    <rect x="19" y="28" width="3" height="4" fill="#1f2937" />
    <rect x="22" y="20" width="6" height="3" fill="#ea580c" />
    <rect x="26" y="21" width="2" height="2" fill="#fff" />
  </>
);

// Owl - brown with big eyes
const OwlSprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="8" y="2" width="4" height="4" fill="#92400e" />
    <rect x="20" y="2" width="4" height="4" fill="#92400e" />
    <rect x="8" y="4" width="16" height="14" fill="#a16207" />
    <rect x="10" y="8" width="5" height="5" fill="#fef3c7" />
    <rect x="17" y="8" width="5" height="5" fill="#fef3c7" />
    {state === 'sleep' ? (
      <><rect x="11" y="10" width="3" height="1" fill="#333" /><rect x="18" y="10" width="3" height="1" fill="#333" /></>
    ) : (
      <><rect x="11" y="9" width="3" height="3" fill="#f97316" /><rect x="12" y="10" width="1" height="1" fill="#333" />
        <rect x="18" y="9" width="3" height="3" fill="#f97316" /><rect x="19" y="10" width="1" height="1" fill="#333" /></>
    )}
    <rect x="14" y="13" width="4" height="3" fill="#fbbf24" />
    <rect x="10" y="18" width="12" height="10" fill="#a16207" />
    <rect x="12" y="20" width="8" height="6" fill="#fef3c7" />
    <rect x="6" y="18" width="4" height="8" fill="#92400e" />
    <rect x="22" y="18" width="4" height="8" fill="#92400e" />
    <rect x="12" y="28" width="3" height="4" fill="#fbbf24" />
    <rect x="17" y="28" width="3" height="4" fill="#fbbf24" />
  </>
);

// Duck - yellow with orange beak
const DuckSprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="10" y="4" width="12" height="12" fill="#fbbf24" />
    {state === 'sleep' ? (
      <><rect x="12" y="9" width="2" height="1" fill="#333" /><rect x="18" y="9" width="2" height="1" fill="#333" /></>
    ) : (
      <><rect x="12" y="8" width="2" height="3" fill="#333" /><rect x="18" y="8" width="2" height="3" fill="#333" /></>
    )}
    <rect x="22" y="10" width="6" height="4" fill="#f97316" />
    <rect x="10" y="16" width="12" height="12" fill="#fbbf24" />
    <rect x="6" y="18" width="4" height="6" fill="#fbbf24" />
    <rect x="22" y="18" width="4" height="6" fill="#fbbf24" />
    <rect x="12" y="28" width="3" height="4" fill="#f97316" />
    <rect x="17" y="28" width="3" height="4" fill="#f97316" />
  </>
);

// Frog - green with big eyes
const FrogSprite = ({ state }: { state: MascotState }) => (
  <>
    <rect x="8" y="2" width="6" height="6" fill="#22c55e" />
    <rect x="18" y="2" width="6" height="6" fill="#22c55e" />
    {state === 'sleep' ? (
      <><rect x="9" y="4" width="4" height="1" fill="#333" /><rect x="19" y="4" width="4" height="1" fill="#333" /></>
    ) : (
      <><rect x="9" y="3" width="4" height="4" fill="#fff" /><rect x="10" y="4" width="2" height="2" fill="#333" />
        <rect x="19" y="3" width="4" height="4" fill="#fff" /><rect x="20" y="4" width="2" height="2" fill="#333" /></>
    )}
    <rect x="8" y="8" width="16" height="10" fill="#22c55e" />
    <rect x="12" y="14" width="8" height="4" fill="#86efac" />
    <rect x="14" y="12" width="4" height="2" fill="#166534" />
    <rect x="8" y="18" width="16" height="10" fill="#22c55e" />
    <rect x="12" y="20" width="8" height="6" fill="#86efac" />
    <rect x="6" y="26" width="6" height="6" fill="#22c55e" />
    <rect x="20" y="26" width="6" height="6" fill="#22c55e" />
  </>
);

const SPRITE_MAP: Record<MascotType, React.FC<{ state: MascotState }>> = {
  coder: CoderSprite,
  goat: GoatSprite,
  giraffe: GiraffeSprite,
  penguin: PenguinSprite,
  cat: CatSprite,
  robot: RobotSprite,
  dog: DogSprite,
  bunny: BunnySprite,
  fox: FoxSprite,
  owl: OwlSprite,
  duck: DuckSprite,
  frog: FrogSprite,
};

const getAnimation = (state: MascotState) => {
  switch (state) {
    case 'jump': return { y: [0, -35, -38, -35, 0], scale: [1, 1.1, 1.15, 1.1, 1] };
    case 'flip': return { rotateY: [0, 180, 360], scale: [1, 1.2, 1] };
    case 'dance': return { rotate: [-15, 15, -15, 15, -10, 10], y: [0, -5, 0, -5, 0, -3] };
    case 'walk': return { y: [0, -4, 0], rotate: [-2, 2, -2] };
    case 'spin': return { rotate: [0, 360, 720], scale: [1, 1.1, 1] };
    case 'bounce': return { y: [0, -20, 0, -15, 0, -10, 0, -5, 0], scale: [1, 1.15, 1, 1.1, 1, 1.05, 1] };
    case 'shake': return { x: [-6, 6, -6, 6, -4, 4, -2, 2, 0], rotate: [-3, 3, -3, 3, 0] };
    case 'nod': return { y: [0, 5, 0, 5, 0, 3, 0], scale: [1, 0.95, 1, 0.95, 1] };
    case 'wiggle': return { rotate: [-8, 8, -8, 8, -5, 5, 0], x: [-2, 2, -2, 2, 0] };
    case 'celebrate': return { y: [0, -40, 0, -30, 0, -20, 0, -10, 0], scale: [1, 1.3, 1, 1.2, 1, 1.1, 1], rotate: [0, -10, 10, -10, 10, 0] };
    case 'sad': return { y: [0, 8, 5, 8, 5], rotate: [-8, 0, 8, 0, -5, 0], scale: [1, 0.9, 0.92, 0.9, 0.95] };
    case 'idle': return { y: [0, -2, 0, -1, 0], scale: [1, 1.02, 1, 1.01, 1] }; // Breathing animation
    default: return { y: [0, -2, 0], scale: [1, 1.02, 1] };
  }
};

const PixelCharacter = ({ mascotType, state, direction }: { mascotType: MascotType; state: MascotState; direction: 'left' | 'right' }) => {
  const SpriteComponent = SPRITE_MAP[mascotType];
  const loopingStates: MascotState[] = ['walk', 'dance', 'wiggle', 'celebrate', 'idle'];
  
  // Faster, snappier durations for more energy
  const getDuration = () => {
    switch (state) {
      case 'walk': return 0.2;
      case 'dance': return 0.4;
      case 'celebrate': return 0.6;
      case 'sad': return 0.8;
      case 'jump': return 0.35;
      case 'bounce': return 0.5;
      case 'spin': return 0.4;
      case 'flip': return 0.4;
      case 'shake': return 0.3;
      case 'wiggle': return 0.35;
      case 'nod': return 0.4;
      case 'idle': return 2; // Slow breathing
      default: return 0.4;
    }
  };
  
  return (
    <motion.svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      style={{ imageRendering: 'pixelated', transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }}
      animate={getAnimation(state)}
      transition={{ 
        duration: getDuration(), 
        repeat: loopingStates.includes(state) ? Infinity : 0, 
        ease: state === 'idle' ? 'easeInOut' : [0.25, 0.46, 0.45, 0.94] // Snappy easing
      }}
    >
      <SpriteComponent state={state} />
    </motion.svg>
  );
};

export default function PixelMascot() {
  const [mascotType] = useState<MascotType>(() => MASCOT_TYPES[Math.floor(Math.random() * MASCOT_TYPES.length)]);
  const [state, setState] = useState<MascotState>('idle');
  const [position, setPosition] = useState({ x: 100 });
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [message, setMessage] = useState<string | null>(null);
  const lastActivityRef = useRef(Date.now());

  // Listen for celebration/disappointment events from other components
  useEffect(() => {
    const handleCelebrate = () => {
      lastActivityRef.current = Date.now();
      setState('celebrate');
      const msgs = CELEBRATE_MESSAGES[mascotType];
      setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
      setTimeout(() => { setState('idle'); setMessage(null); }, 3000);
    };
    
    const handleSad = () => {
      lastActivityRef.current = Date.now();
      setState('sad');
      const msgs = SAD_MESSAGES[mascotType];
      setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
      setTimeout(() => { setState('idle'); setMessage(null); }, 3000);
    };
    
    window.addEventListener('mascot-celebrate', handleCelebrate);
    window.addEventListener('mascot-sad', handleSad);
    return () => {
      window.removeEventListener('mascot-celebrate', handleCelebrate);
      window.removeEventListener('mascot-sad', handleSad);
    };
  }, [mascotType]);

  // Only look at mouse when clicked nearby, otherwise autonomous
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Only react if click is near bottom of screen (within 200px)
      if (e.clientY > window.innerHeight - 200) {
        const clickX = e.clientX;
        const dist = Math.abs(clickX - position.x);
        // If click is within 150px, look towards it
        if (dist < 150 && dist > 30) {
          setDirection(clickX > position.x ? 'right' : 'left');
          lastActivityRef.current = Date.now();
          if (state === 'sleep') setState('idle');
        }
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [position.x, state]);

  // Autonomous wandering - energetic and playful!
  useEffect(() => {
    // Quick random tricks while idle (every 1.5-3 seconds)
    const trickInterval = setInterval(() => {
      if (state === 'idle' && Math.random() > 0.5) {
        // 50% chance to do a quick trick
        const quickTricks: MascotState[] = ['nod', 'wiggle', 'shake'];
        const trick = quickTricks[Math.floor(Math.random() * quickTricks.length)];
        setState(trick);
        setTimeout(() => setState('idle'), 400);
      }
    }, 1500 + Math.random() * 1500);

    const interval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      
      // Sleep after 90 seconds of no interaction (longer before sleep)
      if (idle > 90000 && state !== 'sleep') {
        setState('sleep');
        setMessage('💤 zzz...');
        setTimeout(() => setMessage(null), 2000);
        return;
      }
      
      // Much more active! 60% chance to do something every 1.5 seconds
      if (state === 'idle' && Math.random() > 0.4) {
        const action = Math.random();
        
        if (action < 0.5) {
          // 50% - Walk somewhere
          const dir = Math.random() > 0.5 ? 'right' : 'left';
          setDirection(dir);
          setState('walk');
          let step = 0;
          const totalSteps = Math.floor(Math.random() * 30) + 15; // 15-45 steps
          const walkInt = setInterval(() => {
            step++;
            setPosition((p) => ({ x: Math.max(50, Math.min(p.x + (dir === 'right' ? 2 : -2), window.innerWidth - 80)) }));
            if (step >= totalSteps) { clearInterval(walkInt); setState('idle'); }
          }, 50); // Fast: 50ms per step
        } else if (action < 0.75) {
          // 25% - Do a random trick with message
          const tricks = MASCOT_TRICKS[mascotType];
          const trick = tricks[Math.floor(Math.random() * tricks.length)];
          setState(trick);
          const msg = MASCOT_MESSAGES[mascotType][trick];
          if (msg && Math.random() > 0.5) setMessage(msg);
          setTimeout(() => { setState('idle'); setMessage(null); }, 800);
        } else if (action < 0.9) {
          // 15% - Quick jump or bounce
          setState(Math.random() > 0.5 ? 'jump' : 'bounce');
          setTimeout(() => setState('idle'), 500);
        } else {
          // 10% - Change direction and look around
          setDirection(d => d === 'left' ? 'right' : 'left');
          setState('nod');
          setTimeout(() => setState('idle'), 400);
        }
      }
    }, 1500); // Check every 1.5 seconds (much more frequent!)
    
    return () => {
      clearInterval(interval);
      clearInterval(trickInterval);
    };
  }, [state, mascotType]);

  const handleClick = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (state === 'sleep') { 
      setState('jump'); // Wake up with a jump!
      setMessage("😊 I'm awake!"); 
      setTimeout(() => { setState('idle'); setMessage(null); }, 800); 
      return; 
    }
    
    // More dramatic reactions on click
    const tricks = MASCOT_TRICKS[mascotType];
    const trick = tricks[Math.floor(Math.random() * tricks.length)];
    setState(trick);
    const msg = MASCOT_MESSAGES[mascotType][trick] || '✨ Fun!';
    setMessage(msg);
    
    // Sometimes do a combo trick!
    if (Math.random() > 0.7) {
      setTimeout(() => {
        const secondTrick = tricks[Math.floor(Math.random() * tricks.length)];
        setState(secondTrick);
      }, 500);
    }
    
    setTimeout(() => { setState('idle'); setMessage(null); }, 1200);
  }, [state, mascotType]);

  return (
    <div 
      data-testid="pixel-mascot" 
      data-mascot-type={mascotType}
      className="fixed bottom-4 z-50 hidden cursor-pointer md:block" 
      style={{ left: position.x }} 
      onClick={handleClick}
    >
      <AnimatePresence>
        {message && (
          <motion.div
            data-testid="mascot-message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium shadow-lg"
            style={{ backgroundColor: '#1f2937', color: '#f9fafb' }}
          >
            {message}
            <div className="absolute left-1/2 top-full -translate-x-1/2" style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1f2937' }} />
          </motion.div>
        )}
      </AnimatePresence>
      <PixelCharacter mascotType={mascotType} state={state} direction={direction} />
    </div>
  );
}

// Utility to get bounding box of a sprite
function getBoundingBox(sprite) {
  const spriteSize = 50; // Fixed sprite size of 50x50
  return {
    x: sprite.position.x - spriteSize/2,
    y: sprite.position.y - spriteSize/2,
    width: spriteSize,
    height: spriteSize
  };
}

// Check collision between two sprites using AABB
export function checkCollision(spriteA, spriteB) {
  const boxA = getBoundingBox(spriteA);
  const boxB = getBoundingBox(spriteB);

  return (
    boxA.x < boxB.x + boxB.width &&
    boxA.x + boxA.width > boxB.x &&
    boxA.y < boxB.y + boxB.height &&
    boxA.y + boxA.height > boxB.y
  );
}

// Get collision point between two sprites
export function getCollisionPoint(sprite1, sprite2) {
  if (!checkCollision(sprite1, sprite2)) {
    return null;
  }

  // Return center point between sprites as collision point
  return {
    x: (sprite1.position.x + sprite2.position.x) / 2,
    y: (sprite1.position.y + sprite2.position.y) / 2
  };
}

// Collision detection utilities

// Constants for collision handling
export const COLLISION_CONSTANTS = {
  PAUSE_DURATION: 500, // Increased for more noticeable effect
  COOLDOWN_DURATION: 800, // Increased to prevent too frequent collisions
  SPRITE_SIZE: 32,
};

// Check for AABB collision between two sprites
export function checkAABBCollision(sprite1, sprite2) {
  // Convert percentage positions to actual coordinates
  const s1Left = (50 + sprite1.position.x) - COLLISION_CONSTANTS.SPRITE_SIZE / 2;
  const s1Right = (50 + sprite1.position.x) + COLLISION_CONSTANTS.SPRITE_SIZE / 2;
  const s1Top = (50 + sprite1.position.y) - COLLISION_CONSTANTS.SPRITE_SIZE / 2;
  const s1Bottom = (50 + sprite1.position.y) + COLLISION_CONSTANTS.SPRITE_SIZE / 2;

  const s2Left = (50 + sprite2.position.x) - COLLISION_CONSTANTS.SPRITE_SIZE / 2;
  const s2Right = (50 + sprite2.position.x) + COLLISION_CONSTANTS.SPRITE_SIZE / 2;
  const s2Top = (50 + sprite2.position.y) - COLLISION_CONSTANTS.SPRITE_SIZE / 2;
  const s2Bottom = (50 + sprite2.position.y) + COLLISION_CONSTANTS.SPRITE_SIZE / 2;

  const isColliding = (
    s1Left < s2Right &&
    s1Right > s2Left &&
    s1Top < s2Bottom &&
    s1Bottom > s2Top
  );

  // Calculate distance between sprites (center to center)
  const distance = Math.sqrt(
    Math.pow(sprite1.position.x - sprite2.position.x, 2) +
    Math.pow(sprite1.position.y - sprite2.position.y, 2)
  );

  // Enhanced debug collision check - only log actual collisions to reduce spam
  if (isColliding) {
    console.log('%c COLLISION DETECTED! ', 'background: red; color: white; font-weight: bold;');
    console.log('Collision Check:', {
      sprite1: {
        id: sprite1.id,
        name: sprite1.name || 'Unknown',
        pos: sprite1.position,
        bounds: { left: s1Left, right: s1Right, top: s1Top, bottom: s1Bottom }
      },
      sprite2: {
        id: sprite2.id,
        name: sprite2.name || 'Unknown',
        pos: sprite2.position,
        bounds: { left: s2Left, right: s2Right, top: s2Top, bottom: s2Bottom }
      },
      distance,
      isColliding
    });
  }

  return isColliding;
}

// Calculate bounce direction after collision
export function calculateBounceDirection(sprite1, sprite2) {
  const dx = sprite2.position.x - sprite1.position.x;
  const dy = sprite2.position.y - sprite1.position.y;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
  // Calculate new direction based on collision angle
  const newDirection = normalizeAngle(angle + 180);
  
  // Debug bounce calculation
  console.log('Bounce Calculation:', {
    sprite1: {
      id: sprite1.id,
      oldDirection: sprite1.direction,
      pos: sprite1.position
    },
    sprite2: {
      id: sprite2.id,
      direction: sprite2.direction,
      pos: sprite2.position
    },
    collisionAngle: angle,
    newDirection
  });

  return newDirection;
}

// Normalize angle to 0-360 range
export function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

// Store of last collision times for each sprite
const lastCollisionTimes = new Map();

// Check if sprite is in cooldown
export function isInCooldown(sprite, currentTime) {
  const lastCollision = lastCollisionTimes.get(sprite.id);
  const inCooldown = lastCollision && 
    (currentTime - lastCollision) < COLLISION_CONSTANTS.COOLDOWN_DURATION;

  // Debug cooldown check
  if (lastCollision) {
    console.log('Cooldown Check:', {
      spriteId: sprite.id,
      lastCollision,
      currentTime,
      timeSinceCollision: currentTime - lastCollision,
      inCooldown
    });
  }

  return inCooldown;
}

// Set cooldown for a sprite
export function setCooldown(spriteId) {
  const time = Date.now();
  lastCollisionTimes.set(spriteId, time);
  console.log('Setting Cooldown:', { spriteId, time });
}

// Visual feedback styles for collision
export const COLLISION_STYLES = {
  normal: '',
  colliding: 'ring-8 ring-red-500 ring-opacity-90 scale-125 transition-all duration-300',
  cooldown: 'ring-4 ring-yellow-500 ring-opacity-75 transition-all duration-200'
};

// Add shake animation (to be included in global CSS or Tailwind config)
// You may need to add this to your CSS if not using Tailwind JIT mode:
// .shake {
//   animation: shake 0.3s;
// }
// @keyframes shake {
//   0% { transform: translate(-50%, -50%) rotate(0deg); }
//   25% { transform: translate(-48%, -52%) rotate(-2deg); }
//   50% { transform: translate(-52%, -48%) rotate(2deg); }
//   75% { transform: translate(-48%, -52%) rotate(-2deg); }
//   100% { transform: translate(-50%, -50%) rotate(0deg); }
// } 
// Import sprite images
import CatSprite from '@assets/images/CatSprite.png';
import JerrySprite from '@assets/images/JerrySprite.png';
import BallSprite from '@assets/images/BallSprite.png';
import MickeySprite from '@assets/images/MickeySprite.png';

// Sprite image URLs
export const SPRITE_IMAGES = {
  CAT: {
    name: 'Cat',
    url: CatSprite,
  },
  JERRY: {
    name: 'Jerry',
    url: JerrySprite,
  },
  BALL: {
    name: 'Ball',
    url: BallSprite,
  },
  MICKEY: {
    name: 'Mickey',
    url: MickeySprite,
  }
};

// Helper function to get sprite image by name
export function getSpriteImageByName(name) {
  const normalizedName = name.toLowerCase().trim();
  const entry = Object.values(SPRITE_IMAGES).find(
    sprite => sprite.name.toLowerCase() === normalizedName
  );
  return entry?.url || SPRITE_IMAGES.CAT.url; // Default to cat if no match found
}

// Helper function to get sprite name suggestions
export function getSpriteSuggestions(partialName) {
  const normalizedPartial = partialName.toLowerCase().trim();
  return Object.values(SPRITE_IMAGES)
    .filter(sprite => sprite.name.toLowerCase().includes(normalizedPartial))
    .map(sprite => sprite.name);
}

// Get all available sprite images
export function getAllSpriteImages() {
  return Object.values(SPRITE_IMAGES);
} 
import React, { createContext, useContext, useReducer } from 'react';
import { SPRITE_IMAGES } from './SpriteImages';

const SpriteContext = createContext();

// Helper function to get sprite name based on image
function getSpriteNameFromImage(image) {
  // Find matching sprite from SPRITE_IMAGES
  const spriteEntry = Object.values(SPRITE_IMAGES).find(sprite => sprite.url === image);
  if (spriteEntry) {
    return spriteEntry.name;
  }
  return 'Custom Sprite';
}

// Helper function to get unique sprite name
function getUniqueName(sprites, baseName) {
  if (!sprites.some(s => s.name === baseName)) {
    return baseName;
  }
  let counter = 2;
  let newName;
  do {
    newName = `${baseName} ${counter}`;
    counter++;
  } while (sprites.some(s => s.name === newName));
  return newName;
}

const initialState = {
  sprites: [
    {
      id: 'sprite-1',
      name: 'Cat',
      blocks: [],
      position: { x: 0, y: 0 },
      lastPosition: { x: 0, y: 0 },
      initialPosition: { x: 0, y: 0 },
      motionStep: 0,
      direction: 90,
      image: SPRITE_IMAGES.CAT.url,
      isDragging: false,
      isVisible: true,
      speech: null,
      isColliding: false,
      lastCollisionTime: null,
      collisionDirection: null,
    }
  ],
  activeSprite: 'sprite-1',
  showImagePicker: false,
  pendingSpriteId: null,
};

function spriteReducer(state, action) {
  const result = (function() {
    switch (action.type) {
      case 'ADD_SPRITE': {
        const spriteName = getSpriteNameFromImage(action.image);
        const uniqueName = getUniqueName(state.sprites, spriteName);
        const newSprite = {
          id: `sprite-${state.sprites.length + 1}`,
          name: uniqueName,
          blocks: [],
          position: { x: 0, y: 0 },
          lastPosition: { x: 0, y: 0 },
          initialPosition: { x: 0, y: 0 },
          motionStep: 0,
          direction: 90,
          image: action.image || SPRITE_IMAGES.CAT.url,
          isDragging: false,
          isVisible: true,
          speech: null,
          isColliding: false,
          lastCollisionTime: null,
          collisionDirection: null,
        };
        return {
          ...state,
          sprites: [...state.sprites, newSprite],
          activeSprite: newSprite.id,
        };
      }
      
      case 'SET_ACTIVE_SPRITE':
        return {
          ...state,
          activeSprite: action.spriteId,
        };

      case 'UPDATE_SPRITE_BLOCKS':
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? { ...sprite, blocks: action.blocks }
              : sprite
          ),
        };

      case 'UPDATE_SPRITE_POSITION': {
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? {
                  ...sprite,
                  lastPosition: { ...sprite.position },
                  position: action.position || sprite.position,
                  direction: action.direction !== undefined ? action.direction : sprite.direction,
                  motionStep: action.motionStep !== undefined ? action.motionStep : sprite.motionStep,
                }
              : sprite
          ),
        };
      }

      case 'UPDATE_SPRITE_MOTION': {
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? {
                  ...sprite,
                  motionStep: action.motionStep,
                }
              : sprite
          ),
        };
      }

      case 'START_SPRITE_DRAG':
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? { ...sprite, isDragging: true }
              : sprite
          ),
        };

      case 'END_SPRITE_DRAG':
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? { ...sprite, isDragging: false }
              : sprite
          ),
        };

      case 'UPDATE_SPRITE_IMAGE': {
        const spriteName = getSpriteNameFromImage(action.image);
        const uniqueName = getUniqueName(state.sprites, spriteName);
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? { ...sprite, image: action.image, name: uniqueName }
              : sprite
          ),
        };
      }

      case 'UPDATE_SPRITE_NAME': {
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? { ...sprite, name: action.name }
              : sprite
          ),
        };
      }

      case 'SHOW_IMAGE_PICKER':
        return {
          ...state,
          showImagePicker: true,
          pendingSpriteId: action.spriteId,
        };

      case 'HIDE_IMAGE_PICKER':
        return {
          ...state,
          showImagePicker: false,
          pendingSpriteId: null,
        };

      case 'GET_SPRITE_PROP': {
        const sprite = state.sprites.find(s => s.id === action.spriteId);
        if (sprite && action.callback) {
          if (action.prop === 'fullState') {
            // Return complete sprite state
            action.callback({
              blocks: sprite.blocks,
              position: sprite.position,
              direction: sprite.direction,
              isVisible: sprite.isVisible,
              speech: sprite.speech
            });
          } else {
            let value = sprite[action.prop];
            if (action.prop === 'otherSprites') {
              value = state.sprites.filter(s => s.id !== action.spriteId);
            }
            action.callback(value);
          }
        }
        return state;
      }

      case 'SET_SPRITE_VISIBILITY':
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? { ...sprite, isVisible: action.isVisible }
              : sprite
          ),
        };

      case 'UPDATE_SPRITE_SPEECH':
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? { ...sprite, speech: action.speech }
              : sprite
          ),
        };

      case 'UPDATE_SPRITE_VALUE':
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? { ...sprite, value: action.value }
              : sprite
          ),
        };

      case 'SWAP_SPRITE_STATES':
        return {
          ...state,
          sprites: state.sprites.map(sprite => {
            if (sprite.id === action.sprite1Id) {
              return {
                ...sprite,
                blocks: action.sprite1State.blocks,
                direction: action.sprite1State.direction,
                position: action.sprite1State.position
              };
            }
            if (sprite.id === action.sprite2Id) {
              return {
                ...sprite,
                blocks: action.sprite2State.blocks,
                direction: action.sprite2State.direction,
                position: action.sprite2State.position
              };
            }
            return sprite;
          })
        };

      case 'DELETE_BLOCK':
        return {
          ...state,
          sprites: state.sprites.map(sprite => 
            sprite.id === state.activeSprite
              ? {
                  ...sprite,
                  blocks: removeBlockFromList(sprite.blocks, action.blockId)
                }
              : sprite
          )
        };

      case 'DELETE_SPRITE': {
        // Don't allow deleting the last sprite
        if (state.sprites.length <= 1) {
          return state;
        }

        const newSprites = state.sprites.filter(sprite => sprite.id !== action.spriteId);
        const newActiveSprite = action.spriteId === state.activeSprite 
          ? newSprites[0].id 
          : state.activeSprite;

        return {
          ...state,
          sprites: newSprites,
          activeSprite: newActiveSprite
        };
      }

      case 'SET_SPRITE_COLLISION_STATE': {
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? {
                  ...sprite,
                  isColliding: action.isColliding,
                  lastCollisionTime: action.isColliding ? Date.now() : sprite.lastCollisionTime,
                  collisionDirection: action.collisionDirection || sprite.collisionDirection,
                }
              : sprite
          ),
        };
      }

      case 'RESET_COLLISION_STATE': {
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? {
                  ...sprite,
                  isColliding: false,
                  collisionDirection: null,
                }
              : sprite
          ),
        };
      }

      case 'RESET_TO_LAST_POSITION': {
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? {
                  ...sprite,
                  position: { ...sprite.lastPosition },
                }
              : sprite
          ),
        };
      }

      case 'STORE_INITIAL_POSITION': {
        return {
          ...state,
          sprites: state.sprites.map(sprite =>
            sprite.id === action.spriteId
              ? {
                  ...sprite,
                  initialPosition: { ...action.position },
                }
              : sprite
          ),
        };
      }

      default:
        return state;
    }
  })();
  console.log('Sprite state updated:', result);
  return result;
}

// Helper function to remove a block and its children from the block list
function removeBlockFromList(blocks, blockId) {
  return blocks.filter(block => {
    if (block.id === blockId) {
      return false;
    }
    if (block.children) {
      block.children = removeBlockFromList(block.children, blockId);
    }
    return true;
  });
}

export function SpriteProvider({ children }) {
  const [state, dispatch] = useReducer(spriteReducer, initialState);

  return (
    <SpriteContext.Provider value={{ state, dispatch }}>
      {children}
    </SpriteContext.Provider>
  );
}

export function useSprites() {
  const context = useContext(SpriteContext);
  if (!context) {
    throw new Error('useSprites must be used within a SpriteProvider');
  }
  return context;
} 
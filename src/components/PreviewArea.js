import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDrag } from './DragContext';
import { useExecution } from './ExecutionContext';
import { useSprites } from './SpriteContext';
import SpriteImagePicker from './SpriteImagePicker';
import { BUTTON_STYLES } from './BlockTypes';
import { 
  checkAABBCollision, 
  calculateBounceDirection, 
  isInCooldown,
  COLLISION_CONSTANTS,
  COLLISION_STYLES 
} from './utils/collisionUtils';

// Create collision sound
const createCollisionSound = () => {
  let audioContext = null;
  
  return () => {
    try {
      // Initialize AudioContext on first use (needs user interaction)
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Audio error:', error);
    }
  };
};

export default function PreviewArea() {
  const { state: dragState } = useDrag();
  const { state: execState, executeBlocks, executeAllSprites, stopAllExecutions } = useExecution();
  const { state: spriteState, dispatch: spriteDispatch } = useSprites();
  const { sprites, activeSprite, showImagePicker, pendingSpriteId } = spriteState;
  const previewAreaRef = useRef(null);
  const animationFrameRef = useRef(null);
  const playCollisionSoundRef = useRef(null);

  // Initialize collision sound
  const playCollisionSound = useRef(createCollisionSound()).current;

  // State for tracking sprite motion
  const [movingSprites, setMovingSprites] = useState(new Map());

  // State for tracking drag offsets
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle sprite movement frame-by-frame
  const updateSpritePositions = useCallback(() => {
    const updatedSprites = new Map(movingSprites);
    let hasMovingSprites = false;

    updatedSprites.forEach((motion, spriteId) => {
      const sprite = sprites.find(s => s.id === spriteId);
      if (!sprite || Math.abs(motion.remainingSteps) <= 0) {
        updatedSprites.delete(spriteId);
        return;
      }

      // Calculate next position
      const radians = ((sprite.direction - 90) * Math.PI) / 180;
      const stepSize = motion.remainingSteps > 0 ? 1 : -1;
      const stepX = Math.cos(radians) * stepSize;
      const stepY = Math.sin(radians) * stepSize;

      const newX = sprite.position.x + stepX;
      const newY = sprite.position.y + stepY;

      // Check for collisions with other sprites
      let hasCollision = false;
      let collisionDirection = null;

      sprites.forEach(otherSprite => {
        if (otherSprite.id !== spriteId && otherSprite.isVisible) {
          const willCollide = checkAABBCollision(
            { ...sprite, position: { x: newX, y: newY } },
            otherSprite
          );

          if (willCollide && !isInCooldown(sprite, Date.now())) {
            hasCollision = true;
            collisionDirection = calculateBounceDirection(sprite, otherSprite);

            // Play collision sound
            playCollisionSound();

            // Set collision state for both sprites
            spriteDispatch({
              type: 'SET_SPRITE_COLLISION_STATE',
              spriteId: sprite.id,
              isColliding: true,
              collisionDirection
            });
            console.log('Dispatched SET_SPRITE_COLLISION_STATE', sprite.id, true, collisionDirection);

            spriteDispatch({
              type: 'SET_SPRITE_COLLISION_STATE',
              spriteId: otherSprite.id,
              isColliding: true,
              collisionDirection: calculateBounceDirection(otherSprite, sprite)
            });
            console.log('Dispatched SET_SPRITE_COLLISION_STATE', otherSprite.id, true, calculateBounceDirection(otherSprite, sprite));

            // Schedule collision state reset
            setTimeout(() => {
              spriteDispatch({
                type: 'RESET_COLLISION_STATE',
                spriteId: sprite.id
              });
              spriteDispatch({
                type: 'RESET_COLLISION_STATE',
                spriteId: otherSprite.id
              });
            }, COLLISION_CONSTANTS.PAUSE_DURATION);
          }
        }
      });

      if (hasCollision) {
        // Reverse direction and update position
        spriteDispatch({
          type: 'UPDATE_SPRITE_POSITION',
          spriteId,
          position: sprite.lastPosition,
          direction: collisionDirection
        });
        // Only log position updates occasionally to reduce spam
        if (Math.random() < 0.05) { // Log ~5% of updates
          console.log('Dispatched UPDATE_SPRITE_POSITION', spriteId, sprite.lastPosition, collisionDirection);
        }

        // Pause movement
        setTimeout(() => {
          // After pause, set new motion with proper direction
          const newMotion = {
            ...motion,
            remainingSteps: Math.abs(motion.remainingSteps) * 0.7, // Reduce energy after collision
            direction: collisionDirection
          };
          
          console.log('Resuming after collision with new direction:', collisionDirection);
          
          // Apply the new motion
          updatedSprites.set(spriteId, newMotion);
          
          // Also update the sprite's direction visually
          spriteDispatch({
            type: 'UPDATE_SPRITE_POSITION',
            spriteId,
            direction: collisionDirection
          });
        }, COLLISION_CONSTANTS.PAUSE_DURATION);
      } else {
        // Update sprite position and motion state
        spriteDispatch({
          type: 'UPDATE_SPRITE_POSITION',
          spriteId,
          position: { x: newX, y: newY },
          motionStep: motion.remainingSteps
        });
        // Only log position updates occasionally to reduce spam
        if (Math.random() < 0.05) { // Log ~5% of updates
          console.log('Dispatched UPDATE_SPRITE_POSITION', spriteId, { x: newX, y: newY }, motion.remainingSteps);
        }

        // Update remaining steps
        updatedSprites.set(spriteId, {
          ...motion,
          remainingSteps: motion.remainingSteps - stepSize
        });
      }

      hasMovingSprites = true;
    });

    setMovingSprites(updatedSprites);

    // Continue animation if sprites are still moving
    if (hasMovingSprites) {
      // Only log occasionally to reduce spam
      if (Math.random() < 0.1) { // Log ~10% of animation frames
        console.log('updateSpritePositions called', Array.from(movingSprites.keys()));
      }
      animationFrameRef.current = requestAnimationFrame(updateSpritePositions);
    }
  }, [sprites, movingSprites, spriteDispatch]);

  // Start sprite movement with independent motion tracking
  const startSpriteMotion = useCallback((spriteId, steps) => {
    setMovingSprites(prev => {
      const newMap = new Map(prev);
      newMap.set(spriteId, { 
        remainingSteps: steps,
        startTime: performance.now()
      });
      return newMap;
    });

    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateSpritePositions);
    }
  }, [updateSpritePositions]);

  // Handle mouse down for sprite dragging
  const handleMouseDown = useCallback((e, spriteId) => {
    e.preventDefault();
    e.stopPropagation();

    // Set active sprite
    spriteDispatch({ type: 'SET_ACTIVE_SPRITE', spriteId });
    
    // Start sprite drag
    spriteDispatch({ type: 'START_SPRITE_DRAG', spriteId });

    // Calculate initial drag offset
    const sprite = sprites.find(s => s.id === spriteId);
    if (sprite) {
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      setDragOffset({ x: offsetX, y: offsetY });

      // Add mouse move and up handlers
      const handleMouseMove = (e) => {
        const previewArea = previewAreaRef.current;
        if (!previewArea) return;

        const bounds = previewArea.getBoundingClientRect();
        const x = ((e.clientX - bounds.left - offsetX) / bounds.width * 100) - 50;
        const y = ((e.clientY - bounds.top - offsetY) / bounds.height * 100) - 50;

        spriteDispatch({
          type: 'UPDATE_SPRITE_POSITION',
          spriteId,
          position: { x, y }
        });
      };

      const handleMouseUp = () => {
        spriteDispatch({ type: 'END_SPRITE_DRAG', spriteId });
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [sprites, spriteDispatch]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle sprite execution with proper sequencing
  const handlePlaySprite = useCallback(async (spriteId) => {
    const sprite = sprites.find(s => s.id === spriteId);
    if (sprite && !execState.executingSprites.has(spriteId)) {
      try {
        // Reset sprite motion state before execution
        setMovingSprites(prev => {
          const newMap = new Map(prev);
          newMap.delete(spriteId);
          return newMap;
        });

        await executeBlocks(sprite.blocks, spriteDispatch, spriteId);
      } catch (error) {
        console.error(`Error executing sprite ${spriteId}:`, error);
      }
    }
  }, [sprites, execState.executingSprites, executeBlocks, spriteDispatch]);

  // Handle execution for all sprites with proper initialization
  const handlePlayAll = useCallback(async () => {
    if (execState.executingSprites.size === 0) {
      try {
        // Clear all existing motion states
        setMovingSprites(new Map());

        // Store initial positions for all sprites
        sprites.forEach(sprite => {
          spriteDispatch({
            type: 'STORE_INITIAL_POSITION',
            spriteId: sprite.id,
            position: sprite.position
          });
        });

        await executeAllSprites(sprites, spriteDispatch);
      } catch (error) {
        console.error('Error executing all sprites:', error);
      }
    }
  }, [sprites, execState.executingSprites, executeAllSprites, spriteDispatch]);

  // Handle stopping all sprites
  const handleStopAll = useCallback(() => {
    stopAllExecutions(sprites, spriteDispatch);
  }, [sprites, stopAllExecutions, spriteDispatch]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-700">Preview</h2>
          <button
            onClick={() => spriteDispatch({ type: 'SHOW_IMAGE_PICKER' })}
            className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.sm} ${BUTTON_STYLES.secondary}`}
            title="Add New Sprite"
          >
            ➕ New Sprite
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Play button */}
          <button
            onClick={handlePlayAll}
            disabled={execState.executingSprites.size > 0}
            className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.icon} ${
              execState.executingSprites.size > 0
                ? BUTTON_STYLES.disabled
                : BUTTON_STYLES.success
            }`}
            title="Start all sprites"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M8 5.14v14.72L19 12.5 8 5.14z"/>
            </svg>
          </button>

          {/* Stop button */}
          <button
            onClick={handleStopAll}
            disabled={execState.executingSprites.size === 0}
            className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.icon} ${
              execState.executingSprites.size === 0
                ? BUTTON_STYLES.disabled
                : BUTTON_STYLES.danger
            }`}
            title="Stop all sprites"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div ref={previewAreaRef} className="flex-1 relative bg-gray-50">
        {/* Render all sprites */}
        {sprites.map(sprite => {
          // Only log occasionally to reduce spam
          if (Math.random() < 0.02) { // Log ~2% of renders
            console.log('Rendering sprite', sprite.id, sprite.position, sprite.direction, sprite.isColliding);
          }
          return (
            sprite.isVisible && (
              <div
                key={sprite.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-move shake-container
                  ${sprite.id === activeSprite ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                  ${sprite.isDragging ? 'z-10' : 'z-0'}
                  ${execState.executingSprites.has(sprite.id) ? 'ring-2 ring-green-500 ring-opacity-50' : ''}
                  ${sprite.isColliding ? COLLISION_STYLES.colliding + ' shake' : ''}
                  ${isInCooldown(sprite, Date.now()) ? COLLISION_STYLES.cooldown : COLLISION_STYLES.normal}
                `}
                style={{
                  left: `${50 + sprite.position.x}%`,
                  top: `${50 + sprite.position.y}%`,
                  transform: `translate(-50%, -50%) rotate(${sprite.direction - 90}deg)` + (sprite.isColliding ? ' scale(1.15)' : ''),
                  transition: sprite.isDragging ? 'none' : 'transform 0.2s ease-out, left 0.2s ease-out, top 0.2s ease-out',
                  willChange: 'transform, left, top',
                }}
                onClick={() => spriteDispatch({ type: 'SET_ACTIVE_SPRITE', spriteId: sprite.id })}
                onMouseDown={(e) => handleMouseDown(e, sprite.id)}
              >
                {/* Debug overlay for collision */}
                {sprite.isColliding && (
                  <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-2 py-1 rounded shadow-lg text-xs z-50 animate-pulse">
                    COLLISION!
                  </div>
                )}
                {/* Speech bubble */}
                {sprite.speech && (
                  <div 
                    className={`absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-md
                      ${sprite.speech.type === 'think' ? 'rounded-full' : 'speech-bubble'}
                    `}
                    style={{ transform: 'translate(-50%, -100%) rotate(' + (90 - sprite.direction) + 'deg)' }}
                  >
                    <p className="text-sm whitespace-nowrap">
                      {sprite.speech.type === 'think' ? '💭 ' : ''}
                      {sprite.speech.message}
                    </p>
                  </div>
                )}
                <img
                  src={sprite.image}
                  alt={sprite.name}
                  className="w-16 h-16 object-contain select-none"
                  draggable={false}
                  style={{ imageRendering: 'pixelated' }}
                />
                {/* Sprite name */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-md text-xs shadow-sm">
                  <span>{sprite.name}</span>
                </div>
              </div>
            )
          );
        })}
      </div>

      {/* Image picker modal */}
      {showImagePicker && (
        <SpriteImagePicker
          onSelect={(imageUrl, spriteName) => {
            if (pendingSpriteId) {
              spriteDispatch({
                type: 'UPDATE_SPRITE_IMAGE',
                spriteId: pendingSpriteId,
                image: imageUrl,
              });
              if (spriteName) {
                spriteDispatch({
                  type: 'UPDATE_SPRITE_NAME',
                  spriteId: pendingSpriteId,
                  name: spriteName,
                });
              }
            } else {
              spriteDispatch({
                type: 'ADD_SPRITE',
                image: imageUrl,
              });
            }
            spriteDispatch({ type: 'HIDE_IMAGE_PICKER' });
          }}
          onClose={() => spriteDispatch({ type: 'HIDE_IMAGE_PICKER' })}
        />
      )}
    </div>
  );
}
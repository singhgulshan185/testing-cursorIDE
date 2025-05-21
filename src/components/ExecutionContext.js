import React, { createContext, useContext, useReducer, useEffect } from 'react';

const ExecutionContext = createContext();

const initialState = {
  isPlaying: false,
  executingSprites: new Set(),
  animationSpeed: 500, // Base animation duration in ms
  debug: false, // Debug mode for input validation logging
  selectedBlock: null, // Track selected block for deletion
  shouldStop: false, // Flag to stop all executions
  activeAnimations: new Set(), // Track active animation frames
};

// Animation timing constants
const ANIMATION_SPEEDS = {
  BASE_SPEED: 400,
  MAX_SPEED: 1500,
  TURN: 300,    // Reduced for snappier rotation
  LOOKS: 2000,
  REPEAT_DELAY: 300,
  PIXELS_PER_STEP: 1,
};

// Enhanced easing functions for smoother animations
const easing = {
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutCirc: t => Math.sqrt(1 - Math.pow(t - 1, 2)), // Added for smoother rotation
  linear: t => t
};

// Helper function to normalize angles
const normalizeAngle = (angle) => {
  angle = angle % 360;
  return angle < 0 ? angle + 360 : angle;
};

// Helper function to find shortest rotation path
const getShortestRotation = (start, end) => {
  const normalizedStart = normalizeAngle(start);
  const normalizedEnd = normalizeAngle(end);
  
  let diff = normalizedEnd - normalizedStart;
  
  // Adjust for shortest path
  if (Math.abs(diff) > 180) {
    diff = diff > 0 ? diff - 360 : diff + 360;
  }
  
  return {
    start: normalizedStart,
    end: normalizedStart + diff
  };
};

function executionReducer(state, action) {
  switch (action.type) {
    case 'START_EXECUTION':
      return {
        ...state,
        isPlaying: true,
        shouldStop: false,
        executingSprites: new Set([...state.executingSprites, action.spriteId]),
      };
    case 'END_EXECUTION':
      const newExecutingSprites = new Set(state.executingSprites);
      newExecutingSprites.delete(action.spriteId);
      return {
        ...state,
        isPlaying: newExecutingSprites.size > 0,
        executingSprites: newExecutingSprites,
      };
    case 'STOP_ALL_EXECUTION':
      // Cancel all active animations
      state.activeAnimations.forEach(frameId => cancelAnimationFrame(frameId));
      return {
        ...state,
        isPlaying: false,
        shouldStop: true,
        executingSprites: new Set(),
        activeAnimations: new Set(),
      };
    case 'SET_ANIMATION_SPEED':
      return {
        ...state,
        animationSpeed: action.speed,
      };
    case 'TOGGLE_DEBUG':
      return {
        ...state,
        debug: !state.debug,
      };
    case 'SET_SELECTED_BLOCK':
      return {
        ...state,
        selectedBlock: action.blockId
      };
    default:
      return state;
  }
}

export function ExecutionProvider({ children }) {
  const [state, dispatch] = useReducer(executionReducer, initialState);

  // Initialize key and mouse tracking
  useEffect(() => {
    // Initialize global state objects
    window.pressedKeys = {};
    window.isMouseDown = false;

    // Key event handlers
    const handleKeyDown = (e) => {
      window.pressedKeys[e.key] = true;
    };

    const handleKeyUp = (e) => {
      delete window.pressedKeys[e.key];
    };

    // Mouse event handlers
    const handleMouseDown = () => {
      window.isMouseDown = true;
    };

    const handleMouseUp = () => {
      window.isMouseDown = false;
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // Clear state
      window.pressedKeys = {};
      window.isMouseDown = false;
    };
  }, []);

  // Improved animation function with easing
  const animate = (startValue, endValue, duration, onProgress, easingFunction = easing.easeOutQuad) => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let lastFrameTime = startTime;
      
      const updateAnimation = (currentTime) => {
        const deltaTime = currentTime - lastFrameTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply easing function for smoother motion
        const easedProgress = easingFunction(progress);
        onProgress(easedProgress, deltaTime);
        
        if (progress < 1) {
          lastFrameTime = currentTime;
          const frameId = requestAnimationFrame(updateAnimation);
          state.activeAnimations.add(frameId);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(updateAnimation);
    });
  };

  // Calculate animation duration based on distance
  const calculateMoveDuration = (distance) => {
    // Convert distance to pixels (assuming 1 step = 2 pixels)
    const pixelDistance = Math.abs(distance * ANIMATION_SPEEDS.PIXELS_PER_STEP);
    
    // Use linear scaling with a minimum duration
    return Math.max(
      ANIMATION_SPEEDS.BASE_SPEED,
      Math.min(
        ANIMATION_SPEEDS.MAX_SPEED,
        ANIMATION_SPEEDS.BASE_SPEED + (pixelDistance * 2)
      )
    );
  };

  // Add condition evaluation functions
  const evaluateCondition = async (conditionType, params, spriteDispatch, spriteId) => {
    switch (conditionType) {
      case 'equals': {
        const spriteValue = await getSpriteProp(spriteDispatch, spriteId, 'value');
        return spriteValue === Number(params[2]);
      }
      
      case 'greaterThan': {
        const spriteValue = await getSpriteProp(spriteDispatch, spriteId, 'value');
        return spriteValue > Number(params[2]);
      }
      
      case 'lessThan': {
        const spriteValue = await getSpriteProp(spriteDispatch, spriteId, 'value');
        return spriteValue < Number(params[2]);
      }
      
      case 'keyPressed':
        return window.pressedKeys?.[params[1]] || false;
      
      case 'mouseDown':
        return window.isMouseDown || false;
      
      case 'touchingEdge': {
        const pos = await getSpriteProp(spriteDispatch, spriteId, 'position');
        const size = await getSpriteProp(spriteDispatch, spriteId, 'size');
        return pos.x <= -240 || pos.x >= 240 || pos.y <= -180 || pos.y >= 180;
      }
      
      case 'touchingSprite': {
        const pos = await getSpriteProp(spriteDispatch, spriteId, 'position');
        const size = await getSpriteProp(spriteDispatch, spriteId, 'size');
        const otherSprites = await getSpriteProp(spriteDispatch, spriteId, 'otherSprites');
        
        return otherSprites.some(other => {
          const dx = other.position.x - pos.x;
          const dy = other.position.y - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < (size + other.size) / 2;
        });
      }
      
      default:
        console.warn(`Unknown condition type: ${conditionType}`);
        return false;
    }
  };

  // Helper to get sprite properties
  const getSpriteProp = (spriteDispatch, spriteId, prop) => {
    return new Promise(resolve => {
      spriteDispatch({
        type: 'GET_SPRITE_PROP',
        spriteId,
        prop,
        callback: resolve,
      });
    });
  };

  // Execute a single block with frame-by-frame movement
  const executeBlock = async (block, spriteDispatch, spriteId) => {
    if (!block) return;

    try {
      switch (block.type) {
        case 'move': {
          const steps = Number(block.params[0]);
          if (isNaN(steps)) {
            console.warn(`Invalid move steps value: ${block.params[0]}`);
            return;
          }

          // Get current sprite state
          const currentPos = await getSpriteProp(spriteDispatch, spriteId, 'position');
          const currentDirection = await getSpriteProp(spriteDispatch, spriteId, 'direction');
          
          // Convert direction to radians
          const radians = ((currentDirection - 90) * Math.PI) / 180;
          
          // Calculate movement vector
          const stepSize = steps > 0 ? 1 : -1;
          const stepX = Math.cos(radians) * stepSize * 0.5; // Reduced step size for smoother motion
          const stepY = Math.sin(radians) * stepSize * 0.5;
          
          // Total distance to move
          let remainingSteps = steps * 2; // Adjusted for smaller step size
          
          return new Promise((resolve) => {
            let frameId;
            const startTime = performance.now();

            const animate = () => {
              if (Math.abs(remainingSteps) <= 0) {
                cancelAnimationFrame(frameId);
                resolve();
                return;
              }

              // Calculate new position
              const newX = currentPos.x + stepX;
              const newY = currentPos.y + stepY;

              // Update position
              spriteDispatch({
                type: 'UPDATE_SPRITE_POSITION',
                spriteId,
                position: { x: newX, y: newY }
              });

              remainingSteps -= stepSize * 2;
              currentPos.x = newX;
              currentPos.y = newY;

              frameId = requestAnimationFrame(animate);
              state.activeAnimations.add(frameId);
            };

            frameId = requestAnimationFrame(animate);
            state.activeAnimations.add(frameId);
          });
        }

        case 'turnRight': {
          const degrees = Number(block.params[0]);
          if (isNaN(degrees)) {
            console.warn(`Invalid turn degrees value: ${block.params[0]}`);
            return;
          }

          const currentDirection = await getSpriteProp(spriteDispatch, spriteId, 'direction');
          const rotation = getShortestRotation(currentDirection, currentDirection + degrees);
          
          // Ensure clean animation state
          return new Promise((resolve) => {
            let frameId;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / ANIMATION_SPEEDS.TURN, 1);
              const easedProgress = easing.easeOutCirc(progress);
              
              const currentAngle = rotation.start + (rotation.end - rotation.start) * easedProgress;
              spriteDispatch({
                type: 'UPDATE_SPRITE_POSITION',
                spriteId,
                direction: normalizeAngle(currentAngle),
              });

              if (progress < 1) {
                frameId = requestAnimationFrame(animate);
              } else {
                // Ensure final angle is exact
                spriteDispatch({
                  type: 'UPDATE_SPRITE_POSITION',
                  spriteId,
                  direction: normalizeAngle(rotation.end),
                });
                resolve();
              }
            };
            
            frameId = requestAnimationFrame(animate);
            
            // Store animation frame ID for cleanup
            state.activeAnimations.add(frameId);
          });
        }

        case 'turnLeft': {
          const degrees = Number(block.params[0]);
          if (isNaN(degrees)) {
            console.warn(`Invalid turn degrees value: ${block.params[0]}`);
            return;
          }

          const currentDirection = await getSpriteProp(spriteDispatch, spriteId, 'direction');
          const rotation = getShortestRotation(currentDirection, currentDirection - degrees);
          
          // Ensure clean animation state
          return new Promise((resolve) => {
            let frameId;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / ANIMATION_SPEEDS.TURN, 1);
              const easedProgress = easing.easeOutCirc(progress);
              
              const currentAngle = rotation.start + (rotation.end - rotation.start) * easedProgress;
              spriteDispatch({
                type: 'UPDATE_SPRITE_POSITION',
                spriteId,
                direction: normalizeAngle(currentAngle),
              });

              if (progress < 1) {
                frameId = requestAnimationFrame(animate);
              } else {
                // Ensure final angle is exact
                spriteDispatch({
                  type: 'UPDATE_SPRITE_POSITION',
                  spriteId,
                  direction: normalizeAngle(rotation.end),
                });
                resolve();
              }
            };
            
            frameId = requestAnimationFrame(animate);
            
            // Store animation frame ID for cleanup
            state.activeAnimations.add(frameId);
          });
        }

        case 'say': {
          const message = String(block.params[0] || '').trim();
          const duration = block.params[1] ? Number(block.params[1]) * 1000 : ANIMATION_SPEEDS.LOOKS;
          
          if (!message) {
            console.warn('Empty say message, skipping block');
            return;
          }

          spriteDispatch({
            type: 'UPDATE_SPRITE_SPEECH',
            spriteId,
            speech: { type: 'say', message }
          });

          await new Promise(resolve => setTimeout(resolve, duration));
          
          spriteDispatch({
            type: 'UPDATE_SPRITE_SPEECH',
            spriteId,
            speech: null
          });
          break;
        }

        case 'think': {
          const message = String(block.params[0] || '').trim();
          const duration = block.params[1] ? Number(block.params[1]) * 1000 : ANIMATION_SPEEDS.LOOKS;
          
          if (!message) {
            console.warn('Empty think message, skipping block');
            return;
          }

          spriteDispatch({
            type: 'UPDATE_SPRITE_SPEECH',
            spriteId,
            speech: { type: 'think', message }
          });

          await new Promise(resolve => setTimeout(resolve, duration));
          
          spriteDispatch({
            type: 'UPDATE_SPRITE_SPEECH',
            spriteId,
            speech: null
          });
          break;
        }

        case 'goToXY': {
          const targetX = Number(block.params[0]);
          const targetY = Number(block.params[1]);
          if (isNaN(targetX) || isNaN(targetY)) {
            console.warn(`Invalid coordinates: x=${block.params[0]}, y=${block.params[1]}`);
            return;
          }

          const currentPos = await getSpriteProp(spriteDispatch, spriteId, 'position');
          const distance = Math.sqrt(
            Math.pow(targetX - currentPos.x, 2) + 
            Math.pow(targetY - currentPos.y, 2)
          );
          const duration = calculateMoveDuration(distance);

          return new Promise((resolve) => {
            let frameId;
            const startTime = performance.now();

            const animate = (currentTime) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const easedProgress = easing.easeInOutCubic(progress);

              const newX = currentPos.x + (targetX - currentPos.x) * easedProgress;
              const newY = currentPos.y + (targetY - currentPos.y) * easedProgress;

              spriteDispatch({
                type: 'UPDATE_SPRITE_POSITION',
                spriteId,
                position: { x: newX, y: newY },
              });

              if (progress < 1) {
                frameId = requestAnimationFrame(animate);
                state.activeAnimations.add(frameId);
              } else {
                // Ensure final position is exact
                spriteDispatch({
                  type: 'UPDATE_SPRITE_POSITION',
                  spriteId,
                  position: { x: targetX, y: targetY },
                });
                resolve();
              }
            };

            frameId = requestAnimationFrame(animate);
            state.activeAnimations.add(frameId);
          });
        }

        case 'repeat': {
          const times = Number(block.params[0]);
          
          // Strict input validation
          if (isNaN(times) || !Number.isInteger(times) || times < 1) {
            console.warn(`Invalid repeat count: ${block.params[0]}`);
            return;
          }

          // Execute iterations
          for (let i = 0; i < times; i++) {
            if (state.debug) {
              console.log(`Repeat iteration ${i + 1}/${times}`);
            }

            // Execute all child blocks in sequence
            if (block.children && block.children.length > 0) {
              for (const childBlock of block.children) {
                await executeBlock(childBlock, spriteDispatch, spriteId);
                
                // Small delay between blocks within the same iteration
                if (block.children.indexOf(childBlock) < block.children.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 50));
                }
              }
            }

            // Add delay between iterations
            if (i < times - 1) {
              await new Promise(resolve => setTimeout(resolve, ANIMATION_SPEEDS.REPEAT_DELAY));
            }
          }
          break;
        }

        default:
          console.warn(`Unknown block type: ${block.type}`);
          break;
      }
    } catch (error) {
      console.error('Error executing block:', error);
    }
  };

  // Execute blocks for a sprite
  const executeBlocks = async (blocks, spriteDispatch, spriteId) => {
    if (!blocks || !blocks.length) return;

    try {
      dispatch({ type: 'START_EXECUTION', spriteId });

      for (const block of blocks) {
        if (state.shouldStop) break;
        await executeBlock(block, spriteDispatch, spriteId);
      }
    } catch (error) {
      console.error('Error executing blocks:', error);
    } finally {
      dispatch({ type: 'END_EXECUTION', spriteId });
    }
  };

  // Execute all sprites
  const executeAllSprites = async (sprites, spriteDispatch) => {
    if (!sprites || !sprites.length) return;

    try {
      // Reset any existing executions
      dispatch({ type: 'STOP_ALL_EXECUTION' });
      
      // Start new execution
      const executions = sprites.map(sprite => 
        executeBlocks(sprite.blocks, spriteDispatch, sprite.id)
      );

      await Promise.all(executions);
    } catch (error) {
      console.error('Error executing all sprites:', error);
    }
  };

  // Stop all executions
  const stopAllExecutions = (sprites, spriteDispatch) => {
    dispatch({ type: 'STOP_ALL_EXECUTION' });
    
    // Reset all sprite positions and states
    sprites.forEach(sprite => {
      spriteDispatch({
        type: 'UPDATE_SPRITE_POSITION',
        spriteId: sprite.id,
        position: sprite.initialPosition || { x: 0, y: 0 }
      });
      
      spriteDispatch({
        type: 'UPDATE_SPRITE_MOTION',
        spriteId: sprite.id,
        motionStep: 0
      });
    });
  };

  return (
    <ExecutionContext.Provider value={{ 
      state, 
      dispatch, 
      executeBlocks, 
      executeAllSprites,
      stopAllExecutions
    }}>
      {children}
    </ExecutionContext.Provider>
  );
}

export function useExecution() {
  const context = useContext(ExecutionContext);
  if (!context) {
    throw new Error('useExecution must be used within an ExecutionProvider');
  }
  return context;
} 
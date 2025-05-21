import React, { useCallback, useEffect } from 'react';
import { useDrag } from './DragContext';
import { useSprites } from './SpriteContext';
import { useExecution } from './ExecutionContext';
import Block from './BlockComponent';
import { BUTTON_STYLES } from './BlockTypes';

export default function MidArea() {
  const { state: dragState, dispatch: dragDispatch } = useDrag();
  const { state: spriteState, dispatch: spriteDispatch } = useSprites();
  const { state: execState, dispatch: execDispatch } = useExecution();
  const { sprites, activeSprite } = spriteState;

  // Handle keyboard events for block and sprite deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
        
        // If a block is selected, delete the block
        if (execState.selectedBlock) {
          spriteDispatch({
            type: 'DELETE_BLOCK',
            blockId: execState.selectedBlock
          });
          execDispatch({
            type: 'SET_SELECTED_BLOCK',
            blockId: null
          });
        }
        // If no block is selected but we have an active sprite, delete the sprite
        else if (activeSprite && sprites.length > 1) {
          spriteDispatch({
            type: 'DELETE_SPRITE',
            spriteId: activeSprite
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [execState.selectedBlock, activeSprite, sprites.length, spriteDispatch, execDispatch]);

  // Sprite animation block viewer
  const renderSpriteBar = () => {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-100 overflow-x-auto">
        {sprites.map(sprite => (
          <button
            key={sprite.id}
            onClick={() => spriteDispatch({ type: 'SET_ACTIVE_SPRITE', spriteId: sprite.id })}
            className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.sm} ${
              sprite.id === activeSprite 
                ? BUTTON_STYLES.primary
                : BUTTON_STYLES.secondary
            } flex items-center gap-2`}
            title="Click to edit, press Delete to remove"
          >
            <img
              src={sprite.image}
              alt={sprite.name}
              className="w-6 h-6 object-contain"
              draggable={false}
            />
            <span className="text-sm font-medium">{sprite.name}</span>
            <span className="text-xs opacity-75">
              ({sprite.blocks.length} blocks)
            </span>
          </button>
        ))}
      </div>
    );
  };

  const handleBlockClick = (blockId) => {
    execDispatch({
      type: 'SET_SELECTED_BLOCK',
      blockId
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, parentId = null) => {
    e.preventDefault();
    e.stopPropagation();

    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const isTemplate = data.id.startsWith('template-');
    
    if (isTemplate) {
      const newBlock = {
        id: `block-${Date.now()}`,
        type: data.type,
        params: [...data.params],
        children: [],
        isElse: false
      };
      
      // Get current blocks for active sprite
      const activeSpriteDef = sprites.find(s => s.id === activeSprite);
      const currentBlocks = activeSpriteDef?.blocks || [];
      
      if (parentId) {
        const updatedBlocks = addBlockToParent(currentBlocks, parentId, newBlock);
        spriteDispatch({ 
          type: 'UPDATE_SPRITE_BLOCKS',
          spriteId: activeSprite,
          blocks: updatedBlocks
        });
      } else {
        spriteDispatch({
          type: 'UPDATE_SPRITE_BLOCKS',
          spriteId: activeSprite,
          blocks: [...currentBlocks, newBlock]
        });
      }
    } else {
      const activeSpriteDef = sprites.find(s => s.id === activeSprite);
      const updatedBlocks = moveBlock(activeSpriteDef?.blocks || [], data.id, parentId);
      spriteDispatch({
        type: 'UPDATE_SPRITE_BLOCKS',
        spriteId: activeSprite,
        blocks: updatedBlocks
      });
    }
  };

  const addBlockToParent = (blockList, parentId, newBlock) => {
    return blockList.map(block => {
      if (block.id === parentId) {
        if (block.type === 'ifElse') {
          const isElseSection = false;
          return {
            ...block,
            children: [
              ...block.children || [],
              { ...newBlock, isElse: isElseSection }
            ]
          };
        }
        return {
          ...block,
          children: [...(block.children || []), newBlock]
        };
      }
      if (block.children) {
        return {
          ...block,
          children: addBlockToParent(block.children, parentId, newBlock)
        };
      }
      return block;
    });
  };

  const moveBlock = (blockList, sourceId, targetId) => {
    let movedBlock = null;
    
    const removeBlock = (blocks) => {
      return blocks.filter(block => {
        if (block.id === sourceId) {
          movedBlock = { ...block };
          return false;
        }
        if (block.children) {
          block.children = removeBlock(block.children);
        }
        return true;
      });
    };

    let newBlocks = removeBlock([...blockList]);

    if (!targetId) {
      return [...newBlocks, movedBlock];
    }

    return addBlockToParent(newBlocks, targetId, movedBlock);
  };

  const handleParamUpdate = useCallback((blockId, newParams) => {
    const activeSpriteDef = sprites.find(s => s.id === activeSprite);
    if (!activeSpriteDef) return;

    const updateBlockParams = (blocks) => {
      return blocks.map(block => {
        if (block.id === blockId) {
          return { ...block, params: newParams };
        }
        if (block.children) {
          return { ...block, children: updateBlockParams(block.children) };
        }
        return block;
      });
    };

    const updatedBlocks = updateBlockParams(activeSpriteDef.blocks);
    
    spriteDispatch({
      type: 'UPDATE_SPRITE_BLOCKS',
      spriteId: activeSprite,
      blocks: updatedBlocks
    });

    // Log block update in debug mode
    if (window.DEBUG_MODE) {
      console.log(`Block ${blockId} updated in sprite ${activeSprite}:`, {
        newParams,
        timestamp: new Date().toISOString()
      });
    }
  }, [activeSprite, sprites, spriteDispatch]);

  const renderBlocks = (blockList) => {
    return blockList.map(block => (
      <Block
        key={block.id}
        id={block.id}
        type={block.type}
        params={block.params}
        onDrop={(data, targetId) => handleDrop({ 
          preventDefault: () => {}, 
          stopPropagation: () => {},
          dataTransfer: { getData: () => JSON.stringify(data) }
        }, targetId)}
        onParamUpdate={handleParamUpdate}
        onClick={() => handleBlockClick(block.id)}
        isSelected={execState.selectedBlock === block.id}
      >
        {block.children && renderBlocks(block.children)}
      </Block>
    ));
  };

  // Get the active sprite's blocks
  const activeSpriteDef = sprites.find(s => s.id === activeSprite);
  const activeBlocks = activeSpriteDef?.blocks || [];

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col">
      {renderSpriteBar()}
    <div
        className="flex-1 overflow-y-auto p-4"
      onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e)}
      >
        {/* Active sprite indicator */}
        <div className="mb-4 text-sm text-gray-600">
          Editing blocks for: {activeSpriteDef?.name || 'No sprite selected'}
        </div>
        <div className="space-y-4">
          {renderBlocks(activeBlocks)}
        </div>
      </div>
    </div>
  );
}
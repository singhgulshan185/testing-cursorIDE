import React from 'react';
import { SPRITE_IMAGES } from './SpriteImages';

const SpriteSelector = ({ sprites, activeSprite, setActiveSprite, addNewSprite }) => {
  // Default sprites available to add
  const defaultSprites = [
    { name: 'Cat', image: SPRITE_IMAGES.CAT.url },
    { name: 'Jerry', image: SPRITE_IMAGES.JERRY.url },
    { name: 'Ball', image: SPRITE_IMAGES.BALL.url },
    { name: 'Mickey', image: SPRITE_IMAGES.MICKEY.url }
  ];

  return (
    <div className="flex space-x-2">
      {sprites.map(sprite => (
        <div 
          key={sprite.id}
          className={`p-2 cursor-pointer rounded border ${activeSprite === sprite.id ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}
          onClick={() => setActiveSprite(sprite.id)}
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <img 
              src={sprite.image} 
              alt={sprite.name} 
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
          <div className="text-xs text-center mt-1">{sprite.name}</div>
        </div>
      ))}
      <div 
        className="p-2 cursor-pointer rounded border border-dashed border-gray-300 flex flex-col items-center justify-center"
        onClick={() => addNewSprite(defaultSprites[0])}
      >
        <div className="w-10 h-10 flex items-center justify-center">+</div>
        <div className="text-xs text-center mt-1">Add</div>
      </div>
    </div>
  );
};

export default SpriteSelector;
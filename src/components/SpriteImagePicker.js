import React, { useState, useRef } from 'react';
import { getAllSpriteImages } from './SpriteImages';
import { BUTTON_STYLES } from './BlockTypes';

export default function SpriteImagePicker({ onSelect, onClose }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef();
  const spriteImages = getAllSpriteImages();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image/(png|jpeg|jpg|svg\\+xml)')) {
        alert('Only PNG, JPEG, and SVG images are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setSelectedImage(imageData);
        onSelect(imageData, 'Custom Sprite');
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDefaultSelect = (sprite) => {
    setSelectedImage(sprite.url);
    onSelect(sprite.url, sprite.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Choose a Sprite</h2>
          <button
            onClick={onClose}
            className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.icon} ${BUTTON_STYLES.secondary}`}
            title="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {spriteImages.map((sprite, index) => (
            <div
              key={index}
              onClick={() => handleDefaultSelect(sprite)}
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 flex flex-col items-center transition-colors duration-200"
            >
              <img
                src={sprite.url}
                alt={sprite.name}
                className="w-16 h-16 object-contain mb-2"
                draggable={false}
              />
              <span className="text-sm text-center font-medium text-gray-700">{sprite.name}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.md} ${BUTTON_STYLES.primary}`}
          >
            Upload Custom Sprite
          </button>
        </div>
      </div>
    </div>
  );
} 
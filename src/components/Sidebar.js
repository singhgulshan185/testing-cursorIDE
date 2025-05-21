import React from 'react';
import Block from './BlockComponent';
import { BLOCK_CONFIGS, BLOCK_TYPES } from './BlockTypes';

export default function Sidebar() {
  const blocksByType = Object.entries(BLOCK_CONFIGS).reduce((acc, [key, config]) => {
    if (!acc[config.type]) {
      acc[config.type] = [];
    }
    acc[config.type].push({ ...config, key });
    return acc;
  }, {});

  return (
    <div className="w-60 flex-none h-full overflow-y-auto flex flex-col items-start p-2 border-r border-gray-200">
      {Object.entries(blocksByType).map(([type, blocks]) => (
        <div key={type} className="mb-6">
          <h2 className="font-bold mb-2 text-gray-700 uppercase text-sm">
            {type}
          </h2>
          <div className="space-y-2">
            {blocks.map((block) => (
              <Block
                key={block.key}
                id={`template-${block.key}`}
                type={block.key}
                params={block.params?.map(p => p.default)}
              />
            ))}
        </div>
        </div>
      ))}
    </div>
  );
}
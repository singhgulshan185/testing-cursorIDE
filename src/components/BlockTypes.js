export const BLOCK_TYPES = {
  MOTION: 'motion',
  LOOKS: 'looks',
  CONTROL: 'control',
};

// Base block styling that will be applied to all blocks
export const BASE_BLOCK_STYLE = 'rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:shadow-lg hover:-translate-y-0.5 hover:brightness-105 transition-all duration-200 ease-out font-[Inter,system-ui,sans-serif]';

// Button styles for consistent UI
export const BUTTON_STYLES = {
  base: 'transition-all duration-200 ease-out font-[Inter,system-ui,sans-serif] focus:outline-none focus:ring-2 focus:ring-opacity-50',
  sm: 'px-2 py-1 text-sm rounded-md shadow-sm hover:shadow-md',
  md: 'px-4 py-2 rounded-lg shadow-sm hover:shadow-md',
  lg: 'px-6 py-3 text-lg rounded-lg shadow-md hover:shadow-lg',
  icon: 'w-10 h-10 rounded-full flex items-center justify-center shadow-sm hover:shadow-md',
  primary: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-400',
  danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
  success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400',
  disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed hover:shadow-none',
};

// Enhanced condition types for if-else blocks
export const CONDITION_TYPES = {
  EQUALS: 'equals',
  GREATER_THAN: 'greaterThan',
  LESS_THAN: 'lessThan',
  KEY_PRESSED: 'keyPressed',
  MOUSE_DOWN: 'mouseDown',
  TOUCHING_EDGE: 'touchingEdge',
  TOUCHING_SPRITE: 'touchingSprite',
};

// Specific key options for key pressed condition
export const KEY_OPTIONS = [
  { label: 'space', value: ' ' },
  { label: 'up arrow', value: 'ArrowUp' },
  { label: 'down arrow', value: 'ArrowDown' },
  { label: 'left arrow', value: 'ArrowLeft' },
  { label: 'right arrow', value: 'ArrowRight' },
  { label: 'enter', value: 'Enter' },
];

export const BLOCK_CONFIGS = {
  move: {
    type: BLOCK_TYPES.MOTION,
    label: 'Move',
    color: 'bg-blue-500',
    params: [{ 
      type: 'number', 
      default: 10, 
      label: 'steps',
      min: -1000,
      max: 1000,
      allowDecimal: true
    }],
  },
  turnRight: {
    type: BLOCK_TYPES.MOTION,
    label: 'Turn right',
    color: 'bg-blue-500',
    params: [{ 
      type: 'number', 
      default: 90, 
      label: 'degrees',
      min: -360,
      max: 360,
      allowDecimal: true
    }],
  },
  turnLeft: {
    type: BLOCK_TYPES.MOTION,
    label: 'Turn left',
    color: 'bg-blue-500',
    params: [{ 
      type: 'number', 
      default: 90, 
      label: 'degrees',
      min: -360,
      max: 360,
      allowDecimal: true
    }],
  },
  goToXY: {
    type: BLOCK_TYPES.MOTION,
    label: 'Go to',
    color: 'bg-blue-500',
    params: [
      { 
        type: 'number', 
        default: 0, 
        label: 'x:',
        min: -100,
        max: 100,
        allowDecimal: true
      },
      { 
        type: 'number', 
        default: 0, 
        label: 'y:',
        min: -100,
        max: 100,
        allowDecimal: true
      }
    ],
  },
  say: {
    type: BLOCK_TYPES.LOOKS,
    label: 'Say',
    color: 'bg-purple-500',
    params: [
      { 
        type: 'text', 
        default: 'Hello!',
        maxLength: 140,
        placeholder: 'Type something...'
      },
      {
        type: 'number',
        default: 2,
        label: 'seconds',
        min: 0.1,
        max: 10,
        allowDecimal: true,
        required: true
      }
    ],
  },
  think: {
    type: BLOCK_TYPES.LOOKS,
    label: 'Think',
    color: 'bg-purple-500',
    params: [
      { 
        type: 'text', 
        default: 'Hmm...',
        maxLength: 140,
        placeholder: 'Type something...'
      },
      {
        type: 'number',
        default: 2,
        label: 'seconds',
        min: 0.1,
        max: 10,
        allowDecimal: true,
        required: true
      }
    ],
  },
  repeat: {
    type: BLOCK_TYPES.CONTROL,
    label: 'Repeat',
    color: 'bg-yellow-500',
    params: [{ 
      type: 'number', 
      default: 10, 
      label: 'times',
      min: 1,
      max: 100,
      allowDecimal: false,
      required: true,
      validate: (value) => {
        const num = Number(value);
        if (isNaN(num) || !Number.isInteger(num) || num < 1) {
          return 'Must be a positive integer';
        }
        if (num > 100) {
          return 'Maximum repeat count is 100';
        }
        return null;
      }
    }],
    isContainer: true,
    acceptsBlocks: true,
    childrenType: 'sequence',
  }
}; 
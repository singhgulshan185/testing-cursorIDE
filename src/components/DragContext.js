import React, { createContext, useContext, useReducer } from 'react';

const DragContext = createContext();

const initialState = {
  draggingBlock: null,
  blocks: [],
};

function dragReducer(state, action) {
  switch (action.type) {
    case 'START_DRAG':
      return { ...state, draggingBlock: action.block };
    case 'END_DRAG':
      return { ...state, draggingBlock: null };
    case 'ADD_BLOCK':
      return { ...state, blocks: [...state.blocks, action.block] };
    case 'UPDATE_BLOCKS':
      return { ...state, blocks: action.blocks };
    default:
      return state;
  }
}

export function DragProvider({ children }) {
  const [state, dispatch] = useReducer(dragReducer, initialState);

  return (
    <DragContext.Provider value={{ state, dispatch }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDrag() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDrag must be used within a DragProvider');
  }
  return context;
} 
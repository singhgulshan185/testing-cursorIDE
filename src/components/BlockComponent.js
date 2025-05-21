import React, { useState, useRef, useEffect } from 'react';
import { useDrag } from './DragContext';
import { BLOCK_CONFIGS, CONDITION_TYPES } from './BlockTypes';

export default function Block({ id, type, params = [], children, onDrop, onParamUpdate, onClick, isSelected }) {
  const { dispatch } = useDrag();
  const [isDragging, setIsDragging] = useState(false);
  const [localInputs, setLocalInputs] = useState(params.map(String));
  const [validationErrors, setValidationErrors] = useState([]);
  const inputRefs = useRef([]);
  const config = BLOCK_CONFIGS[type];

  // Keep local inputs synced with params
  useEffect(() => {
    setLocalInputs(params.map(String));
  }, [params]);

  // Validate all inputs and update error state
  const validateAllInputs = () => {
    const errors = config.params.map((paramConfig, index) => {
      if (paramConfig.required && !localInputs[index]) {
        return `${paramConfig.label} is required`;
      }
      if (paramConfig.type === 'number') {
        const num = Number(localInputs[index]);
        if (isNaN(num)) {
          return `${paramConfig.label} must be a number`;
        }
        if (paramConfig.min !== undefined && num < paramConfig.min) {
          return `${paramConfig.label} must be at least ${paramConfig.min}`;
        }
        if (paramConfig.max !== undefined && num > paramConfig.max) {
          return `${paramConfig.label} must be at most ${paramConfig.max}`;
        }
      }
      return null;
    });
    setValidationErrors(errors);
    return errors.every(error => error === null);
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    dispatch({ 
      type: 'START_DRAG', 
      block: { id, type, params } 
    });
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, type, params }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dispatch({ type: 'END_DRAG' });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    onDrop?.(data, id);
  };

  const validateInput = (value, paramConfig) => {
    if (paramConfig.type === 'number') {
      // Handle empty or invalid input
      if (value === '' || value === '-') return value;
      
      // Allow decimal points during typing
      if (value.endsWith('.') || value.endsWith('-.')) return value;
      
      const num = Number(value);
      if (isNaN(num)) {
        return paramConfig.required ? paramConfig.default.toString() : '';
      }
      
      // Special handling for repeat count
      if (paramConfig.label === 'times') {
        // Must be a positive integer
        const intValue = Math.floor(num);
        if (intValue < 1) return '1';
        return intValue.toString();
      }
      
      // Only apply bounds on final values, not during typing
      if (!value.endsWith('.')) {
        if (paramConfig.min !== undefined) value = Math.max(paramConfig.min, num);
        if (paramConfig.max !== undefined) value = Math.min(paramConfig.max, num);
        return value.toString();
      }
      return value;
    }
    
    // For text input, handle maxLength
    if (paramConfig.maxLength && value.length > paramConfig.maxLength) {
      return value.slice(0, paramConfig.maxLength);
    }
    return value;
  };

  const handleParamChange = (index, value) => {
    const paramConfig = config.params[index];
    const validatedValue = validateInput(value, paramConfig);
    
    // Update local state immediately for responsive typing
    const newLocalInputs = [...localInputs];
    newLocalInputs[index] = validatedValue;
    setLocalInputs(newLocalInputs);
    
    // Clear validation errors for this field
    const newErrors = [...validationErrors];
    newErrors[index] = null;
    setValidationErrors(newErrors);
    
    // Only update global state if the value is valid and complete
    if (!validatedValue.endsWith('.') && !validatedValue.endsWith('-')) {
      const newParams = [...params];
      if (paramConfig.type === 'number') {
        const num = Number(validatedValue);
        if (!isNaN(num)) {
          // Special handling for repeat count
          if (paramConfig.label === 'times') {
            newParams[index] = Math.max(1, Math.floor(num));
          } else {
            newParams[index] = num;
          }
        }
      } else {
        newParams[index] = validatedValue;
      }
      
      dispatch({
        type: 'UPDATE_BLOCK',
        block: { id, type, params: newParams }
      });
      onParamUpdate?.(id, newParams);
      
      // Log parameter update in debug mode
      if (window.DEBUG_MODE) {
        console.log(`Block ${id} parameter ${index} updated:`, {
          type,
          paramName: paramConfig.label,
          value: newParams[index],
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  const handleKeyDown = (e, index) => {
    const paramConfig = config.params[index];
    
    if (e.key === 'Enter') {
      e.target.blur();
      // Ensure final value is within bounds
      const value = localInputs[index];
      if (paramConfig.type === 'number') {
        const num = Number(value);
        if (!isNaN(num)) {
          const boundedValue = Math.min(
            Math.max(num, paramConfig.min ?? -Infinity),
            paramConfig.max ?? Infinity
          );
          handleParamChange(index, boundedValue.toString());
        } else {
          handleParamChange(index, paramConfig.default.toString());
        }
      }
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const handleBlur = (index) => {
    const paramConfig = config.params[index];
    const value = localInputs[index];
    
    if (paramConfig.type === 'number') {
      const num = Number(value);
      if (isNaN(num) || value === '' || value.endsWith('.')) {
        handleParamChange(index, paramConfig.default.toString());
      }
    }
  };

  const renderInput = (paramConfig, index) => {
    // Check if this parameter should be shown based on other parameter values
    if (paramConfig.showIf && !paramConfig.showIf(params)) {
      return null;
    }

    if (paramConfig.type === 'select') {
      return (
        <select
          value={localInputs[index]}
          onChange={(e) => handleParamChange(index, e.target.value)}
          className={`w-32 px-2 py-1 rounded bg-white bg-opacity-20 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
            ${validationErrors[index] ? 'border-red-500' : ''}`}
        >
          {paramConfig.options.map((option) => (
            <option key={option.value} value={option.value} className="text-black">
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={el => inputRefs.current[index] = el}
        type="text"
        inputMode={paramConfig.type === 'number' ? 'decimal' : 'text'}
        value={localInputs[index]}
        onChange={(e) => handleParamChange(index, e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, index)}
        onFocus={handleFocus}
        onBlur={() => handleBlur(index)}
        className={`w-20 px-2 py-1 rounded bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
          ${validationErrors[index] ? 'border-red-500' : ''}`}
        placeholder={paramConfig.default.toString()}
        data-param-index={index}
        data-param-type={paramConfig.type}
      />
    );
  };

  // Split children into if and else blocks
  const ifBlocks = Array.isArray(children) ? children.filter(child => !child.props?.isElse) : [];
  const elseBlocks = Array.isArray(children) ? children.filter(child => child.props?.isElse) : [];

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`
        ${config.color} p-3 rounded-lg shadow-md mb-2 cursor-move
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${isSelected ? 'ring-2 ring-white ring-opacity-70' : ''}
        transition-all duration-200
      `}
      data-block-id={id}
      data-block-type={type}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-white font-medium">{config.label}</span>
        {config.params.map((paramConfig, index) => (
          <div key={index} className="flex items-center gap-1">
            {paramConfig.label && (
              <span className="text-white text-sm">{paramConfig.label}</span>
            )}
            {renderInput(paramConfig, index)}
            {validationErrors[index] && (
              <span className="text-red-200 text-xs ml-1">{validationErrors[index]}</span>
            )}
          </div>
        ))}
      </div>
      {config.isContainer && (
        <div className="mt-2">
          {config.hasElse ? (
            <>
              <div className="pl-4 border-l-2 border-white border-opacity-50">
                {ifBlocks}
              </div>
              <div className="mt-2 mb-1">
                <span className="text-white font-medium">else</span>
              </div>
              <div className="pl-4 border-l-2 border-white border-opacity-50">
                {elseBlocks}
              </div>
            </>
          ) : (
            <div className="pl-4 border-l-2 border-white border-opacity-50">
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

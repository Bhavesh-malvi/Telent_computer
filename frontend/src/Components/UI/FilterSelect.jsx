import React, { useEffect, useRef, useState } from 'react';
import './FilterSelect.css';

const FilterSelect = ({ value, onChange, options, placeholder = 'Select', className = '' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(o => o.value === value);
  const label = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`fs-container ${className}`}>
      <button type="button" className={`fs-trigger ${open ? 'fs-open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className="fs-label">{label}</span>
        <span className="fs-caret" aria-hidden>▾</span>
      </button>
      {open && (
        <div className="fs-menu" role="listbox">
          {options.map(opt => (
            <div
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`fs-option ${opt.value === value ? 'fs-selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterSelect;

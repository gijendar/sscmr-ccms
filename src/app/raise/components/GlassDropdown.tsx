'use client';

import {useState, useRef, useEffect} from 'react';

interface GlassDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function GlassDropdown({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select an option',
  error,
  disabled = false,
  loading = false,
}: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selectedOption = options.find((opt) => opt === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'ArrowDown' && isOpen) {
      event.preventDefault();
      const currentIndex = options.indexOf(value);
      const nextIndex = Math.min(currentIndex + 1, options.length - 1);
      if (nextIndex >= 0) {
        onChange(options[nextIndex]);
        optionRefs.current[nextIndex]?.scrollIntoView({block: 'nearest'});
      }
    } else if (event.key === 'ArrowUp' && isOpen) {
      event.preventDefault();
      const currentIndex = options.indexOf(value);
      const prevIndex = Math.max(currentIndex - 1, 0);
      if (prevIndex >= 0) {
        onChange(options[prevIndex]);
        optionRefs.current[prevIndex]?.scrollIntoView({block: 'nearest'});
      }
    }
  };

  return (
    <div className="space-y-1" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium" style={{color: 'rgba(255,255,255,0.9)'}}>
          {label}
        </label>
      )}

      <div
        className={`relative rounded-lg border ${error ? 'border-red-500' : 'border-white/20'} shadow-sm transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary`}
        style={{
          background: error ? undefined : 'rgba(255,255,255,0.08)',
          minHeight: '44px',
        }}
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors"
          style={{
            color: error ? undefined : '#ffffff',
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            opacity: disabled || loading ? 0.6 : 1,
          }}
        >
          <span
            className={`truncate ${!selectedOption && !error ? 'text-white/50' : ''}`}
            style={{
              color: error ? undefined : selectedOption ? '#ffffff' : 'rgba(255,255,255,0.5)',
            }}
          >
            {loading ? 'Loading...' : selectedOption || placeholder}
          </span>
          <svg
            className={`h-4 w-4 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && !loading && !disabled && (
          <div
            className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-white/20 bg-white/10 p-1 shadow-xl backdrop-blur-xl"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div
              className="max-h-60 overflow-y-auto"
              style={{scrollbarColor: 'rgba(255,255,255,0.2) transparent'}}
            >
              {options.map((option, index) => {
                const isSelected = option === value;
                return (
                  <div
                    key={option}
                    ref={(el) => {
                      optionRefs.current[index] = el;
                    }}
                    onClick={() => handleSelect(option)}
                    className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors ${
                      isSelected ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                    style={{
                      color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.85)',
                    }}
                  >
                    <span>{option}</span>
                    {isSelected && (
                      <svg
                        className="h-4 w-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        stroke="none"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

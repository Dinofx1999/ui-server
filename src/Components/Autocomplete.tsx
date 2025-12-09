import React, { useState, useRef, useEffect } from 'react';
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Input, Spin } from 'antd';

interface AutocompleteSearchProps {
  suggestions: string[];
  placeholder?: string;
  onSearch: (value: string) => void;
  onSelect: (value: string) => void;
  loading?: boolean;
  width?: string | number;
  height?: string | number;
  theme?: any; // ✅ NEW
}

// ✅ Default theme
const DEFAULT_THEME = {
  inputBg: '#ffffff',
  border: '#d9d9d9',
  borderFocus: '#1890ff',
  text: '#000000',
  textMuted: '#999999',
  dropdownBg: '#ffffff',
  hoverBg: '#f0f0f0',
};

const AutocompleteSearch: React.FC<AutocompleteSearchProps> = ({
  suggestions = [],
  placeholder = 'Search...',
  onSearch,
  onSelect,
  loading = false,
  width = '100%',
  height = '40px',
  theme, // ✅ Accept theme prop
}) => {
  const t = theme || DEFAULT_THEME; // ✅ Use theme or default

  const [value, setValue] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toSize = (size: string | number) => 
    typeof size === 'number' ? `${size}px` : size;

  const filteredSuggestions = value.trim()
    ? suggestions.filter(item => 
        item.toLowerCase().includes(value.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.input?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        handleSelect(filteredSuggestions[highlightedIndex]);
      } else if (value.trim()) {
        onSearch(value);
        setShowDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSelect = (item: string) => {
    setValue(item);
    onSelect(item);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setValue('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div 
      style={{ 
        position: 'relative',
        width: toSize(width),
      }}
    >
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onSearch(e.target.value);
          setShowDropdown(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setIsFocused(true);
          value.trim() && setShowDropdown(true);
        }}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        prefix={loading ? <Spin size="small" /> : <SearchOutlined />}
        suffix={
          value && (
            <CloseCircleOutlined
              onClick={handleClear}
              style={{ 
                cursor: 'pointer', 
                color: t.textMuted, // ✅ Theme color
              }}
            />
          )
        }
        style={{ 
          height: toSize(height),
          background: t.inputBg, // ✅ Theme color
          borderColor: isFocused ? t.borderFocus : t.border, // ✅ Theme color
          color: t.text, // ✅ Theme color
        }}
      />

      {showDropdown && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: t.dropdownBg, // ✅ Theme color
            border: `1px solid ${t.border}`, // ✅ Theme color
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          {filteredSuggestions.map((item, index) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                background: highlightedIndex === index ? t.hoverBg : t.dropdownBg, // ✅ Theme color
                color: t.text, // ✅ Theme color
                transition: 'background 0.2s',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteSearch;
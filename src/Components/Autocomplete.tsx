import React, { useState, useRef, useEffect } from 'react';
import { SearchOutlined } from '@ant-design/icons';

interface AutocompleteSearchProps {
  suggestions: string[]; // Danh sách gợi ý
  placeholder?: string;
  onSearch?: (value: string) => void;
  onSelect?: (value: string) => void;
  theme: {
    inputBg: string;
    border: string;
    text: string;
    muted: string;
    cardBg: string;
    cardHoverBg: string;
    accentPurple: string;
  };
}

const AutocompleteSearch: React.FC<AutocompleteSearchProps> = ({
  suggestions,
  placeholder = 'Search...',
  onSearch,
  onSelect,
  theme,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on search value
  useEffect(() => {
    if (searchValue.trim() === '') {
      setFilteredSuggestions([]);
      setShowDropdown(false);
    } else {
      const filtered = suggestions.filter((item) =>
        item.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
    }
    setSelectedIndex(-1);
  }, [searchValue, suggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleSelect = (value: string) => {
    setSearchValue(value);
    setShowDropdown(false);
    onSelect?.(value);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(filteredSuggestions[selectedIndex]);
        } else if (filteredSuggestions.length > 0) {
          handleSelect(filteredSuggestions[0]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={dropdownRef} style={{ flex: 1, position: 'relative' }}>
      {/* Search Icon */}
      <SearchOutlined
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: theme.muted,
          fontSize: '16px',
          zIndex: 1,
        }}
      />

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => searchValue && setShowDropdown(filteredSuggestions.length > 0)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 12px 12px 40px',
          background: theme.inputBg,
          border: `1px solid ${showDropdown ? theme.accentPurple : theme.border}`,
          borderRadius: showDropdown ? '8px 8px 0 0' : '8px',
          color: theme.text,
          fontSize: '14px',
          outline: 'none',
          transition: 'all 0.2s ease',
        }}
      />

      {/* Clear Button */}
      {searchValue && (
        <button
          onClick={() => {
            setSearchValue('');
            setShowDropdown(false);
            inputRef.current?.focus();
          }}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: theme.muted,
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          ✕
        </button>
      )}

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: theme.cardBg,
            border: `1px solid ${theme.accentPurple}`,
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
            zIndex: 1000,
          }}
        >
          {filteredSuggestions.length > 0 ? (
            <div>
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  onClick={() => handleSelect(suggestion)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: selectedIndex === index ? theme.cardHoverBg : 'transparent',
                    color: theme.text,
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    borderLeft: selectedIndex === index
                      ? `3px solid ${theme.accentPurple}`
                      : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.cardHoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (selectedIndex !== index) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {/* Highlight matched text */}
                  {highlightMatch(suggestion, searchValue, theme)}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: theme.muted,
                fontSize: '14px',
              }}
            >
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to highlight matched text
const highlightMatch = (
  text: string,
  search: string,
  theme: { text: string; accentPurple: string }
) => {
  if (!search) return text;

  const parts = text.split(new RegExp(`(${search})`, 'gi'));
  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <strong
            key={index}
            style={{
              color: theme.accentPurple,
              fontWeight: 700,
            }}
          >
            {part}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

export default AutocompleteSearch;
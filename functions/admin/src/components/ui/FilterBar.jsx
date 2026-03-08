'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check, Filter } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 border border-zinc-300 rounded-lg bg-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-zinc-700 dark:bg-zinc-800 dark:text-white hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 flex items-center justify-between min-w-[140px] whitespace-nowrap gap-2"
      >
        <span className={`truncate flex-1 min-w-0 ${value ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
          {displayValue}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden transform transition-all duration-200 ease-out origin-top">
          <div className="max-h-60 overflow-y-auto dropdown-scrollbar">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-sm text-left transition-colors duration-150 flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                  }`}
                >
                  <span className="flex-1">{option.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const NumberRangeFilter = ({ option, localFilters, handleFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const operator = localFilters[`${option.key}Operator`] || '';
  const value = localFilters[`${option.key}Value`] || '';
  const isActive = operator && value;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOperatorChange = (newOperator) => {
    handleFilterChange(`${option.key}Operator`, newOperator);
  };

  const handleValueChange = (newValue) => {
    handleFilterChange(`${option.key}Value`, newValue);
  };

  const clearFilter = (e) => {
    e.stopPropagation();
    handleFilterChange(`${option.key}Operator`, '');
    handleFilterChange(`${option.key}Value`, '');
  };

  const displayText = isActive 
    ? `${operator} ${value}` 
    : option.placeholder || 'Filter by count';

  return (
    <div ref={popoverRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 border rounded-lg text-sm transition-all duration-200 flex items-center gap-2 min-w-[160px] ${
          isActive
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium'
            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600'
        }`}
      >
        <Filter className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{displayText}</span>
        {isActive && (
          <button
            type="button"
            onClick={clearFilter}
            className="ml-1 p-0.5 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl p-4 min-w-[280px] transform transition-all duration-200 ease-out origin-top">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {option.label}
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Operator
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOperatorChange('>=')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    operator === '>='
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                  }`}
                >
                  {'more than'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOperatorChange('<')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    operator === '<'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                  }`}
                >
                  {'less than'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Value
              </label>
              <input
                type="number"
                min="0"
                value={value}
                placeholder={option.placeholder || 'Enter count'}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterBar = ({
  filters = {},
  onFilterChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  filterOptions = [],
  className = '',
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const searchTimeoutRef = useRef(null);

  // Sync local filters with parent filters when they change externally
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearch = (value) => {
    const newFilters = { ...localFilters, search: value };
    setLocalFilters(newFilters);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search - only call onFilterChange after user stops typing for 500ms
    searchTimeoutRef.current = setTimeout(() => {
      onFilterChange(newFilters);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    // Clear any pending search debounce
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    // Clear all filters except createdBy (which should be preserved)
    const cleared = Object.keys(localFilters).reduce((acc, key) => {
      if (key === 'createdBy') {
        // Preserve createdBy filter - don't clear it
        acc[key] = localFilters[key];
      } else {
        acc[key] = '';
      }
      return acc;
    }, {});
    setLocalFilters(cleared);
    onFilterChange(cleared);
  };

  // Check if numberRange filters are active
  const hasActiveFilters = Object.entries(localFilters).some(([key, value]) => {
    if (key.includes('Operator') || key.includes('Value')) {
      // For numberRange, check if both operator and value are set
      const baseKey = key.replace('Operator', '').replace('Value', '');
      const operator = localFilters[`${baseKey}Operator`];
      const val = localFilters[`${baseKey}Value`];
      return operator && val;
    }
    return value && value !== '';
  });


  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={localFilters.search || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-zinc-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
          {localFilters.search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      {filterOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {filterOptions.map((option) => (
            <div key={option.key} className="flex items-center gap-2">
              {option.label && (
                <label className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                  {option.label}:
                </label>
              )}
              {option.type === 'select' ? (
                <CustomSelect
                  value={localFilters[option.key] || ''}
                  onChange={(value) => handleFilterChange(option.key, value)}
                  options={option.options || []}
                  placeholder={option.placeholder || 'Select...'}
                />
              ) : option.type === 'date' ? (
                <input
                  type="date"
                  value={localFilters[option.key] || ''}
                  onChange={(e) => handleFilterChange(option.key, e.target.value)}
                  className="px-3 py-1.5 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              ) : option.type === 'number' ? (
                <input
                  type="number"
                  min="0"
                  value={localFilters[option.key] || ''}
                  placeholder={option.placeholder || 'Enter number'}
                  onChange={(e) => handleFilterChange(option.key, e.target.value)}
                  className="px-3 py-1.5 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white w-32"
                />
              ) : option.type === 'numberRange' ? (
                <NumberRangeFilter
                  option={option}
                  localFilters={localFilters}
                  handleFilterChange={handleFilterChange}
                />
              ) : (
                <input
                  type="text"
                  value={localFilters[option.key] || ''}
                  placeholder={option.placeholder || 'Enter value'}
                  onChange={(e) => handleFilterChange(option.key, e.target.value)}
                  className="px-3 py-1.5 border border-zinc-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              )}
            </div>
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;


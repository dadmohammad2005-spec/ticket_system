import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  MapPin, ChevronDown, Search, X, Star, Check, Globe 
} from 'lucide-react';
import { 
  PAKISTAN_CITIES, PAKISTAN_PROVINCES, ALPHABET_LETTERS, 
  ProvinceType, PakistanCityItem 
} from '../data/pakistanCities';

interface PakistanCityDropdownProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (city: string) => void;
  className?: string;
  iconColor?: string;
  required?: boolean;
}

// Color badges for provinces
const PROVINCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Punjab': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Sindh': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'Khyber Pakhtunkhwa (KPK)': { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  'Balochistan': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Islamabad (Capital)': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'Gilgit-Baltistan': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  'Azad Kashmir (AJK)': { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
};

export const PakistanCityDropdown: React.FC<PakistanCityDropdownProps> = ({
  label,
  placeholder = 'Select or type city...',
  value,
  onChange,
  className = '',
  iconColor = 'text-brand-600',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<ProvinceType>('All Cities (A-Z)');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter cities by province, letter, and search text
  const filteredCities = useMemo(() => {
    return PAKISTAN_CITIES.filter((city) => {
      // 1. Province filter
      if (selectedProvince !== 'All Cities (A-Z)' && city.province !== selectedProvince) {
        return false;
      }

      // 2. Alphabet filter
      if (selectedLetter !== 'ALL') {
        if (!city.name.toUpperCase().startsWith(selectedLetter)) {
          return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = city.name.toLowerCase().includes(query);
        const matchesProvince = city.province.toLowerCase().includes(query);
        return matchesName || matchesProvince;
      }

      return true;
    });
  }, [selectedProvince, selectedLetter, searchQuery]);

  // Group filtered cities by their first letter
  const groupedCities = useMemo(() => {
    const groups: Record<string, PakistanCityItem[]> = {};
    for (const city of filteredCities) {
      const firstLetter = city.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(city);
    }
    return groups;
  }, [filteredCities]);

  const handleSelectCity = (cityName: string) => {
    onChange(cityName);
    setIsOpen(false);
  };

  const handleCustomCitySubmit = () => {
    if (searchQuery.trim()) {
      onChange(searchQuery.trim());
      setIsOpen(false);
    }
  };

  const currentSelectedCityItem = useMemo(() => {
    return PAKISTAN_CITIES.find(c => c.name.toLowerCase() === value.toLowerCase());
  }, [value]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <MapPin className={`w-3.5 h-3.5 ${iconColor}`} />
          <span>{label}</span>
        </label>
      )}

      {/* TRIGGER BUTTON / INPUT */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
          <MapPin className={`w-4 h-4 shrink-0 ${iconColor}`} />
          {value ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-extrabold text-sm text-slate-900 truncate">
                {value}
              </span>
              {currentSelectedCityItem && (
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                  {currentSelectedCityItem.province}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm font-semibold text-slate-400 truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Clear city"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-600' : ''}`} />
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full min-w-[320px] sm:min-w-[420px] md:min-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[999] overflow-hidden animate-fadeIn text-left">
          
          {/* SEARCH BOX INSIDE DROPDOWN */}
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredCities.length > 0) {
                      handleSelectCity(filteredCities[0].name);
                    } else if (searchQuery.trim()) {
                      handleCustomCitySubmit();
                    }
                  }
                }}
                placeholder="Type city name (e.g. Abbottabad, Lahore, Karachi)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ALL PROVINCES HORIZONTAL TABS */}
          <div className="px-3 pt-2 pb-1.5 bg-slate-50/70 border-b border-slate-200">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Filter by Province:</span>
              <span className="text-slate-400 font-normal">{filteredCities.length} cities available</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-300">
              {PAKISTAN_PROVINCES.map((prov) => {
                const isSelected = selectedProvince === prov;
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => {
                      setSelectedProvince(prov);
                      setSelectedLetter('ALL');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {prov}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ALPHABETICAL SYSTEM BAR (A to Z) */}
          <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-1 overflow-x-auto scrollbar-thin">
            <span className="text-[10px] font-black text-slate-600 shrink-0 pr-1 uppercase">A-Z:</span>
            <button
              type="button"
              onClick={() => setSelectedLetter('ALL')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-black shrink-0 transition-colors ${
                selectedLetter === 'ALL'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              ALL
            </button>
            {ALPHABET_LETTERS.map((letter) => {
              const isSelected = selectedLetter === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setSelectedLetter(letter)}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-black shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-brand-50 hover:text-brand-700'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* CITIES LIST (GROUPED BY ALPHABET) */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
            {/* Custom City Option if user typed something custom */}
            {searchQuery.trim() && (
              <div
                onClick={handleCustomCitySubmit}
                className="p-3 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-900 border border-indigo-200 m-1 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-xs font-black block">Use &quot;{searchQuery.trim()}&quot;</span>
                    <span className="text-[10px] text-indigo-600">Custom Pakistan location or route</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700 px-2 py-0.5 rounded bg-white border border-indigo-200">
                  Select ➔
                </span>
              </div>
            )}

            {filteredCities.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Pakistan city matched &quot;{searchQuery}&quot;</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  You can still click &quot;Use custom city&quot; above to calculate fare and generate ticket.
                </p>
              </div>
            ) : (
              Object.keys(groupedCities).sort().map((letter) => {
                const citiesInLetter = groupedCities[letter];
                return (
                  <div key={letter} className="py-1">
                    {/* Alphabet Section Header */}
                    <div className="sticky top-0 bg-slate-50/95 backdrop-blur-xs px-3 py-1 text-[11px] font-black text-brand-700 flex items-center justify-between z-10">
                      <span>— {letter} —</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{citiesInLetter.length} cities</span>
                    </div>

                    <div className="divide-y divide-slate-50">
                      {citiesInLetter.map((city) => {
                        const isSelected = value.toLowerCase() === city.name.toLowerCase();
                        const colorMeta = PROVINCE_COLORS[city.province] || {
                          bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200'
                        };

                        return (
                          <div
                            key={city.name}
                            onClick={() => handleSelectCity(city.name)}
                            className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-brand-50/80 text-brand-900 font-black'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${city.isPopular ? 'bg-amber-400 ring-2 ring-amber-100' : 'bg-slate-300'}`} />
                              <div className="truncate">
                                <span className="text-xs font-bold block truncate">
                                  {city.name}
                                  {city.isPopular && (
                                    <Star className="inline w-3 h-3 text-amber-500 fill-amber-400 ml-1.5 -mt-0.5" />
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorMeta.bg} ${colorMeta.text} ${colorMeta.border}`}>
                                {city.province}
                              </span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-brand-600 shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER HELPER */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Alphabetical order (A-Z) &bull; All 7 Pakistan regions</span>
            <button
              type="button"
              onClick={() => {
                setSelectedProvince('All Cities (A-Z)');
                setSelectedLetter('ALL');
                setSearchQuery('');
              }}
              className="text-brand-600 hover:underline font-bold"
            >
              Reset Filters
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

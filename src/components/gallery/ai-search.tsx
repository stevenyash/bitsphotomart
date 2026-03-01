'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchSuggestion {
  text: string;
  type: 'category' | 'tag' | 'recent' | 'ai';
  icon?: string;
}

interface AISearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

// Predefined categories for quick access
const CATEGORIES = [
  'landscape', 'portrait', 'wildlife', 'urban', 'events', 'product', 
  'nature', 'architecture', 'food', 'travel', 'sports', 'fashion'
];

// Common tags for suggestions
const COMMON_TAGS = [
  'sunset', 'mountain', 'ocean', 'city', 'street', 'wedding', 'portrait',
  'abstract', 'minimalist', 'vintage', 'modern', 'aerial', 'night'
];

export function AISearch({ placeholder = "Search photos, categories, or describe what you need...", onSearch, className = "" }: AISearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAiMode, setIsAiMode] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate AI-powered suggestions
  const generateSuggestions = useCallback((searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Check for natural language patterns
    const hasPriceFilter = /\d+\s*(dollar|usd|\$|ksh|kes|price)/i.test(searchQuery);
    const hasColorFilter = /(red|blue|green|yellow|orange|purple|black|white|pink)/i.test(searchQuery);
    const hasMood = /(happy|sad|romantic|exciting|calm|energetic|moody)/i.test(searchQuery);
    const hasStyle = /(vintage|modern|minimalist|abstract|realistic|artistic)/i.test(searchQuery);

    // Add category suggestions
    CATEGORIES.forEach(cat => {
      if (cat.includes(lowerQuery) || lowerQuery.includes(cat)) {
        newSuggestions.push({ text: cat, type: 'category', icon: '📷' });
      }
    });

    // Add tag suggestions
    COMMON_TAGS.forEach(tag => {
      if (tag.includes(lowerQuery) || lowerQuery.includes(tag)) {
        newSuggestions.push({ text: tag, type: 'tag', icon: '🏷️' });
      }
    });

    // Add AI-enhanced suggestions based on patterns
    if (hasPriceFilter) {
      const cleanQuery = lowerQuery.replace(/\d+\s*(dollar|usd|\$|ksh|kes|price)/i, '').trim();
      newSuggestions.push({ 
        text: `Budget-friendly ${cleanQuery}`, 
        type: 'ai', 
        icon: '✨' 
      });
    }

    if (hasColorFilter) {
      newSuggestions.push({ 
        text: `${lowerQuery} - trending colors`, 
        type: 'ai', 
        icon: '✨' 
      });
    }

    if (hasMood || hasStyle) {
      newSuggestions.push({ 
        text: `${lowerQuery} - professional quality`, 
        type: 'ai', 
        icon: '✨' 
      });
    }

    // If no matches, provide AI suggestions
    if (newSuggestions.length === 0) {
      newSuggestions.push(
        { text: `Best ${lowerQuery} photos`, type: 'ai', icon: '✨' },
        { text: `Premium ${lowerQuery} collection`, type: 'ai', icon: '✨' },
        { text: `Trending ${lowerQuery} images`, type: 'ai', icon: '✨' },
        ...CATEGORIES.slice(0, 3).map(cat => ({ text: `${lowerQuery} ${cat}`, type: 'tag' as const, icon: '🔍' }))
      );
    }

    setSuggestions(newSuggestions.slice(0, 8));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      // Show category quick links when query is empty
      setSuggestions(CATEGORIES.slice(0, 6).map(cat => ({
        text: cat,
        type: 'category' as const,
        icon: '📷'
      })));
      return;
    }

    // Debounce the AI suggestion generation
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      generateSuggestions(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, generateSuggestions]);

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;
    
    setShowSuggestions(false);
    
    if (onSearch) {
      onSearch(finalQuery);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('search', finalQuery);
      router.push(`/gallery?${params.toString()}`);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* AI Mode Indicator */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
          {isAiMode && (
            <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
          )}
          <Search className="w-4 h-4 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
        />

        {/* Right side controls */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          
          <button
            onClick={() => setIsAiMode(!isAiMode)}
            className={`p-1.5 rounded-lg transition-colors ${isAiMode ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-400'}`}
            title={isAiMode ? 'AI Search Enabled' : 'AI Search Disabled'}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* AI Tip */}
          {isAiMode && query.length > 0 && (
            <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-2 text-sm">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span className="text-purple-700">
                Try: "landscape under $50" or "sunset with warm colors"
              </span>
            </div>
          )}

          {/* Suggestions List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI is thinking...</span>
              </div>
            ) : (
              <>
                {/* Categories Section */}
                {suggestions.some(s => s.type === 'category') && (
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                      Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.filter(s => s.type === 'category').map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 hover:text-purple-700 rounded-full text-sm transition-colors flex items-center gap-1.5"
                        >
                          <span>{suggestion.icon}</span>
                          <span>{suggestion.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggestions */}
                {suggestions.some(s => s.type === 'ai') && (
                  <div className="px-3 py-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-purple-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Suggestions
                    </p>
                    <div className="space-y-1">
                      {suggestions.filter(s => s.type === 'ai').map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-3 py-2 text-left hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2 group"
                        >
                          <span className="text-purple-400">{suggestion.icon}</span>
                          <span className="text-gray-700 group-hover:text-purple-700">{suggestion.text}</span>
                          <ArrowRight className="w-3 h-3 ml-auto text-gray-300 group-hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {suggestions.some(s => s.type === 'tag') && (
                  <div className="px-3 py-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                      Related Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.filter(s => s.type === 'tag').map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          #{suggestion.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Search Button */}
          {query && (
            <div className="border-t border-gray-200 p-3">
              <button
                onClick={() => handleSearch()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search for "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AISearch;

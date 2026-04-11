import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/constants';
import useLanguageStore from '../../stores/languageStore';

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const navigate = useNavigate();
  const debounceRef = useRef();
  const { t, isRTL, getLocalizedField } = useLanguageStore();

  useEffect(() => {
    inputRef.current?.focus();
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, []);

  const searchProducts = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select(`
        id, name_en, name_ar, base_image_url,
        product_colors(id, image_url, colors(name_en, name_ar, hex_code)),
        product_variants(id, base_price)
      `)
      .or(`name_en.ilike.%${q.trim()}%,name_ar.ilike.%${q.trim()}%`)
      .limit(8);

    setResults(data || []);
    setLoading(false);
  }, []);

  const handleInput = (e) => {
    const value = e.target.value;
    setQuery(value);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(value), 300);
  };

  const handleSelect = (productId) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="search-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} onKeyDown={handleKeyDown}>
      <div className="search-modal">
        <div className="search-input-wrapper">
          <Search size={20} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('nav.searchPlaceholder')}
            value={query}
            onChange={handleInput}
          />
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="search-results">
          {loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="search-no-results">
              {isRTL() ? `لم يتم العثور على منتجات لـ "${query}"` : `No products found for "${query}"`}
            </div>
          )}

          {!loading && results.map((product) => {
            const image = product.base_image_url || product.product_colors?.[0]?.image_url;
            const prices = (product.product_variants || []).map(v => Number(v.base_price)).filter(p => p > 0);
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

            return (
              <div
                key={product.id}
                className="search-result-item"
                onClick={() => handleSelect(product.id)}
              >
                <div className="search-result-image">
                  {image ? (
                    <img src={image} alt={getLocalizedField(product, 'name')} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💎</div>
                  )}
                </div>
                <div>
                  <div className="search-result-name">{getLocalizedField(product, 'name')}</div>
                  <div className="search-result-price">{formatPrice(minPrice)}</div>
                </div>
              </div>
            );
          })}

          {!query && (
            <div className="search-no-results" style={{ opacity: 0.5 }}>
              {isRTL() ? 'ابدأ الكتابة للبحث...' : 'Start typing to search...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

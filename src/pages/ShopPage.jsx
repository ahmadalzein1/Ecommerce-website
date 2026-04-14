import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useColors } from '../hooks/useColors';
import useFilterStore from '../stores/filterStore';
import useLanguageStore from '../stores/languageStore';
import ProductCard from '../components/UI/ProductCard';
import SkeletonLoader from '../components/UI/SkeletonLoader';
import useScrollReveal from '../hooks/useScrollReveal';

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { t, isRTL, getLocalizedField } = useLanguageStore();

  const {
    categoryId, colorId, searchQuery, sortBy,
    setCategoryId, setColorId, setSortBy, resetFilters
  } = useFilterStore();

  const { categories } = useCategories();
  const { colors } = useColors();

  const activeCategoryIds = useMemo(() => {
    if (!categoryId || !categories.length) return categoryId;
    
    const findNode = (nodes) => {
      for (let n of nodes) {
        if (n.id === categoryId) return n;
        if (n.children) {
          let found = findNode(n.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const node = findNode(categories);
    if (!node) return categoryId;
    
    let ids = [];
    const getIds = (n) => {
      ids.push(n.id);
      if (n.children) n.children.forEach(getIds);
    };
    getIds(node);
    return ids;
  }, [categoryId, categories]);

  const { products, loading, hasMore } = useProducts({ categoryId: activeCategoryIds, colorId, searchQuery, sortBy, page });

  useScrollReveal([products, loading]);

  // Apply URL params on mount
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategoryId(cat);
  }, [searchParams]);

  const flatCategories = [];
  const flatten = (cats, depth = 0) => {
    cats.forEach((c) => {
      flatCategories.push({ ...c, depth });
      if (c.children) flatten(c.children, depth + 1);
    });
  };
  flatten(categories);

  const handleCategoryClick = (id) => {
    setCategoryId(categoryId === id ? null : id);
    setPage(0);
  };

  const handleColorClick = (id) => {
    setColorId(colorId === id ? null : id);
    setPage(0);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(0);
  };

  const handleReset = () => {
    resetFilters();
    setPage(0);
  };

  const hasFilters = categoryId || colorId;

  const Sidebar = () => (
    <>
      {hasFilters && (
        <button
          className="btn btn-sm btn-outline"
          onClick={handleReset}
          style={{ marginBottom: 'var(--space-lg)', width: '100%' }}
        >
          <X size={14} /> {t('shop.resetFilters')}
        </button>
      )}

      <div className="filter-section">
        <h3 className="filter-title">{t('shop.categories')}</h3>
        <div className="filter-list">
          {flatCategories.map((cat) => (
            <div
              key={cat.id}
              className={`filter-item ${categoryId === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
              style={{ [isRTL() ? 'paddingRight' : 'paddingLeft']: `${16 + cat.depth * 16}px` }}
            >
              {getLocalizedField(cat, 'name')}
              {(cat.name_en?.toLowerCase().includes('girl') || cat.name_ar?.includes('بنات')) && (
                <span style={{ fontSize: '0.85em', opacity: 0.7, margin: '0 4px', display: 'inline-block' }}>
                  {isRTL() ? '(من 1 إلى 14 سنة)' : '(1 to 14 years)'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">{t('shop.colors')}</h3>
        <div className="filter-colors">
          {colors.map((color) => (
            <div
              key={color.id}
              className={`color-swatch color-swatch-lg ${colorId === color.id ? 'active' : ''}`}
              style={{ backgroundColor: color.hex_code }}
              title={getLocalizedField(color, 'name')}
              onClick={() => handleColorClick(color.id)}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="shop-page">
      <div className="container">
        <div className="shop-header">
          <h1 className="section-title reveal reveal-fade-up">{t('shop.title')}</h1>
          <p className="section-subtitle reveal reveal-fade-up" style={{ '--delay': '0.1s' }}>{t('shop.subtitle')}</p>
        </div>

        <div className="shop-layout">
          {/* Desktop Sidebar */}
          <aside className={`shop-sidebar ${mobileFilterOpen ? 'open' : ''}`}>
            <Sidebar />
          </aside>

          {/* Mobile filter overlay */}
          {mobileFilterOpen && (
            <div
              className="mobile-filter-overlay open"
              onClick={() => setMobileFilterOpen(false)}
            />
          )}

          {/* Main Content */}
          <div>
            <div className="shop-toolbar">
              <button
                className="btn btn-outline btn-sm filter-toggle-btn"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              >
                <SlidersHorizontal size={16} /> {t('shop.filters')}
              </button>

              <div className="shop-results-count">
                {products.length} {t('shop.results')}
              </div>

              <div className="shop-sort">
                <select value={sortBy} onChange={handleSortChange}>
                  <option value="newest">{t('shop.sortOptions.newest')}</option>
                  <option value="oldest">{t('shop.sortOptions.oldest')}</option>
                  <option value="price-asc">{t('shop.sortOptions.priceAsc')}</option>
                  <option value="price-desc">{t('shop.sortOptions.priceDesc')}</option>
                  <option value="name-asc">{t('shop.sortOptions.nameAsc')}</option>
                </select>
              </div>
            </div>

            {loading && page === 0 ? (
              <SkeletonLoader count={6} />
            ) : products.length === 0 ? (
              <div className="empty-state">
                <h3>{t('shop.noProducts')}</h3>
                <p>{t('shop.adjustFilters')}</p>
                {hasFilters && (
                  <button className="btn btn-outline" onClick={handleReset} style={{ marginTop: '16px' }}>
                    {t('shop.resetFilters')}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {products.map((product, i) => (
                    <div key={product.id} className={`reveal reveal-fade-up stagger-${(i % 4) + 1}`} style={{ width: '100%' }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="shop-load-more">
                    <button
                      className="btn btn-outline btn-lg"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={loading}
                      style={{ minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {loading ? (
                        <>
                          <div className="spinner sm" />
                          {t('common.loading')}
                        </>
                      ) : t('shop.loadMore')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

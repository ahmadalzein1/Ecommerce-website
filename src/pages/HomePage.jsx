import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, MessageCircle, ChevronDown, Sparkles } from 'lucide-react';
import useLanguageStore from '../stores/languageStore';

const InstagramIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);
import { useFeaturedProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import ProductCard from '../components/UI/ProductCard';
import SkeletonLoader from '../components/UI/SkeletonLoader';
import { INSTAGRAM_URL, DELIVERY_INFO, WHATSAPP_NUMBER } from '../lib/constants';
import { FlagLB } from '../components/UI/FlagIcons';

export default function HomePage() {
  const { products, loading } = useFeaturedProducts();
  const { categories } = useCategories();
  const { t, isRTL, getLocalizedField } = useLanguageStore();

  const getCategoryBackground = (category) => {
    const nameStr = (category.name_en || category.name_ar || '').toLowerCase();
    
    // Girls Fashion
    if (nameStr.includes('girl') || nameStr.includes('بنات')) {
      return 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=600';
    }
    // Princess Dresses
    if (nameStr.includes('princess') || nameStr.includes('أمير')) {
      return 'https://images.unsplash.com/photo-1515488042188-f027effcc715?auto=format&fit=crop&q=80&w=600';
    }
    // Abayas & Kaftans
    if (nameStr.includes('abaya') || nameStr.includes('عباي') || nameStr.includes('قفطان')) {
      return 'https://images.unsplash.com/photo-1621570169561-0f2c418c991e?auto=format&fit=crop&q=80&w=600';
    }
    // Women / Default luxury style
    return 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600';
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="hero-pattern" />
        <div className="hero-content animate-fade-in-up">
          <div className="hero-badge">
            <Sparkles size={16} /> {t('common.tagline')}
          </div>
          <h1 className="hero-title">
            {isRTL() ? (
              <>أناقة في<br />كل <span>التفاصيل</span></>
            ) : (
              <>Elegance in<br />Every <span>Detail</span></>
            )}
          </h1>
          <p className="hero-subtitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {t('home.heroSubtitle')}
            <FlagLB size={20} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn-gold btn-lg">
              {t('home.shopCollection')} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="hero-scroll-indicator">
          <ChevronDown size={24} color="rgba(255,255,255,0.6)" />
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section style={{ padding: 'var(--space-3xl) 0' }}>
          <div className="container">
            <h2 className="section-title">{t('home.shopByCategory')}</h2>
            <p className="section-subtitle">{t('home.findExactly')}</p>
            <div className="category-grid">
              {categories.map((cat, i) => (
                <Link
                  to={`/shop?category=${cat.id}`}
                  key={cat.id}
                  className="category-card"
                  id={`category-${cat.id}`}
                >
                  <div 
                    className="category-card-bg"
                    style={{ 
                      backgroundImage: `url(${getCategoryBackground(cat)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <div className="category-card-name">
                    {getLocalizedField(cat, 'name')}
                    {cat.children?.length > 0 && (
                      <div className="category-card-count">
                        {cat.children.length} {isRTL() ? 'فئات فرعية' : 'Subcategories'}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section style={{ padding: 'var(--space-3xl) 0' }}>
        <div className="container">
          <h2 className="section-title">{t('home.newArrivals')}</h2>
          <p className="section-subtitle">{t('home.latestAdditions')}</p>

          {loading ? (
            <SkeletonLoader count={4} />
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!loading && products.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
              <Link to="/shop" className="btn btn-outline btn-lg">
                {t('home.viewAll')} <ArrowRight size={18} />
              </Link>
            </div>
          )}

        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon">
                <Truck size={26} />
              </div>
              <div>
                <div className="trust-title">{t('home.trust.delivery')}</div>
                <div className="trust-desc">{t('home.trust.deliveryDesc')}</div>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <ShieldCheck size={26} />
              </div>
              <div>
                <div className="trust-title">{t('home.trust.quality')}</div>
                <div className="trust-desc">{t('home.trust.qualityDesc')}</div>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <MessageCircle size={26} />
              </div>
              <div>
                <div className="trust-title">{t('home.trust.support')}</div>
                <div className="trust-desc">{t('home.trust.supportDesc')}</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="insta-section">
        <div className="container">
          <h2 className="section-title">{t('home.instagram.follow')}</h2>
          <p className="section-subtitle">{t('home.instagram.join')}</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="insta-link"
          >
            <InstagramIcon size={24} /> @zeiin_shop <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </main>
  );
}

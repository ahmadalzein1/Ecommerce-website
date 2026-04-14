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
import useScrollReveal from '../hooks/useScrollReveal';

export default function HomePage() {
  const { products, loading } = useFeaturedProducts();
  const { categories } = useCategories();
  const { t, isRTL, getLocalizedField } = useLanguageStore();

  useScrollReveal([products, categories, loading]);

  const getCategoryBackground = (category) => {
    const nameStr = (category.name_en || category.name_ar || '').toLowerCase();
    
    // Girls or Kids Fashion
    if (nameStr.includes('girl') || nameStr.includes('بنت') || nameStr.includes('kids') || nameStr.includes('أطفال') || nameStr.includes('اطفال')) {
      return 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=600';
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
            <h2 className="section-title reveal reveal-fade-up">{t('home.shopByCategory')}</h2>
            <p className="section-subtitle reveal reveal-fade-up" style={{ '--delay': '0.1s' }}>{t('home.findExactly')}</p>
            <div className="category-grid">
              {categories.map((cat, i) => (
                <Link
                  to={`/shop?category=${cat.id}`}
                  key={cat.id}
                  className={`category-card reveal reveal-zoom-in stagger-${(i % 6) + 1}`}
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
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <span>{getLocalizedField(cat, 'name')}</span>
                      {(cat.name_en?.toLowerCase().includes('girl') || 
                        cat.name_ar?.includes('بنات') || 
                        cat.name_ar?.includes('بنت') ||
                        cat.name_en?.toLowerCase().includes('kids') || 
                        cat.name_ar?.includes('أطفال') ||
                        cat.name_ar?.includes('اطفال')) && (
                        <span style={{ fontSize: '0.65em', opacity: 0.9, fontWeight: 500 }}>
                          {isRTL() ? '(من 1 إلى 14 سنة)' : '(1-14 years)'}
                        </span>
                      )}
                    </div>
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
          <h2 className="section-title reveal reveal-fade-up">{t('home.newArrivals')}</h2>
          <p className="section-subtitle reveal reveal-fade-up" style={{ '--delay': '0.1s' }}>{t('home.latestAdditions')}</p>

          {loading ? (
            <SkeletonLoader count={4} />
          ) : (
            <div className="product-grid">
              {products.map((product, i) => (
                <div key={product.id} className={`reveal reveal-fade-up stagger-${(i % 4) + 1}`} style={{ width: '100%' }}>
                  <ProductCard product={product} />
                </div>
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
            <div className="trust-item reveal reveal-fade-up stagger-1">
              <div className="trust-icon">
                <Truck size={26} />
              </div>
              <div>
                <div className="trust-title">{t('home.trust.delivery')}</div>
                <div className="trust-desc">{t('home.trust.deliveryDesc')}</div>
              </div>
            </div>
            <div className="trust-item reveal reveal-fade-up stagger-2">
              <div className="trust-icon">
                <ShieldCheck size={26} />
              </div>
              <div>
                <div className="trust-title">{t('home.trust.quality')}</div>
                <div className="trust-desc">{t('home.trust.qualityDesc')}</div>
              </div>
            </div>
            <div className="trust-item reveal reveal-fade-up stagger-3">
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
          <h2 className="section-title reveal reveal-fade-up">{t('home.instagram.follow')}</h2>
          <p className="section-subtitle reveal reveal-fade-up" style={{ '--delay': '0.1s' }}>{t('home.instagram.join')}</p>
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

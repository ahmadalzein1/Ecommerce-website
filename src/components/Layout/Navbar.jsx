import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import useCartStore from '../../stores/cartStore';
import useLanguageStore from '../../stores/languageStore';
import SearchModal from '../UI/SearchModal';

const DiamondLogo = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4L34 18L20 36L6 18L20 4Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M20 10L28 18L20 30L12 18L20 10Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M20 16L23 18L20 24L17 18L20 16Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguageStore();
  const nextLang = language === 'ar' ? 'en' : 'ar';
  
  return (
    <button 
      className="navbar-action-btn lang-btn" 
      onClick={() => setLanguage(nextLang)}
      aria-label="Toggle Language"
      style={{ fontWeight: 'bold', fontSize: '13px' }}
    >
      {language === 'ar' ? 'EN' : 'عربي'}
    </button>
  );
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { isCartOpen, openCart, getItemCount } = useCartStore();
  const { t } = useLanguageStore();
  const location = useLocation();
  const itemCount = getItemCount();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', mobileOpen);
    return () => document.body.classList.remove('no-scroll');
  }, [mobileOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`navbar glass ${scrolled ? 'scrolled' : ''}`} style={{
        boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.75)',
        position: 'sticky',
        top: 0
      }}>
        <div className="navbar-inner">
          <div className="navbar-mobile-start">
            <button
              className={`mobile-menu-btn ${mobileOpen ? 'open' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>

          <Link to="/" className="navbar-logo">
            <DiamondLogo />
            <span>{t('common.shopName')}</span>
          </Link>

          <div className="navbar-links">
            <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>{t('nav.home')}</Link>
            <Link to="/shop" className={`navbar-link ${isActive('/shop') ? 'active' : ''}`}>{t('nav.shop')}</Link>
            <Link to="/checkout" className={`navbar-link ${isActive('/checkout') ? 'active' : ''}`}>{t('nav.checkout')}</Link>
          </div>

          <div className="navbar-actions">
            <LanguageToggle />
            <button className="navbar-action-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={20} />
            </button>
            <button className="navbar-action-btn" onClick={openCart} aria-label="Cart">
              <ShoppingBag size={20} />
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-menu-overlay open" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-menu-links">
          <Link to="/" className={`mobile-menu-link ${isActive('/') ? 'active' : ''}`}>{t('nav.home')}</Link>
          <Link to="/shop" className={`mobile-menu-link ${isActive('/shop') ? 'active' : ''}`}>{t('nav.shop')}</Link>
          <Link to="/checkout" className={`mobile-menu-link ${isActive('/checkout') ? 'active' : ''}`}>{t('nav.checkout')}</Link>
        </div>
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}

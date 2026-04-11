import { Link } from 'react-router-dom';
import { MessageCircle, Mail, MapPin } from 'lucide-react';
import useLanguageStore from '../../stores/languageStore';

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);
import { STORE_NAME, INSTAGRAM_URL, WHATSAPP_NUMBER, ADMIN_EMAIL } from '../../lib/constants';

export default function Footer() {
  const { t, isRTL } = useLanguageStore();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-brand-name">
              💎 {t('common.shopName')}
            </div>
            <p className="footer-brand-desc">
              {isRTL() 
                ? 'أزياء راقية وعصرية للمرأة التي تبحث عن الأناقة. قطع بجودة عالية مع توصيل لكافة أنحاء لبنان.'
                : 'Premium and modern fashion for the woman seeking elegance. High-quality pieces with delivery to all of Lebanon.'
              }
            </p>
            <div className="footer-social">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramIcon size={18} />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>{isRTL() ? 'روابط سريعة' : 'Quick Links'}</h4>
            <ul>
              <li><Link to="/">{t('nav.home')}</Link></li>
              <li><Link to="/shop">{isRTL() ? 'تسوق الآن' : 'Shop Now'}</Link></li>
              <li><Link to="/checkout">{t('nav.checkout')}</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>{isRTL() ? 'المساعدة' : 'Help'}</h4>
            <ul>
              <li><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">{isRTL() ? 'تابعنا على إنستقرام' : 'Follow us on Instagram'}</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>{isRTL() ? 'معلومات' : 'Information'}</h4>
            <ul>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                <MapPin size={14} /> {isRTL() ? 'توصيل لجميع أنحاء لبنان' : 'Delivery to all over Lebanon'}
              </li>

              <li style={{ opacity: 0.7 }}>{t('common.cod')}</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom" style={{ flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <span>© {new Date().getFullYear()} {t('common.shopName')}. {t('common.allRightsReserved')}</span>
          <span style={{ fontSize: '0.9rem', color: '#ffffff', opacity: 0.95, display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', fontWeight: '500' }}>
            <span style={{ opacity: 0.8 }}>{isRTL() ? 'تطوير وبرمجة:' : 'Developed by:'}</span>{' '}
            <a href="https://linkedin.com/in/ahmad-al-zein-4b9054386" target="_blank" rel="noopener noreferrer" style={{ color: '#ffffff', fontWeight: 'bold', textDecoration: 'underline' }}>
              Ahmad Al Zein
            </a>
            <span style={{ opacity: 0.5 }}>|</span>
            <a href="mailto:zeinahmad763@gmail.com" style={{ color: '#ffffff', textDecoration: 'underline' }}>
              zeinahmad763@gmail.com
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

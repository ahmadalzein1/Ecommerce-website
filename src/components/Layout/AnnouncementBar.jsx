import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';
import useLanguageStore from '../../stores/languageStore';
import { FlagLB, FlagTR } from '../UI/FlagIcons';

export default function AnnouncementBar() {
  const { t, isRTL } = useLanguageStore();

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="announcement-bar"
    >
      <div className="container">
        <div className="announcement-content">
          <Truck size={14} />
          <span>
            {isRTL() ? (
              <>شحن ممتاز: يستغرق توصيل الطلبات من 10 إلى 12 يوماً (من تركيا <FlagTR size={16} /> إلى لبنان <FlagLB size={16} />)</>
            ) : (
              <>Premium Shipping: Orders take 10-12 days (from Turkey <FlagTR size={16} /> to Lebanon <FlagLB size={16} />)</>
            )}
          </span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .announcement-bar {
          background: #0f172a;
          color: white;
          padding: 8px 0;
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
          position: relative;
          z-index: 1001;
        }
        .announcement-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          letter-spacing: 0.2px;
        }
        [dir="rtl"] .announcement-content {
          font-family: 'Tajawal', sans-serif;
        }
        @media (max-width: 600px) {
          .announcement-bar {
            font-size: 0.7rem;
            padding: 6px 15px;
          }
        }
      ` }} />
    </motion.div>
  );
}

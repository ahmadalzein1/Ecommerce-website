import { Plus, Edit3, Trash2, ImageIcon, ChevronRight, BarChart2, DollarSign, ShoppingBag, Users, Clock, Mail, AlertCircle, CheckCircle, WifiOff, Loader2, X } from 'lucide-react';

export const AdminProLoader = ({ message, language }) => (
  <div className="pro-loader-container">
    <div className="pro-loader-content">
      <div className="spinner-glow">
        <Loader2 className="animate-spin" size={40} />
      </div>
      <h3>{message || (language === 'ar' ? 'جاري التحميل...' : 'Loading...')}</h3>
      <p>{language === 'ar' ? 'يرجى الانتظار قليلاً، نقوم بتجهيز البيانات لك' : 'Please wait while we prepare your data'}</p>
    </div>
    <style dangerouslySetInnerHTML={{ __html: `
      .pro-loader-container {
        position: fixed; inset: 0; background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
      }
      .pro-loader-content { text-align: center; }
      .spinner-glow {
        color: #fbbf24; margin-bottom: 20px; display: inline-flex;
        padding: 20px; background: white; border-radius: 24px;
        box-shadow: 0 10px 40px rgba(251, 191, 36, 0.15);
      }
      .pro-loader-content h3 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
      .pro-loader-content p { color: #64748b; font-weight: 500; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `}} />
  </div>
);

export const AdminToastStack = ({ toasts, onClose }) => (
  <div className="admin-toast-stack">
    {toasts.map(toast => (
      <AdminToast key={toast.id} {...toast} onClose={() => onClose(toast.id)} />
    ))}
    <style dangerouslySetInnerHTML={{ __html: `
      .admin-toast-stack {
        position: fixed; top: 24px; right: 24px; z-index: 10001;
        display: flex; flex-direction: column; align-items: flex-end;
      }
    `}} />
  </div>
);

export const AdminToast = ({ type = 'info', message, language, onClose }) => (
  <div className={`admin-toast animate-slide-in ${type}`}>
    <div className="toast-icon">
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
    </div>
    <div className="toast-body">
      <span className="toast-msg">{message}</span>
    </div>
    <button className="toast-close" onClick={onClose}><X size={14} /></button>
    <style dangerouslySetInnerHTML={{ __html: `
      .admin-toast {
        min-width: 300px; max-width: 450px; padding: 16px 20px; border-radius: 20px;
        background: white; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        display: flex; align-items: center; gap: 14px; position: relative;
        border: 1px solid #f1f5f9; margin-bottom: 12px;
      }
      .admin-toast.success { border-left: 4px solid #10b981; }
      .admin-toast.error { border-left: 4px solid #ef4444; }
      .toast-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
      .success .toast-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      .error .toast-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
      .toast-msg { font-size: 0.9rem; font-weight: 700; color: #1e293b; }
      .toast-close { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; }
      .animate-slide-in { animation: slideInStack 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      @keyframes slideInStack { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    `}} />
  </div>
);

export const OfflineBanner = ({ language }) => (
  <div className="offline-banner">
    <WifiOff size={18} />
    <span>{language === 'ar' ? 'لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة.' : 'No internet connection. Please check your network.'}</span>
    <style dangerouslySetInnerHTML={{ __html: `
      .offline-banner {
        background: #0f172a; color: white; padding: 12px 24px;
        display: flex; align-items: center; justify-content: center; gap: 12px;
        font-weight: 700; font-size: 0.9rem; z-index: 10000; position: sticky; top: 0;
        animation: slideDown 0.3s ease;
      }
      @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
    `}} />
  </div>
);

export const en = (val) => {
  if (val === undefined || val === null) return '';
  return val.toLocaleString('en-US', { useGrouping: false });
};

export const formatEnPrice = (amount) => {
  return `$${Number(amount).toFixed(2)}`;
};

export const statusLabels = {
  pending: 'قيد الانتظار',
  delivering: 'جاري التوصيل',
  received_paid: 'تم الدفع',
  canceled: 'ملغى',
  expired: 'منتهي',
};

export const statusLabelsEn = {
  pending: 'Pending',
  delivering: 'Delivering',
  received_paid: 'Paid',
  canceled: 'Canceled',
  expired: 'Expired',
};

export const StatCard = ({ icon: Icon, label, value, trend, trendLabel, colorClass }) => (
  <div className={`stat-card-new ${colorClass}`}>
    <div className="stat-card-inner">
      <div className={`stat-icon-wrapper ${colorClass}`}>
        <Icon size={22} />
      </div>
      <div className="stat-data-cluster">
        <span className="stat-label-modern">{label}</span>
        <div className="stat-value-group">
          <h3 className="stat-value-modern">{value}</h3>
          {trend && (
            <span className={`stat-trend-chip ${trend.startsWith('+') ? 'up' : 'down'}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const AdminConfirmModal = ({ isOpen, title, message, itemName, onConfirm, onCancel, language, type = 'danger', loading = false }) => {
  if (!isOpen) return null;
  return (
    <div className="admin-confirm-overlay">
      <div className="admin-confirm-card animate-scale-up">
        <div className="confirm-icon-area">
          <div className={`confirm-icon-glow ${type}`}>
            <Trash2 size={24} className={loading ? 'animate-spin' : ''} />
          </div>
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        
        {itemName && (
          <div className="item-to-delete-badge">
            <span className="item-name">{itemName}</span>
          </div>
        )}

        <div className="confirm-actions">
          <button className="confirm-btn-secondary" onClick={onCancel} disabled={loading}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button className={`confirm-btn-primary ${type}`} onClick={onConfirm} disabled={loading}>
            {loading ? (language === 'ar' ? 'جاري التنفيذ...' : 'Processing...') : (language === 'ar' ? 'تأكيد' : 'Confirm')}
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .item-to-delete-badge {
          background: #f8fafc; border: 1px dashed #e2e8f0; padding: 12px 20px;
          border-radius: 16px; margin-bottom: 30px; display: inline-block; width: 100%;
        }
        .item-name { font-weight: 800; color: #0f172a; font-size: 1.1rem; }
      `}} />
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Users, ShoppingBag, BarChart2, Package, 
  Clock, AlertCircle, Loader2, MapPin, Phone, 
  ChevronRight, CheckCircle2, Truck, AlertTriangle, DollarSign
} from 'lucide-react';
import { formatEnPrice, statusLabels, statusLabelsEn } from './AdminCommon';

export const OrderIntelligenceModal = ({ 
  order, isOpen, onClose, onUpdateStatus, updatingId, language, onNotify 
}) => {
  const isAR = language === 'ar';
  
  const isUpdating = updatingId === order.id;
  if (!isOpen || !order) return null;

  // Defensive data extraction helper
  const getSingle = (val) => Array.isArray(val) ? val[0] : val;

  const totalNetProfit = (order.order_items || []).reduce((acc, item) => 
    acc + ((item.price_at_purchase - (item.cost_price_at_purchase || 0)) * item.quantity), 0);

  const formatDate = (dateStr) => {
    return new Intl.DateTimeFormat(isAR ? 'ar-EG' : 'en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr));
  };

  const statusIcons = {
    pending: <Clock size={16} />,
    delivering: <Truck size={16} />,
    received_paid: <CheckCircle2 size={16} />,
    canceled: <X size={16} />,
    expired: <AlertTriangle size={16} />
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`intel-modal-overlay ${isUpdating ? 'intel-locked' : ''}`} 
      onClick={isUpdating ? null : onClose}
    >
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        className="intel-modal-card" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Glassmorphism */}
        <div className="intel-modal-header">
          <div className="header-left">
            <div className="order-id-chip">
              <span className="id-label">#</span>
              <code>{order.id.slice(0, 8)}</code>
            </div>
            <h2 className="modal-title">{isAR ? 'تفاصيل ومعالجة الطلب' : 'Order Intelligence'}</h2>
          </div>
          <button 
            className="intel-close-btn" 
            onClick={onClose}
            disabled={isUpdating}
          >
            {isUpdating ? <Loader2 size={24} className="animate-spin" /> : <X size={24} />}
          </button>
        </div>

        <div className="intel-modal-body custom-scrollbar">
          {/* Timeline / Date */}
          <div className="intel-date-banner">
            <Clock size={18} />
            <span>{isAR ? 'تاريخ المعاملة:' : 'Transaction Date:'} <strong>{formatDate(order.created_at)}</strong></span>
          </div>

          <div className="intel-main-grid">
            {/* Left: Customer & Logic */}
            <div className="intel-side-col">
              <div className="intel-section-box">
                <div className="box-header">
                  <Users size={18} />
                  <h3>{isAR ? 'ملف العميل' : 'Customer Profile'}</h3>
                </div>
                <div className="customer-info-stack">
                  <div className="info-item">
                    <span className="i-label">{isAR ? 'الاسم بالكامل' : 'Full Name'}</span>
                    <span className="i-value">{order.customer_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="i-label">{isAR ? 'رقم الهاتف' : 'Contact Phone'}</span>
                    <div className="i-value phone-group">
                      <Phone size={14} />
                      <code>{order.customer_phone}</code>
                    </div>
                  </div>
                  <div className="info-item address-item">
                    <span className="i-label">{isAR ? 'عنوان التوصيل' : 'Delivery Address'}</span>
                    <div className="address-box">
                      <MapPin size={16} />
                      <p>{order.address || (isAR ? 'لا يوجد عنوان' : 'No address provided')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Controller 2.0 (Dropdown version) */}
              <div className="intel-section-box status-controller">
                <div className="box-header">
                  <AlertCircle size={18} />
                  <h3>{isAR ? 'التحكم بالحالة' : 'Status Control'}</h3>
                </div>
                
                <div className="modern-dropdown-wrapper">
                  <div className={`status-icon-pill ${order.status}`}>
                    {statusIcons[order.status]}
                  </div>
                  <select 
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => onUpdateStatus(order, e.target.value)}
                    className={`premium-select ${order.status}`}
                  >
                    {Object.keys(statusLabels).map(s => (
                      <option key={s} value={s}>
                        {isAR ? statusLabels[s] : statusLabelsEn[s]}
                      </option>
                    ))}
                  </select>
                  <div className="select-arrow">
                    {updatingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={18} className="arrow-down" />}
                  </div>
                </div>

                <div className="status-warning">
                  <AlertTriangle size={14} />
                  <span>{isAR ? 'تغيير الحالة يؤثر على المخزون تلقائياً.' : 'Status changes auto-sync inventory.'}</span>
                </div>
              </div>
            </div>

            {/* Right: Items and Economics */}
            <div className="intel-main-col">
              <div className="intel-section-box items-box">
                <div className="box-header">
                  <ShoppingBag size={18} />
                  <h3>{isAR ? 'محتويات الطلب' : 'Ordered Items'}</h3>
                </div>
                <div className="intel-items-list">
                  {order.order_items?.map((item, idx) => {
                    const variant = getSingle(item.variant);
                    const product = getSingle(variant?.product);
                    const colorMap = getSingle(variant?.color_map);
                    const colorInfo = getSingle(colorMap?.color_info);
                    const itemImageUrl = colorMap?.image_url || product?.base_image_url;
                    
                    const productName = isAR ? product?.name_ar : product?.name_en;
                    const colorName = isAR ? colorInfo?.name_ar : colorInfo?.name_en;
                    const profit = (item.price_at_purchase - (item.cost_price_at_purchase || 0)) * item.quantity;

                    return (
                      <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx} 
                        className="intel-product-card"
                      >
                        <div className="p-image-wrap">
                          {itemImageUrl ? (
                            <img src={itemImageUrl} alt={productName} />
                          ) : (
                            <div className="p-img-placeholder"><Package size={24} /></div>
                          )}
                          <div className="p-qty-tag">{item.quantity}x</div>
                        </div>
                        <div className="p-details">
                          <h4 className="p-name">{productName || (isAR ? 'منتج غير معروف' : 'Unknown Product')}</h4>
                          <div className="p-specs">
                            {variant?.size && <span className="spec-chip">Size: {variant.size}</span>}
                            {colorName && (
                              <span className="spec-chip color">
                                <span className="dot" style={{ background: colorInfo?.hex_code }} />
                                {colorName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-pricing">
                          <div className="p-gross">{formatEnPrice(item.price_at_purchase * item.quantity)}</div>
                          <div className="p-profit">+{formatEnPrice(profit)} {isAR ? 'ربح' : 'profit'}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Economic Summary */}
              <div className="intel-economics">
                <div className="eco-row">
                  <span>{isAR ? 'إجمالي المبيعات' : 'Gross Sales'}</span>
                  <span>{formatEnPrice(order.total_amount)}</span>
                </div>
                <div className="eco-total">
                  <div className="eco-label">
                    <DollarSign size={20} />
                    <span>{isAR ? 'صافي أرباح الطلب' : 'Total Net Profit'}</span>
                  </div>
                  <div className="eco-value">{formatEnPrice(totalNetProfit)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .intel-modal-overlay {
            position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            z-index: 10000; display: flex; align-items: center; justify-content: center;
            padding: 20px;
          }
          .intel-modal-card {
            background: #ffffff; width: 100%; max-width: 1000px; max-height: 90vh;
            border-radius: 32px; box-shadow: 0 30px 60px -12px rgba(15, 23, 42, 0.2);
            overflow: hidden; display: flex; flex-direction: column;
            border: 1px solid white;
          }
          
          /* Header */
          .intel-modal-header {
            padding: 24px 32px; background: rgba(255,255,255,0.8);
            backdrop-filter: blur(10px); border-bottom: 1px solid #f1f5f9;
            display: flex; justify-content: space-between; align-items: center;
          }
          .header-left { display: flex; align-items: center; gap: 16px; }
          .order-id-chip {
            background: #eff6ff; padding: 6px 14px; border-radius: 12px;
            display: flex; align-items: center; gap: 6px; color: #3b82f6;
            font-weight: 800; border: 1px solid rgba(59,130,246,0.1);
          }
          .id-label { font-size: 0.7rem; opacity: 0.6; }
          .modal-title { font-size: 1.25rem; font-weight: 900; color: #0f172a; margin: 0; }
          .intel-close-btn { 
            background: #f1f5f9; border: none; width: 44px; height: 44px;
            border-radius: 14px; display: flex; align-items: center; justify-content: center;
            color: #64748b; cursor: pointer; transition: all 0.2s;
          }
          .intel-close-btn:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
          .intel-close-btn:disabled { 
            opacity: 0.5; cursor: wait; transform: none !important;
            background: #f1f5f9; color: #94a3b8;
          }
          .intel-locked { cursor: wait; }

          /* Body */
          .intel-modal-body { padding: 32px; overflow-y: auto; flex: 1; }
          .intel-date-banner {
            display: flex; align-items: center; gap: 10px; padding: 14px 20px;
            background: #f8fafc; border-radius: 16px; margin-bottom: 32px;
            font-size: 0.9rem; color: #64748b; border: 1px solid #f1f5f9;
          }
          .intel-date-banner strong { color: #0f172a; margin-inline-start: 4px; }

          .intel-main-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 32px; }
          @media (max-width: 900px) { .intel-main-grid { grid-template-columns: 1fr; } }

          /* Section Boxes */
          .intel-section-box { margin-bottom: 24px; }
          .box-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; color: #94a3b8; }
          .box-header h3 { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }

          /* Customer Info */
          .customer-info-stack { 
            background: #f8fafc; padding: 24px; border-radius: 24px;
            display: flex; flex-direction: column; gap: 20px;
            border: 1px solid #f1f5f9;
          }
          .info-item { display: flex; flex-direction: column; gap: 6px; }
          .i-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
          .i-value { font-weight: 800; color: #0f172a; font-size: 1rem; }
          .phone-group { display: flex; align-items: center; gap: 8px; color: #3b82f6; }
          .address-box { 
            display: flex; gap: 10px; padding: 14px; background: white;
            border-radius: 16px; border: 1px solid #f1f5f9; margin-top: 4px;
          }
          .address-box p { margin: 0; font-size: 0.85rem; line-height: 1.5; color: #475569; font-weight: 600; }

          /* Status Controller (Dropdown version) */
          .modern-dropdown-wrapper {
            position: relative; display: flex; align-items: center;
            background: #ffffff; border: 2px solid #f1f5f9; border-radius: 20px;
            padding: 4px; gap: 4px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          }
          .modern-dropdown-wrapper:focus-within {
            border-color: #3b82f6; box-shadow: 0 8px 24px rgba(59, 130, 246, 0.08);
          }
          .status-icon-pill {
            width: 44px; height: 44px; border-radius: 16px; 
            display: flex; align-items: center; justify-content: center;
            color: white; transition: all 0.3s;
          }
          .status-icon-pill.pending { background: #f59e0b; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); }
          .status-icon-pill.delivering { background: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2); }
          .status-icon-pill.received_paid { background: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
          .status-icon-pill.canceled { background: #ef4444; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
          .status-icon-pill.expired { background: #64748b; box-shadow: 0 4px 12px rgba(100, 116, 139, 0.2); }

          .premium-select {
            flex: 1; border: none; background: transparent; padding: 12px 16px;
            font-size: 0.95rem; font-weight: 800; color: #0f172a; cursor: pointer;
            appearance: none; outline: none; z-index: 2;
          }
          .select-arrow {
            padding-inline-end: 20px; color: #94a3b8; pointer-events: none;
            display: flex; align-items: center;
          }
          .arrow-down { transform: rotate(90deg); }

          .status-warning { 
            display: flex; align-items: center; gap: 8px; margin-top: 14px;
            color: #94a3b8; font-size: 0.75rem; font-weight: 600; padding: 0 4px;
          }

          /* Product Cards */
          .intel-items-list { display: flex; flex-direction: column; gap: 16px; }
          .intel-product-card {
            display: grid; grid-template-columns: 80px 1fr auto; align-items: center; gap: 20px;
            padding: 16px; background: white; border-radius: 24px;
            border: 1px solid #f1f5f9; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .intel-product-card:hover { transform: scale(1.02); box-shadow: 0 10px 25px rgba(0,0,0,0.03); border-color: #e2e8f0; }
          
          .p-image-wrap { position: relative; width: 80px; height: 80px; }
          .p-image-wrap img { width: 100%; height: 100%; object-fit: cover; border-radius: 18px; }
          .p-img-placeholder { width: 100%; height: 100%; background: #f8fafc; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; }
          .p-qty-tag {
            position: absolute; top: -10px; right: -10px; background: #0f172a;
            color: white; font-size: 0.7rem; font-weight: 900; padding: 4px 10px;
            border-radius: 10px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }

          .p-details { display: flex; flex-direction: column; gap: 6px; }
          .p-name { margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a; }
          .p-specs { display: flex; gap: 8px; flex-wrap: wrap; }
          .spec-chip { 
            background: #f1f5f9; padding: 4px 10px; border-radius: 8px;
            font-size: 0.7rem; font-weight: 700; color: #64748b; 
            display: flex; align-items: center; gap: 6px; border: 1px solid rgba(0,0,0,0.03);
          }
          .color-dot { width: 8px; height: 8px; border-radius: 50%; }

          .p-pricing { text-align: right; }
          .p-gross { font-weight: 900; font-size: 1.1rem; color: #0f172a; }
          .p-profit { color: #10b981; font-size: 0.75rem; font-weight: 800; }

          /* Economics */
          .intel-economics { 
            margin-top: 32px; padding: 32px; border-radius: 32px;
            background: #0f172a; color: white; display: flex; flex-direction: column; gap: 24px;
            box-shadow: 0 20px 40px -10px rgba(15,23,42,0.3);
          }
          .eco-row { display: flex; justify-content: space-between; font-size: 1rem; color: #94a3b8; font-weight: 600; }
          .eco-total { 
            display: flex; justify-content: space-between; align-items: center;
            padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);
          }
          .eco-label { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 1.25rem; }
          .eco-value { font-size: 1.75rem; font-weight: 900; color: #fbbf24; text-shadow: 0 0 20px rgba(251,191,36,0.3); }

          /* Scrollbar */
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

          @media (max-width: 600px) {
            .intel-modal-card { max-height: 100vh; height: 100%; border-radius: 0; }
            .intel-modal-body { padding: 24px; }
            .intel-product-card { grid-template-columns: 60px 1fr; }
            .p-pricing { grid-column: span 2; text-align: left; padding-top: 10px; border-top: 1px dashed #f1f5f9; }
            .eco-value { font-size: 1.5rem; }
          }
        ` }} />
      </motion.div>
    </motion.div>
  );
};

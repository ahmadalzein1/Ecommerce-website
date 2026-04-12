import { Plus, Edit3, Trash2, ImageIcon, ChevronRight, BarChart2, DollarSign, ShoppingBag, Users, Clock, Mail } from 'lucide-react';

export const en = (val) => {
  if (val === undefined || val === null) return '';
  return val.toLocaleString('en-US', { useGrouping: false });
};

export const formatEnPrice = (amount) => {
  return `$${Number(amount).toFixed(2)}`;
};

export const statusLabels = {
  pending: 'قيد الانتظار',
  delivering: 'قيد التوصيل',
  paid: 'مدفوع',
  cancelled: 'ملغى',
  expired: 'منتهي',
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

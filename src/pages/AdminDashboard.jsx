import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Users, DollarSign, Package, 
  Search, Filter, ExternalLink, LogOut,
  ChevronRight, ArrowUpRight, TrendingUp, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../stores/authStore';
import { formatPrice } from '../lib/constants';

const statusLabels = {
  pending: 'قيد الانتظار',
  delivering: 'قيد التوصيل',
  paid: 'مدفوع',
  cancelled: 'ملغى',
  expired: 'منتهي',
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;
      setOrders(orderData || []);

      // Calculate Stats
      const totalRev = orderData?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0;
      const uniqueCustomers = new Set(orderData?.map(o => o.customer_phone)).size;

      setStats({
        totalOrders: orderData?.length || 0,
        revenue: totalRev,
        customers: uniqueCustomers
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleUpdateStatus = async (order, newStatus) => {
    if (!order) return;
    const oldStatus = order.status;
    if (oldStatus === newStatus) return;

    setUpdatingId(order.id);
    try {
      // Define groups
      const deductedGroup = ['delivering', 'paid'];
      const notDeductedGroup = ['pending', 'cancelled', 'expired'];

      const wasDeducted = deductedGroup.includes(oldStatus);
      const shouldBeDeducted = deductedGroup.includes(newStatus);

      let stockError = null;

      // Logic: Transitioning between groups
      if (shouldBeDeducted && !wasDeducted) {
        // MOVING TO DEDUCTED: Deduct stock for each item
        for (const item of order.order_items) {
          const { error: err } = await supabase.rpc('decrement_stock', {
            variant_id: item.product_variant_id,
            qty: item.quantity
          });
          if (err) stockError = err;
        }
      } else if (!shouldBeDeducted && wasDeducted) {
        // MOVING TO NOT DEDUCTED: Revert stock
        for (const item of order.order_items) {
          // Manual fallback for incrementing since no RPC exists
          const { data: variant } = await supabase
            .from('product_variants')
            .select('stock_quantity')
            .eq('id', item.product_variant_id)
            .single();

          if (variant) {
            await supabase
              .from('product_variants')
              .update({ stock_quantity: variant.stock_quantity + item.quantity })
              .eq('id', item.product_variant_id);
          }
        }
      }

      // Update Order Status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (updateError) throw updateError;
      if (stockError) console.error('Stock error during transition:', stockError);

      // Refresh data
      await fetchData();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...order, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please check your connection.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="admin-logo">💎 Zein Admin</div>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <TrendingUp size={18} /> نظرة عامة
          </a>
          <a href="#" className="nav-item">
            <ShoppingBag size={18} /> الطلبات
          </a>
          <a href="#" className="nav-item">
            <Package size={18} /> المنتجات
          </a>
          <a href="#" className="nav-item">
            <Users size={18} /> العملاء
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.email?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <span>المدير</span>
              <small>{user?.email}</small>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-search">
            <Search size={18} />
            <input type="text" placeholder="البحث عن طلبات، عملاء..." />
          </div>
          <div className="header-actions">
            <button className="btn btn-outline btn-sm">تنزيل التقرير</button>
            <div className="admin-date">
              <Clock size={16} /> {new Date().toLocaleDateString('ar-LB')}
            </div>
          </div>
        </header>

        <div className="admin-content">
          <h1 className="admin-title">نظرة عامة</h1>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple"><ShoppingBag size={20} /></div>
              <div className="stat-data">
                <span className="stat-label">إجمالي الطلبات</span>
                <h3 className="stat-value">{stats.totalOrders}</h3>
              </div>
              <div className="stat-trend positive">+12% <ArrowUpRight size={14} /></div>
            </div>

            <div className="stat-card">
              <div className="stat-icon gold"><DollarSign size={20} /></div>
              <div className="stat-data">
                <span className="stat-label">إجمالي الإيرادات</span>
                <h3 className="stat-value">{formatPrice(stats.revenue)}</h3>
              </div>
              <div className="stat-trend positive">+8% <ArrowUpRight size={14} /></div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue"><Users size={20} /></div>
              <div className="stat-data">
                <span className="stat-label">العملاء النشطون</span>
                <h3 className="stat-value">{stats.customers}</h3>
              </div>
              <div className="stat-trend positive">+5% <ArrowUpRight size={14} /></div>
            </div>
          </div>

          {/* Orders Section */}
          <section className="admin-section">
            <div className="section-header">
              <h2>الطلبات الأخيرة</h2>
              <button className="view-all">عرض الكل <ChevronRight size={16} /></button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الطلب</th>
                    <th>العميل</th>
                    <th>التاريخ</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="skeleton-row">
                        <td colSpan={6}><div className="skeleton-bar" /></td>
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                        لا توجد طلبات بعد
                      </td>
                    </tr>
                  ) : orders.map((order) => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                      <td>#{order.id.slice(0, 8)}</td>
                      <td>
                        <div className="table-user">
                          <span className="user-name">{order.customer_name}</span>
                          <span className="user-phone">{order.customer_phone}</span>
                        </div>
                      </td>
                      <td>{new Date(order.created_at).toLocaleDateString('ar-LB')}</td>
                      <td><strong>{formatPrice(order.total_amount)}</strong></td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-action">
                          <ChevronRight size={16} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>تفاصيل الطلب #{selectedOrder.id.slice(0, 8)}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}><LogOut size={16} /></button>
            </div>
            
            <div className="modal-body">
              <div className="order-meta">
                <div className="meta-item">
                  <label>العميل</label>
                  <span>{selectedOrder.customer_name}</span>
                </div>
                <div className="meta-item">
                  <label>رقم الهاتف</label>
                  <span>{selectedOrder.customer_phone}</span>
                </div>
                <div className="meta-item">
                  <label>حالة الطلب</label>
                  <select 
                    value={selectedOrder.status}
                    disabled={updatingId === selectedOrder.id}
                    onChange={(e) => handleUpdateStatus(selectedOrder, e.target.value)}
                    className={`status-select ${selectedOrder.status}`}
                  >
                    {['pending', 'delivering', 'paid', 'cancelled', 'expired'].map(s => (
                      <option key={s} value={s}>{statusLabels[s] || s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="order-items-list">
                <h3>المنتجات</h3>
                {selectedOrder.order_items?.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <span>{item.quantity}x المنتج</span>
                    <strong>{formatPrice(item.price_at_purchase * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              <div className="order-total-summary">
                <div className="summary-row">
                  <span>الإجمالي</span>
                  <strong>{formatPrice(selectedOrder.total_amount)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-dashboard {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          direction: rtl;
        }

        /* Sidebar */
        .admin-sidebar {
          width: 280px;
          background: #0f172a;
          color: white;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .sidebar-header {
          padding: 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .admin-logo {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-gold);
        }
        .sidebar-nav {
          padding: 24px 16px;
          flex: 1;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: #94a3b8;
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.2s;
          margin-bottom: 8px;
        }
        .nav-item:hover, .nav-item.active {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        .sidebar-footer {
          padding: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .user-avatar {
          width: 40px;
          height: 40px;
          background: var(--color-gold);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .user-details span {
          display: block;
          font-size: 14px;
          font-weight: 600;
        }
        .user-details small {
          color: #94a3b8;
          font-size: 11px;
        }
        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: rgba(220, 38, 38, 0.1);
          color: #f87171;
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
        }

        /* Main */
        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .admin-header {
          height: 72px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .header-search {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f1f5f9;
          padding: 8px 16px;
          border-radius: 12px;
          width: 300px;
        }
        .header-search input {
          background: none;
          border: none;
          outline: none;
          font-size: 14px;
          width: 100%;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .admin-date {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 14px;
        }

        .admin-content {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .admin-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 32px;
          color: #0f172a;
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 40px;
        }
        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .stat-icon.gold { background: rgba(212, 175, 55, 0.1); color: #d4af37; }
        .stat-icon.blue { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; }
        
        .stat-label {
          display: block;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
        }
        .stat-trend {
          position: absolute;
          top: 24px;
          left: 24px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .stat-trend.positive { color: #10b981; }

        /* Tables */
        .admin-section {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .section-header {
          padding: 24px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
        }
        .section-header h2 {
          font-size: 18px;
          font-weight: 700;
        }
        .view-all {
          background: none;
          border: none;
          color: var(--color-gold);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table th {
          text-align: right;
          padding: 16px 32px;
          background: #f8fafc;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
        }
        .admin-table td {
          padding: 16px 32px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }
        .table-user {
          display: flex;
          flex-direction: column;
        }
        .user-name { font-weight: 600; }
        .user-phone { font-size: 12px; color: #64748b; }
        
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        
        .table-action {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .table-action:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .skeleton-bar {
          height: 20px;
          background: #f1f5f9;
          border-radius: 4px;
          width: 100%;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-body { padding: 32px; }
        .order-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        .meta-item label {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .order-items-list h3 {
          font-size: 14px;
          margin-bottom: 16px;
          color: #0f172a;
        }
        .order-item-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }
        .order-total-summary {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 2px solid #f1f5f9;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          font-weight: 700;
        }
        .status-select {
          width: 100%;
          padding: 8px 12px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
        }
        .status-select.pending { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
        .status-select.delivering { color: #8b5cf6; background: rgba(139, 92, 246, 0.1); }
        .status-select.paid { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .status-select.cancelled, .status-select.expired { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        
        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #f1f5f9;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      ` }} />
    </div>
  );
}

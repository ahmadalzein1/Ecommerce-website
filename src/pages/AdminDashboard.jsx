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

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

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
                    <tr key={order.id}>
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
                          {order.status === 'pending' ? 'قيد الانتظار' : order.status}
                        </span>
                      </td>
                      <td>
                        <button className="table-action">
                          <ExternalLink size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

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
      ` }} />
    </div>
  );
}

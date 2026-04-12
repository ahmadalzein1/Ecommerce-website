import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Users, DollarSign, Package, 
  Search, Filter, ExternalLink, LogOut,
  ChevronRight, ArrowUpRight, TrendingUp, Clock,
  Menu, X, Plus, Layers, Palette, CreditCard
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { adminService } from '../lib/adminService';
import useAuthStore from '../stores/authStore';
import useLanguageStore from '../stores/languageStore';

// Modular Components
import { StatCard, formatEnPrice, en } from '../components/Admin/AdminCommon';
import { OrderManager } from '../components/Admin/OrderManager';
import { ProductManager } from '../components/Admin/ProductManager';
import { CategoryManager, ColorManager } from '../components/Admin/TaxonomyManager';
import { DiscountManager } from '../components/Admin/DiscountManager';
import { OrderIntelligenceModal } from '../components/Admin/OrderIntelligenceModal';
import { ProductWizard } from '../components/Admin/ProductWizard';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [stats, setStats] = useState({ 
    totalOrders: 0, 
    revenue: 0, 
    cost: 0, 
    profit: 0, 
    customers: 0 
  });
  
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const navigate = useNavigate();
  
  // Modals & Selection
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [orderData, productData, categoryData, colorData, discountData] = await Promise.all([
        supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
        adminService.fetchFullProducts(),
        adminService.fetchCategories(),
        adminService.fetchColors(),
        adminService.fetchDiscountCodes().catch(() => ({ data: [] }))
      ]);

      if (orderData.error) throw orderData.error;
      setOrders(orderData.data || []);
      setProducts(productData || []);
      setCategories(categoryData || []);
      setColors(colorData || []);
      setDiscounts(discountData?.data || []);

      // Calculate Advanced Stats
      let totalRev = 0;
      let totalCost = 0;
      orderData.data?.forEach(order => {
        totalRev += order.total_amount;
        order.order_items?.forEach(item => {
          totalCost += (item.cost_price_at_purchase || 0) * item.quantity;
        });
      });

      const uniqueCustomers = orderData.data ? new Set(orderData.data.map(o => o.customer_phone)).size : 0;

      setStats({
        totalOrders: orderData.data?.length || 0,
        revenue: totalRev,
        cost: totalCost,
        profit: totalRev - totalCost,
        customers: uniqueCustomers
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (order, newStatus) => {
    if (!order) return;
    const oldStatus = order.status;
    if (oldStatus === newStatus) return;

    setUpdatingId(order.id);
    try {
      const deductedGroup = ['delivering', 'paid'];
      const wasDeducted = deductedGroup.includes(oldStatus);
      const shouldBeDeducted = deductedGroup.includes(newStatus);

      if (shouldBeDeducted && !wasDeducted) {
        for (const item of order.order_items) {
          await supabase.rpc('decrement_stock', { variant_id: item.product_variant_id, qty: item.quantity });
        }
      } else if (!shouldBeDeducted && wasDeducted) {
        for (const item of order.order_items) {
          const { data: v } = await supabase.from('product_variants').select('stock_quantity').eq('id', item.product_variant_id).single();
          if (v) await supabase.from('product_variants').update({ stock_quantity: v.stock_quantity + item.quantity }).eq('id', item.product_variant_id);
        }
      }

      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      if (error) throw error;
      await fetchAllData();
      
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure?')) return;
    try {
      await adminService.deleteProduct(productId);
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const renderContent = () => {
    if (loading) return <div className="loading-state">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="admin-overview">
            <h1 className="admin-title">{language === 'ar' ? 'نظرة عامة' : 'Dashboard Overview'}</h1>
            <div className="stats-grid">
              <StatCard label={language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'} value={en(stats.totalOrders)} icon={ShoppingBag} colorClass="purple" />
              <StatCard label={language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'} value={formatEnPrice(stats.revenue)} icon={DollarSign} colorClass="gold" />
              <StatCard label={language === 'ar' ? 'إجمالي الأرباح' : 'Net Profit'} value={formatEnPrice(stats.profit)} icon={TrendingUp} colorClass="green" />
              <StatCard label={language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'} value={en(products.length)} icon={Package} colorClass="blue" />
            </div>
            <div className="admin-section">
              <div className="section-header">
                <h2>{language === 'ar' ? 'الطلبات الأخيرة' : 'Recent Orders'}</h2>
                <button className="view-all" onClick={() => setActiveTab('orders')}>
                  {language === 'ar' ? 'عرض الكل' : 'View All'} <ChevronRight size={16} />
                </button>
              </div>
              <OrderManager 
                orders={orders.slice(0, 5)} 
                onSelectOrder={setSelectedOrder} 
                language={language}
              />
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="tab-pane">
            <div className="tab-header-row">
              <button className="back-to-overview" onClick={() => setActiveTab('overview')}>
                <ChevronRight size={20} style={{ transform: language === 'ar' ? 'none' : 'rotate(180deg)' }} />
              </button>
              <h1 className="admin-title">{language === 'ar' ? 'إدارة الطلبات' : 'Order Management'}</h1>
            </div>
            <OrderManager orders={orders} onSelectOrder={setSelectedOrder} language={language} />
          </div>
        );
      case 'products':
        return (
          <div className="tab-pane">
            <div className="tab-header-row">
              <button className="back-to-overview" onClick={() => setActiveTab('overview')}>
                <ChevronRight size={20} style={{ transform: language === 'ar' ? 'none' : 'rotate(180deg)' }} />
              </button>
              <h1 className="admin-title">{language === 'ar' ? 'إدارة المنتجات' : 'Product Inventory'}</h1>
              <button 
                className="add-btn"
                onClick={() => { setSelectedProduct(null); setShowProductModal(true); }}
                style={{ marginInlineStart: 'auto' }}
              >
                <Plus size={18} /> {language === 'ar' ? 'منتج جديد' : 'New Product'}
              </button>
            </div>
            <ProductManager 
              products={products} 
              onEdit={p => { setSelectedProduct(p); setShowProductModal(true); }}
              onDelete={handleDeleteProduct}
              language={language} 
            />
          </div>
        );
      case 'categories':
        return (
          <div className="tab-pane">
            <div className="tab-header-row">
              <button className="back-to-overview" onClick={() => setActiveTab('overview')}>
                <ChevronRight size={20} style={{ transform: language === 'ar' ? 'none' : 'rotate(180deg)' }} />
              </button>
              <h1 className="admin-title">{language === 'ar' ? 'إدارة الفئات' : 'Categories'}</h1>
            </div>
            <CategoryManager categories={categories} language={language} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} />
          </div>
        );
      case 'colors':
        return (
          <div className="tab-pane">
            <div className="tab-header-row">
              <button className="back-to-overview" onClick={() => setActiveTab('overview')}>
                <ChevronRight size={20} style={{ transform: language === 'ar' ? 'none' : 'rotate(180deg)' }} />
              </button>
              <h1 className="admin-title">{language === 'ar' ? 'إدارة الألوان' : 'Color Palette'}</h1>
            </div>
            <ColorManager colors={colors} language={language} onAdd={() => {}} onDelete={() => {}} />
          </div>
        );
      case 'discounts':
        return (
          <div className="tab-pane">
            <div className="tab-header-row">
              <button className="back-to-overview" onClick={() => setActiveTab('overview')}>
                <ChevronRight size={20} style={{ transform: language === 'ar' ? 'none' : 'rotate(180deg)' }} />
              </button>
              <h1 className="admin-title">{language === 'ar' ? 'إدارة الخصومات' : 'Discounts'}</h1>
            </div>
            <DiscountManager discounts={discounts} language={language} onAdd={() => {}} onDelete={() => {}} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`admin-dashboard ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="admin-logo">💎 Zein Admin</div>
          <button className="sidebar-close" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} color="white" />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <button onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}>
            <TrendingUp size={18} /> <span>{language === 'ar' ? 'نظرة عامة' : 'Overview'}</span>
          </button>
          <button onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}>
            <ShoppingBag size={18} /> <span>{language === 'ar' ? 'الطلبات' : 'Orders'}</span>
          </button>
          <button onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}>
            <Package size={18} /> <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
          </button>
          <button onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}>
            <Layers size={18} /> <span>{language === 'ar' ? 'الفئات' : 'Categories'}</span>
          </button>
          <button onClick={() => { setActiveTab('colors'); setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'colors' ? 'active' : ''}`}>
            <Palette size={18} /> <span>{language === 'ar' ? 'الألوان' : 'Colors'}</span>
          </button>
          <button onClick={() => { setActiveTab('discounts'); setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'discounts' ? 'active' : ''}`}>
            <CreditCard size={18} /> <span>{language === 'ar' ? 'الخصومات' : 'Discounts'}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="developer-credit-fixed">
            <small>{language === 'ar' ? 'تطوير وبرمجة' : 'Developed by'}</small>
            <div className="dev-name">Ahmad Al Zein</div>
            <a href="mailto:zeinahmad763@gmail.com" className="dev-email-link">zeinahmad763@gmail.com</a>
          </div>
          <div className="user-info">
            <div className="user-avatar">{user?.email?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <span>{language === 'ar' ? 'المدير' : 'Admin'}</span>
              <small>{user?.email}</small>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} /> {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
              <div className="pro-menu-icon" />
            </button>
          </div>

          <div className="header-center">
            <div className="header-search">
              <Search size={18} color="#94a3b8" />
              <input type="text" placeholder={language === 'ar' ? 'ابحث عن رقم الطلب، الاسم، أو الهاتف...' : 'Search by ID, name, or phone...'} />
            </div>
          </div>

          <div className="header-actions">
            <div className="lang-switcher-modern">
              <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
              <button className={language === 'ar' ? 'active' : ''} onClick={() => setLanguage('ar')}>AR</button>
            </div>
            <div className="admin-date">
              <Clock size={16} />
              <span>{new Date().toLocaleDateString('en-US')}</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      {selectedOrder && (
        <OrderIntelligenceModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onUpdateStatus={handleUpdateStatus}
          language={language}
          updatingId={updatingId}
        />
      )}

      {showProductModal && (
        <ProductWizard 
          product={selectedProduct}
          categories={categories}
          colors={colors}
          onClose={() => setShowProductModal(false)}
          onSuccess={() => { setShowProductModal(false); fetchAllData(); }}
          language={language}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --admin-primary: #3b82f6;
          --admin-bg: #f8fafc;
          --admin-sidebar: #0f172a;
          --admin-card: #ffffff;
          --admin-border: #e2e8f0;
          --admin-text-main: #0f172a;
          --admin-text-sub: #64748b;
        }

        .admin-dashboard {
          display: flex;
          min-height: 100vh;
          background: var(--admin-bg);
          direction: ${language === 'ar' ? 'rtl' : 'ltr'};
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--admin-text-main);
          overflow-x: hidden;
        }

        /* Sidebar Glassmorphism & Dark Mode */
        .admin-sidebar {
          width: 280px; background: var(--admin-sidebar); color: white; display: flex; flex-direction: column;
          position: fixed; top: 0; bottom: 0; 
          left: ${language === 'ar' ? 'auto' : '0'}; 
          right: ${language === 'ar' ? '0' : 'auto'};
          z-index: 100; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 10px 0 30px rgba(0,0,0,0.1);
        }

        @media (max-width: 1024px) {
          .admin-sidebar { transform: translateX(${language === 'ar' ? '100%' : '-100%'}); }
          .admin-sidebar.open { transform: translateX(0); }
        }

        .sidebar-header {
          padding: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex; justify-content: space-between; align-items: center;
        }

        .sidebar-close {
          background: rgba(255,255,255,0.1); border: none; padding: 8px; border-radius: 10px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          display: none;
        }

        @media (max-width: 1024px) {
          .sidebar-close { display: flex; }
        }

        .admin-logo { 
          font-size: 1.6rem; font-weight: 800; 
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }
        
        .sidebar-nav { flex: 1; padding: 24px 16px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
        
        .nav-item {
          display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-radius: 14px;
          color: #94a3b8; font-weight: 500; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none; background: transparent; cursor: pointer; text-align: start; width: 100%;
          position: relative;
        }

        .nav-item:hover { background: rgba(255,255,255,0.05); color: white; transform: translateX(${language === 'ar' ? '-4px' : '4px'}); }
        .nav-item.active { 
          background: rgba(59, 130, 246, 0.1); color: #60a5fa; 
          font-weight: 600;
        }
        .nav-item.active::after {
          content: ''; position: absolute; top: 12px; bottom: 12px;
          ${language === 'ar' ? 'right: -16px' : 'left: -16px'};
          width: 4px; background: #3b82f6; border-radius: 0 4px 4px 0;
          box-shadow: 0 0 15px #3b82f6;
        }

        .sidebar-footer { padding: 24px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); }
        
        .developer-credit-fixed { padding: 16px; background: rgba(255,255,255,0.03); border-radius: 16px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.05); }
        .developer-credit-fixed small { color: #64748b; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
        .dev-name { color: white; font-weight: 800; font-size: 0.95rem; margin-bottom: 2px; }
        .dev-email-link { color: #3b82f6 !important; font-size: 0.72rem; text-decoration: none; display: block; opacity: 0.8; word-break: break-all; }
        .dev-email-link:hover { text-decoration: underline; opacity: 1; }

        .user-info { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .user-avatar { 
          width: 44px; height: 44px; border-radius: 12px; 
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          display: flex; align-items: center; justify-content: center; 
          font-weight: 800; color: white; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .user-details span { display: block; font-weight: 600; font-size: 0.95rem; color: white; }
        .user-details small { font-size: 0.8rem; color: #64748b; }

        .logout-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 12px; border-radius: 12px; background: rgba(239, 68, 68, 0.08); color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2); font-weight: 600; cursor: pointer; transition: all 0.3s;
        }
        .logout-btn:hover { background: #ef4444; color: white; border-color: #ef4444; transform: translateY(-2px); }

        /* Main Content Layout */
        .admin-main { 
          flex: 1; display: flex; flex-direction: column; min-height: 100vh; 
          margin-${language === 'ar' ? 'right' : 'left'}: 280px; 
          max-width: calc(100vw - 280px);
          overflow-x: hidden;
        }
        @media (max-width: 1024px) { 
          .admin-main { margin: 0; max-width: 100vw; } 
        }

        .admin-header {
          height: 80px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--admin-border); padding: 0 40px;
          display: flex; align-items: center; justify-content: space-between; 
          position: sticky; top: 0; z-index: 90; gap: 24px;
        }

        .header-left { display: flex; align-items: center; gap: 16px; }
        .header-title-context { font-weight: 700; color: #64748b; font-size: 0.9rem; }
        .header-center { flex: 1; display: flex; justify-content: center; max-width: 600px; }
        
        .header-search {
          display: flex; align-items: center; gap: 12px; background: #f1f5f9;
          padding: 10px 18px; border-radius: 14px; border: 1px solid transparent; 
          width: 100%; transition: all 0.2s;
        }
        .header-search:focus-within { border-color: #3b82f6; background: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08); }
        .header-search input { background: none; border: none; flex: 1; outline: none; font-size: 0.9rem; color: var(--admin-text-main); }

        .header-actions { display: flex; align-items: center; gap: 12px; }
        .admin-date { padding: 8px 12px; background: #f8fafc; border-radius: 12px; font-size: 0.8rem; color: #64748b; font-weight: 700; display: flex; align-items: center; gap: 8px; border: 1px solid #f1f5f9; }

        .lang-switcher-modern { display: flex; background: #f1f5f9; padding: 4px; border-radius: 100px; gap: 2px; border: 1px solid #e2e8f0; }
        .lang-switcher-modern button {
          padding: 6px 12px; border-radius: 100px; border: none; background: transparent;
          font-size: 0.7rem; font-weight: 800; cursor: pointer; color: #94a3b8; transition: all 0.2s;
        }
        .lang-switcher-modern button.active { background: white; color: #3b82f6; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }

        .menu-toggle {
          display: none; width: 44px; height: 44px; border-radius: 12px;
          background: #f1f5f9; border: none; align-items: center; justify-content: center;
          cursor: pointer; color: #0f172a; transition: all 0.2s;
        }
        @media (max-width: 1024px) { 
          .menu-toggle { display: flex; }
          .admin-header { padding: 0 20px; }
          .header-center { display: none; }
        }
        .pro-menu-icon {
          width: 20px; height: 2px; background: currentColor; position: relative;
        }
        .pro-menu-icon::before, .pro-menu-icon::after {
          content: ''; position: absolute; left: 0; width: 100%; height: 2px; background: currentColor;
        }
        .pro-menu-icon::before { top: -6px; width: 14px; }
        .pro-menu-icon::after { bottom: -6px; width: 10px; }

        .tab-header-row { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .back-to-overview {
          width: 44px; height: 44px; border-radius: 14px; background: white;
          border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center;
          color: #64748b; cursor: pointer; transition: all 0.2s;
        }
        .back-to-overview:hover { color: #3b82f6; border-color: #3b82f6; transform: translateX(${language === 'ar' ? '4px' : '-4px'}); }
        .dev-email-link { color: #3b82f6; font-size: 0.75rem; text-decoration: none; display: block; margin-top: 2px; opacity: 0.8; }
        .dev-email-link:hover { text-decoration: underline; opacity: 1; }

        /* New Stat Card Internal Styles */
        .stat-card-inner { display: flex; align-items: center; gap: 20px; padding: 4px; }
        .stat-icon-wrapper { 
          width: 54px; height: 54px; border-radius: 16px; 
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .stat-icon-wrapper.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .stat-icon-wrapper.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .stat-icon-wrapper.gold { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .stat-icon-wrapper.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }

        /* Responsive Stats */
        .stats-grid { 
          display: grid; gap: 24px; margin-bottom: 32px;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 1280px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .admin-header { height: auto; padding: 12px 20px; flex-wrap: wrap; gap: 12px; }
          .header-actions { width: 100%; justify-content: space-between; order: 3; }
        }
        @media (max-width: 640px) { 
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } 
          .admin-title { font-size: 1.3rem; margin-bottom: 16px; }
          .admin-section { padding: 16px 12px; }
          .admin-table-container { padding: 0 4px 10px; }
          .stat-icon-wrapper { width: 44px; height: 44px; border-radius: 12px; }
          .stat-icon-wrapper svg { width: 18px; height: 18px; }
          .stat-value-modern { font-size: 1.1rem; }
          .stat-label-modern { font-size: 0.75rem; }
          .stat-card-inner { gap: 10px; padding: 6px; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
        }

        .stat-data-cluster { display: flex; flex-direction: column; gap: 4px; }
        .stat-label-modern { color: #64748b; font-size: 0.85rem; font-weight: 600; }
        .stat-value-group { display: flex; align-items: baseline; gap: 12px; }
        .stat-value-modern { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
        .stat-trend-chip { 
          padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;
        }
        .stat-trend-chip.up { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .stat-trend-chip.down { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        /* Premium Tables */
        .admin-table-container { overflow-x: auto; padding: 0 20px 20px; }
        .admin-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
        .admin-table th { 
          padding: 16px 20px; text-align: start; font-size: 0.8rem; font-weight: 700; 
          text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;
        }
        .admin-table tr:not(thead tr) { 
          background: white; transition: all 0.2s; 
        }
        .admin-table tr:not(thead tr):hover { 
          transform: scale(1.005); box-shadow: 0 4px 12px rgba(0,0,0,0.05); 
          z-index: 10; position: relative;
        }
        .admin-table td { 
          padding: 20px; vertical-align: middle; 
          border-top: 1px solid #f8fafc; border-bottom: 1px solid #f8fafc;
        }
        .admin-table td:first-child { border-${language === 'ar' ? 'right' : 'left'}: 1px solid #f8fafc; border-radius: ${language === 'ar' ? '0 16px 16px 0' : '16px 0 0 16px'}; }
        .admin-table td:last-child { border-${language === 'ar' ? 'left' : 'right'}: 1px solid #f8fafc; border-radius: ${language === 'ar' ? '16px 0 0 16px' : '0 16px 16px 0'}; }

        .order-id { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: #3b82f6; background: rgba(59, 130, 246, 0.05); padding: 4px 8px; border-radius: 6px; font-weight: 600; }
        .table-user { display: flex; flex-direction: column; gap: 2px; }
        .user-name { font-weight: 700; color: #0f172a; font-size: 0.95rem; }
        .user-phone { color: #64748b; font-size: 0.8rem; font-weight: 500; }

        .profit-text { font-family: 'JetBrains Mono', monospace; }

        /* Status Badges */
        .status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 10px; font-size: 0.75rem; font-weight: 700;
          text-transform: capitalize;
        }
        .status-badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
        .status-badge.delivering { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
        .status-badge.paid { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .status-badge.cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
        .status-badge.expired { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

        .table-action { color: #cbd5e1; transition: color 0.2s; }
        tr:hover .table-action { color: #3b82f6; }

        @keyframes fadeInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        /* Custom Scrollbar */
        * { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      ` }} />
    </div>
  );
}

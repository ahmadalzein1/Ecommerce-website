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
import { errorService } from '../lib/errorService';
import useAuthStore from '../stores/authStore';
import useLanguageStore from '../stores/languageStore';

// Modular Components
import { StatCard, formatEnPrice, en, AdminConfirmModal, AdminProLoader, AdminToastStack, OfflineBanner } from '../components/Admin/AdminCommon';
import { OrderManager } from '../components/Admin/OrderManager';
import { ProductManager } from '../components/Admin/ProductManager';
import { CategoryManager, ColorManager } from '../components/Admin/TaxonomyManager';
import { DiscountManager } from '../components/Admin/DiscountManager';
import { OrderIntelligenceModal } from '../components/Admin/OrderIntelligenceModal';
import { ProductWizard } from '../components/Admin/ProductWizard';
import AdminSearch from '../components/Admin/AdminSearch';
import { CategoryModal, ColorModal } from '../components/Admin/TaxonomyModals';
import DiscountModal from '../components/Admin/DiscountModal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [stats, setStats] = useState({ 
    totalOrders: 0, 
    pendingOrders: 0,
    deliveringOrders: 0,
    paidOrders: 0,
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

  // New CRUD & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', itemName: '', onConfirm: null });
  const [isProcessing, setIsProcessing] = useState(false);

  // Status & Notifications
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const notify = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, language }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    setSearchTerm(''); // Reset search when switching tabs
  }, [activeTab]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const calculateStats = (orderList) => {
    let totalRev = 0;
    let totalCost = 0;
    let pending = 0;
    let delivering = 0;
    let paid = 0;

    orderList?.forEach(order => {
      if (order.status === 'pending') {
        pending++;
      } else if (order.status === 'delivering' || order.status === 'paid') {
        if (order.status === 'delivering') delivering++;
        if (order.status === 'paid') paid++;
        
        totalRev += order.total_amount;
        order.order_items?.forEach(item => {
          totalCost += (item.cost_price_at_purchase || 0) * item.quantity;
        });
      }
    });

    const uniqueCustomers = orderList ? new Set(orderList.map(o => o.customer_phone)).size : 0;

    setStats({
      totalOrders: orderList?.length || 0,
      pendingOrders: pending,
      deliveringOrders: delivering,
      paidOrders: paid,
      revenue: totalRev,
      cost: totalCost,
      profit: totalRev - totalCost,
      customers: uniqueCustomers
    });
  };

  const fetchOrders = async () => {
    try {
      const orderData = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      if (orderData.error) throw orderData.error;
      setOrders(orderData.data || []);
      calculateStats(orderData.data || []);
    } catch (err) { 
      notify(adminService.handleError(err, language), 'error');
    }
  };

  const fetchProducts = async () => {
    try {
      const productData = await adminService.fetchFullProducts();
      setProducts(productData || []);
    } catch (err) { 
      notify(adminService.handleError(err, language), 'error');
    }
  };

  const fetchCategories = async () => {
    try {
      const categoryData = await adminService.fetchCategories();
      setCategories(categoryData || []);
    } catch (err) { 
      notify(adminService.handleError(err, language), 'error');
    }
  };

  const fetchColors = async () => {
    try {
      const colorData = await adminService.fetchColors();
      setColors(colorData || []);
    } catch (err) { 
      notify(adminService.handleError(err, language), 'error');
    }
  };

  const fetchDiscounts = async () => {
    try {
      const discountData = await adminService.fetchDiscountCodes();
      setDiscounts(discountData?.data || []);
    } catch (err) { 
      notify(adminService.handleError(err, language), 'error');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOrders(),
      fetchProducts(),
      fetchCategories(),
      fetchColors(),
      fetchDiscounts()
    ]);
    setLoading(false);
  };

  const handleUpdateStatus = async (order, newStatus) => {
    if (!order) return;
    const oldStatus = order.status;
    if (oldStatus === newStatus) return;

    if (!errorService.isOnline()) {
      notify(language === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'No internet connection', 'error');
      return;
    }

    setUpdatingId(order.id);
    try {
      const updateLogic = async () => {
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
      };

      await errorService.withTimeout(updateLogic(), 15000);
      await fetchOrders(); 
      
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      notify(errorService.translate(err, language), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    setConfirmConfig({
      isOpen: true,
      title: language === 'ar' ? 'حذف المنتج' : 'Delete Product',
      message: language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?',
      itemName: language === 'ar' ? product?.name_ar : product?.name_en,
      onConfirm: () => handleAction(
        () => adminService.deleteProduct(productId),
        'تم حذف المنتج بنجاح', 'Product deleted successfully'
      )
    });
  };

  const handleAction = async (actionFn, successMsgAR, successMsgEN) => {
    if (!errorService.isOnline()) {
      notify(language === 'ar' ? 'فشل الاتصال: لا يوجد إنترنت' : 'Connection failed: No internet', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await errorService.withTimeout(actionFn(), 15000);
      notify(language === 'ar' ? successMsgAR : successMsgEN, 'success');
      await fetchAllData();
      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      notify(errorService.translate(err, language), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CRUD Handlers for Taxonomy & Discounts ---
  const handleSaveCategory = async (data) => {
    if (!errorService.isOnline()) {
      notify(language === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'No internet connection', 'error');
      return;
    }
    try {
      const action = selectedItem 
        ? () => adminService.updateCategory(selectedItem.id, data)
        : () => adminService.createCategory(data);
        
      await errorService.withTimeout(action(), 15000);
      notify(language === 'ar' ? 'تم حفظ الفئة' : 'Category saved', 'success');
      setShowCategoryModal(false);
      setSelectedItem(null);
      await fetchCategories();
    } catch (err) {
      notify(errorService.translate(err, language), 'error');
    }
  };

  const handleDeleteCategory = (id) => {
    const category = categories.find(c => c.id === id);
    setConfirmConfig({
      isOpen: true,
      title: language === 'ar' ? 'حذف الفئة' : 'Delete Category',
      message: language === 'ar' ? 'حذف هذه الفئة قد يؤثر على المنتجات المرتبطة بها. هل تريد الاستمرار؟' : 'Deleting this category may affect linked products. Continue?',
      itemName: language === 'ar' ? category?.name_ar : category?.name_en,
      onConfirm: () => handleAction(
        () => adminService.deleteCategory(id),
        'تم حذف الفئة بنجاح', 'Category deleted successfully'
      )
    });
  };

  const handleSaveColor = async (data) => {
    if (!errorService.isOnline()) {
      notify(language === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'No internet connection', 'error');
      return;
    }
    try {
      const action = selectedItem 
        ? () => adminService.updateColor(selectedItem.id, data)
        : () => adminService.createColor(data);

      await errorService.withTimeout(action(), 15000);
      notify(language === 'ar' ? 'تم حفظ اللون' : 'Color saved', 'success');
      setShowColorModal(false);
      setSelectedItem(null);
      await fetchColors();
    } catch (err) {
      notify(errorService.translate(err, language), 'error');
    }
  };

  const handleDeleteColor = (id) => {
    const color = colors.find(c => c.id === id);
    setConfirmConfig({
      isOpen: true,
      title: language === 'ar' ? 'حذف اللون' : 'Delete Color',
      message: language === 'ar' ? 'هل أنت متأكد من حذف هذا اللون؟' : 'Are you sure you want to delete this color?',
      itemName: language === 'ar' ? color?.name_ar : color?.name_en,
      onConfirm: () => handleAction(
        () => adminService.deleteColor(id),
        'تم حذف اللون بنجاح', 'Color deleted successfully'
      )
    });
  };

  const handleSaveDiscount = async (data) => {
    if (!errorService.isOnline()) {
      notify(language === 'ar' ? 'لا يوجد اتصال بالإنترنت' : 'No internet connection', 'error');
      return;
    }
    try {
      const action = selectedItem 
        ? () => adminService.updateDiscountCode(selectedItem.id, data)
        : () => adminService.createDiscountCode(data);

      await errorService.withTimeout(action(), 15000);
      notify(language === 'ar' ? 'تم حفظ كود الخصم' : 'Discount code saved', 'success');
      setShowDiscountModal(false);
      setSelectedItem(null);
      await fetchDiscounts();
    } catch (err) {
      notify(errorService.translate(err, language), 'error');
    }
  };

  const handleDeleteDiscount = (id) => {
    const discount = discounts.find(d => d.id === id);
    setConfirmConfig({
      isOpen: true,
      title: language === 'ar' ? 'حذف كود الخصم' : 'Delete Discount Code',
      message: language === 'ar' ? 'هل أنت متأكد من حذف كود الخصم هذا؟' : 'Are you sure you want to delete this discount code?',
      itemName: discount?.code,
      onConfirm: () => handleAction(
        () => adminService.deleteDiscountCode(id),
        'تم حذف كود الخصم بنجاح', 'Discount deleted successfully'
      )
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const renderContent = () => {
    if (loading) return null; // Handled by AdminProLoader at root

    switch (activeTab) {
      case 'overview':
        return (
          <div className="admin-overview">
            <h1 className="admin-title">{language === 'ar' ? 'نظرة عامة' : 'Dashboard Overview'}</h1>
            <div className="stats-grid">
              <StatCard label={language === 'ar' ? 'إجمالي الإيرادات (مدفوع + شحن)' : 'Total Revenue (Paid + Deliv.)'} value={formatEnPrice(stats.revenue)} icon={DollarSign} colorClass="gold" />
              <StatCard label={language === 'ar' ? 'إجمالي الأرباح' : 'Net Profit'} value={formatEnPrice(stats.profit)} icon={TrendingUp} colorClass="green" />
              <StatCard label={language === 'ar' ? 'طلبات مدفوعة' : 'Paid Orders'} value={en(stats.paidOrders)} icon={CreditCard} colorClass="green" />
              <StatCard label={language === 'ar' ? 'طلبات قيد التوصيل' : 'Delivering Orders'} value={en(stats.deliveringOrders)} icon={Package} colorClass="blue" />
              <StatCard label={language === 'ar' ? 'طلبات قيد الانتظار' : 'Pending Orders'} value={en(stats.pendingOrders)} icon={Clock} colorClass="purple" />
              <StatCard label={language === 'ar' ? 'إجمالي المنتجات' : 'Total Products'} value={en(products.length)} icon={ShoppingBag} colorClass="purple" />
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
        const filteredOrders = orders.filter(o => 
          o.id.toString().includes(searchTerm) || 
          o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.customer_phone?.includes(searchTerm)
        );
        return (
          <div className="tab-pane">
            <div className="premium-section-header">
              <div className="header-main-group">
                <button className="pro-back-btn" onClick={() => setActiveTab('overview')}>
                  <ChevronRight size={20} style={{ transform: language === 'ar' ? 'none' : 'rotate(180deg)' }} />
                </button>
                <div className="title-stack">
                  <h1 className="pro-admin-title">{language === 'ar' ? 'إدارة الطلبات' : 'Order Management'}</h1>
                  <p className="pro-admin-subtitle">{language === 'ar' ? 'تتبع وعالـج طلبات العملاء' : 'Track and process customer orders'}</p>
                </div>
              </div>
              <div className="header-actions-group">
                <div className="pro-search-wrapper">
                  <AdminSearch 
                    value={searchTerm} 
                    onChange={setSearchTerm} 
                    language={language} 
                    placeholder={language === 'ar' ? 'البحث عن طلب...' : 'Search for an order...'}
                  />
                </div>
              </div>
            </div>
            <div className="pro-content-card">
              <OrderManager orders={filteredOrders} onSelectOrder={setSelectedOrder} language={language} />
            </div>
          </div>
        );
      case 'products':
        const filteredProducts = products.filter(p => 
          (language === 'ar' ? p.name_ar : p.name_en)?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
          <div className="tab-pane">
            <div className="premium-section-header">
              <div className="header-main-group">
                <div className="title-stack">
                  <h1 className="pro-admin-title">{language === 'ar' ? 'إدارة المنتجات' : 'Product Inventory'}</h1>
                  <p className="pro-admin-subtitle">{language === 'ar' ? 'إدارة المخزون والتفاصيل' : 'Manage your stock and details'}</p>
                </div>
              </div>
              <div className="header-actions-group">
                <div className="pro-search-wrapper">
                  <AdminSearch value={searchTerm} onChange={setSearchTerm} language={language} />
                </div>
                <button 
                  className="pro-add-btn"
                  onClick={() => { setSelectedProduct(null); setShowProductModal(true); }}
                >
                  <Plus size={18} /> <span>{language === 'ar' ? 'منتج جديد' : 'New Product'}</span>
                </button>
              </div>
            </div>
            <div className="pro-content-card">
              <ProductManager 
                products={filteredProducts} 
                onEdit={p => { setSelectedProduct(p); setShowProductModal(true); }}
                onDelete={handleDeleteProduct}
                language={language} 
              />
            </div>
          </div>
        );
      case 'categories':
        const filteredCategories = categories.filter(c => 
          (language === 'ar' ? c.name_ar : c.name_en)?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
          <div className="tab-pane">
            <div className="premium-section-header">
              <div className="header-main-group">
                <div className="title-stack">
                  <h1 className="pro-admin-title">{language === 'ar' ? 'إدارة الفئات' : 'Categories'}</h1>
                  <p className="pro-admin-subtitle">{language === 'ar' ? 'تنظيم المنتجات في مجموعات' : 'Organize products into groups'}</p>
                </div>
              </div>
              <div className="header-actions-group">
                <div className="pro-search-wrapper">
                  <AdminSearch value={searchTerm} onChange={setSearchTerm} language={language} />
                </div>
                <button className="pro-add-btn" onClick={() => { setSelectedItem(null); setShowCategoryModal(true); }}>
                  <Plus size={18} /> <span>{language === 'ar' ? 'فئة جديدة' : 'New Category'}</span>
                </button>
              </div>
            </div>
            <div className="pro-content-card">
              <CategoryManager 
                categories={filteredCategories} 
                language={language} 
                onAdd={() => { setSelectedItem(null); setShowCategoryModal(true); }} 
                onEdit={c => { setSelectedItem(c); setShowCategoryModal(true); }} 
                onDelete={handleDeleteCategory} 
              />
            </div>
          </div>
        );
      case 'colors':
        const filteredColors = colors.filter(c => 
          (language === 'ar' ? c.name_ar : c.name_en)?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
          <div className="tab-pane">
            <div className="premium-section-header">
              <div className="header-main-group">
                <div className="title-stack">
                  <h1 className="pro-admin-title">{language === 'ar' ? 'إدارة الألوان' : 'Color Palette'}</h1>
                  <p className="pro-admin-subtitle">{language === 'ar' ? 'إدارة سمات الألوان للمتجر' : 'Manage color attributes for the store'}</p>
                </div>
              </div>
              <div className="header-actions-group">
                <div className="pro-search-wrapper">
                  <AdminSearch value={searchTerm} onChange={setSearchTerm} language={language} />
                </div>
                <button className="pro-add-btn" onClick={() => { setSelectedItem(null); setShowColorModal(true); }}>
                  <Plus size={18} /> <span>{language === 'ar' ? 'لون جديد' : 'New Color'}</span>
                </button>
              </div>
            </div>
            <div className="pro-content-card">
              <ColorManager 
                colors={filteredColors} 
                language={language} 
                onAdd={() => { setSelectedItem(null); setShowColorModal(true); }}
                onEdit={c => { setSelectedItem(c); setShowColorModal(true); }}
                onDelete={handleDeleteColor} 
              />
            </div>
          </div>
        );
      case 'discounts':
        const filteredDiscounts = discounts.filter(d => 
          d.code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
          <div className="tab-pane">
            <div className="premium-section-header">
              <div className="header-main-group">
                <div className="title-stack">
                  <h1 className="pro-admin-title">{language === 'ar' ? 'إدارة الخصومات' : 'Discounts & Codes'}</h1>
                  <p className="pro-admin-subtitle">{language === 'ar' ? 'إنشاء وإدارة أكواد العروض' : 'Create and manage promo codes'}</p>
                </div>
              </div>
              <div className="header-actions-group">
                <div className="pro-search-wrapper">
                  <AdminSearch value={searchTerm} onChange={setSearchTerm} language={language} />
                </div>
                <button className="pro-add-btn" onClick={() => { setSelectedItem(null); setShowDiscountModal(true); }}>
                  <Plus size={18} /> <span>{language === 'ar' ? 'خصم جديد' : 'New Discount'}</span>
                </button>
              </div>
            </div>
            <div className="pro-content-card">
              <DiscountManager 
                discounts={filteredDiscounts} 
                language={language} 
                onAdd={() => { setSelectedItem(null); setShowDiscountModal(true); }}
                onEdit={d => { setSelectedItem(d); setShowDiscountModal(true); }}
                onDelete={handleDeleteDiscount} 
              />
            </div>
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
            {/* Global search removed as per user request */}
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

        <footer className="admin-footer">
          <div className="developer-credit-horizontal">
            <span>{language === 'ar' ? 'تطوير وبرمجة:' : 'Developed by:'}</span>
            <a 
              href="https://linkedin.com/in/ahmad-al-zein-4b9054386" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="dev-name clickable"
            >
              Ahmad Al Zein
            </a>
            <span className="dev-separator">•</span>
            <a href="mailto:zeinahmad763@gmail.com" className="dev-email-link">zeinahmad763@gmail.com</a>
          </div>
        </footer>
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

      {showCategoryModal && (
        <CategoryModal 
          category={selectedItem}
          categories={categories}
          onClose={() => { setShowCategoryModal(false); setSelectedItem(null); }}
          onSave={handleSaveCategory}
          language={language}
        />
      )}

      {showColorModal && (
        <ColorModal 
          color={selectedItem}
          onClose={() => { setShowColorModal(false); setSelectedItem(null); }}
          onSave={handleSaveColor}
          language={language}
        />
      )}

      {showDiscountModal && (
        <DiscountModal 
          discount={selectedItem}
          onClose={() => { setShowDiscountModal(false); setSelectedItem(null); }}
          onSave={handleSaveDiscount}
          language={language}
        />
      )}

      <AdminConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        itemName={confirmConfig.itemName}
        onConfirm={confirmConfig.onConfirm}
        loading={isProcessing}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        language={language}
      />

      {/* Global Notifications & States */}
      <AdminToastStack toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      {!isOnline && <OfflineBanner language={language} />}
      
      {loading && <AdminProLoader language={language} />}

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
          font-family: 'Tajawal', 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--admin-text-main);
          overflow-x: hidden;
          line-height: 1.6;
        }

        input, select, textarea, button {
          font-family: 'Tajawal', 'Inter', system-ui, -apple-system, sans-serif !important;
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
          .admin-sidebar { 
            transform: translateX(${language === 'ar' ? '100%' : '-100%'});
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
          }
          .admin-sidebar.open { transform: translateX(0); }
        }
        
        .sidebar-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
          z-index: 95; animation: fadeIn 0.3s ease;
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

        /* Main Content Spacing */
        .admin-main {
          flex: 1;
          margin-inline-start: 280px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          transition: all 0.4s ease;
          width: 100%;
          background: var(--admin-bg);
          overflow-x: hidden;
        }

        @media (max-width: 1024px) {
          .admin-main { margin-inline-start: 0; }
          .admin-content { padding: 24px 16px !important; }
        }

        .admin-overview {
          animation: fadeIn 0.5s ease;
          padding-top: 10px;
        }

        .admin-content {
          padding: 40px 60px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          flex: 1;
        }

        .admin-header {
          height: 80px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--admin-border); padding: 0 60px;
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
          .admin-header { padding: 0 20px; height: 70px; }
          .header-center, .header-title-context { display: none; }
          .admin-date { display: none; }
        }
        .pro-menu-icon {
          width: 20px; height: 2px; background: currentColor; position: relative;
        }
        .pro-menu-icon::before, .pro-menu-icon::after {
          content: ''; position: absolute; left: 0; width: 100%; height: 2px; background: currentColor;
        }
        .pro-menu-icon::before { top: -6px; width: 14px; }
        .pro-menu-icon::after { bottom: -6px; width: 10px; }

        .tab-header-row { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
        .tab-header-left { display: flex; align-items: center; gap: 16px; }
        .tab-header-actions { display: flex; align-items: center; gap: 16px; flex: 1; justify-content: flex-end; }
        
        @media (max-width: 768px) {
          .tab-header-row.wrap-mobile { flex-direction: column; align-items: stretch; gap: 16px; }
          .tab-header-actions { flex-direction: column; align-items: stretch; }
          .tab-header-actions > * { width: 100%; }
        }

        .back-to-overview {
          width: 44px; height: 44px; border-radius: 14px; background: white;
          border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center;
          color: #64748b; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .back-to-overview:hover { color: #3b82f6; border-color: #3b82f6; transform: translateX(${language === 'ar' ? '4px' : '-4px'}); }
        
        .admin-modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
          animation: fadeIn 0.3s ease;
        }
        
        @media (max-width: 640px) {
          .admin-modal-overlay { 
            align-items: flex-end; padding: 0;
          }
          .admin-modal-card { 
            border-radius: 32px 32px 0 0 !important; 
            max-height: 95vh !important;
            animation: slideInUp 0.4s cubic-bezier(0, 1, 0, 1);
          }
          @keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        }
        
        .admin-modal-card {
          background: white; width: 100%; max-width: 600px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          overflow: hidden; max-height: 90vh; display: flex; flex-direction: column;
        }
        .admin-modal-card.small { max-width: 500px; }

        .modal-header {
          padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;
          background: #f8fafc;
        }
        .modal-title-area { display: flex; align-items: center; gap: 16px; }
        .modal-icon-bg {
          width: 48px; height: 48px; border-radius: 14px; background: white; border: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center; color: var(--admin-primary); box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .modal-title-area h3 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; }
        .modal-title-area p { font-size: 0.85rem; color: #64748b; margin: 2px 0 0 0; }
        
        .close-modal-btn {
          width: 36px; height: 36px; border-radius: 10px; border: none; background: transparent;
          color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .close-modal-btn:hover { background: #f1f5f9; color: #0f172a; }

        .modal-body { padding: 32px; overflow-y: auto; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .form-group.full { grid-column: span 2; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px; }
        .form-group input, .form-group select, .form-group textarea {
          width: 100%; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0;
          font-size: 0.95rem; color: #0f172a; transition: all 0.2s; background: #fff;
        }
        .form-group input:focus { border-color: var(--admin-primary); outline: none; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        
        .modal-actions {
          padding: 24px 32px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc;
        }
        .btn-secondary {
          padding: 12px 24px; border-radius: 12px; border: 1px solid #e2e8f0; background: white;
          font-weight: 700; color: #475569; cursor: pointer; transition: all 0.2s;
        }
        .btn-secondary:hover { background: #f1f5f9; }
        .btn-primary {
          padding: 12px 24px; border-radius: 12px; border: none; background: var(--admin-primary);
          font-weight: 700; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px;
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); transition: all 0.2s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 20px -3px rgba(59, 130, 246, 0.4); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1); }

        .dev-email-link { color: #3b82f6; font-size: 0.75rem; text-decoration: none; display: block; margin-top: 2px; opacity: 0.8; }
        .dev-email-link:hover { text-decoration: underline; opacity: 1; }

        /* New Stat Card Internal Styles */
        .stat-card-new {
          background: white;
          border: 1px solid var(--admin-border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
        }
        .stat-card-new:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          border-color: #3b82f6;
        }
        .stat-card-inner { display: flex; align-items: center; gap: 20px; width: 100%; }
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
          grid-template-columns: repeat(3, 1fr);
          max-width: 1200px;
        }
        @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { 
          .stats-grid { grid-template-columns: 1fr; gap: 12px; } 
          .stat-card-new { padding: 16px; border-radius: 16px; }
          .stat-icon-wrapper { width: 44px !important; height: 44px !important; border-radius: 12px !important; }
          .stat-value-modern { font-size: 1.25rem !important; }
          .stat-label-modern { font-size: 0.8rem !important; }
        }

        /* Responsive Table-to-Card System */
        @media (max-width: 768px) {
          .admin-table-container { padding: 0 !important; border: none !important; background: transparent !important; }
          .admin-table { display: block; width: 100% !important; border-spacing: 0 !important; }
          .admin-table thead { display: none; }
          .admin-table tbody { display: block; width: 100%; }
          .admin-table tr { 
            display: block; width: 100%; background: white !important; 
            border: 1px solid var(--admin-border); border-radius: 20px !important;
            margin-bottom: 16px !important; padding: 16px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.02) !important;
            transform: none !important;
          }
          .admin-table td { 
            display: flex; align-items: center; justify-content: space-between; 
            padding: 10px 0 !important; border: none !important; border-radius: 0 !important;
            width: 100% !important; text-align: ${language === 'ar' ? 'right' : 'left'} !important;
          }
          .admin-table td::before {
            content: attr(data-label); font-weight: 700; color: #94a3b8; 
            font-size: 0.75rem; text-transform: uppercase;
          }
          .admin-table td:empty { display: none; }
          .admin-table td:last-child { justify-content: center; padding-top: 16px !important; border-top: 1px solid #f1f5f9 !important; }
          .admin-table td:last-child::before { display: none; }
          
          /* Special Case: Order/Product with Name as Primary */
          .admin-table tr td[data-label="Order"], .admin-table tr td[data-label="الطلب"],
          .admin-table tr td[data-label="Product"], .admin-table tr td[data-label="المنتج"] {
            flex-direction: column; align-items: flex-start; gap: 8px; border-bottom: 1px solid #f1f5f9 !important;
            padding-bottom: 16px !important; margin-bottom: 8px !important;
          }
          .admin-table tr td[data-label="Order"]::before, .admin-table tr td[data-label="الطلب"]::before,
          .admin-table tr td[data-label="Product"]::before, .admin-table tr td[data-label="المنتج"]::before {
            margin-bottom: 4px;
          }
        }

        .stat-data-cluster { display: flex; flex-direction: column; gap: 4px; text-align: ${language === 'ar' ? 'right' : 'left'}; }
        .stat-label-modern { color: #64748b; font-size: 0.85rem; font-weight: 600; }
        .stat-value-group { display: flex; align-items: baseline; gap: 12px; justify-content: flex-start; }
        .stat-value-modern { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
        .stat-trend-chip { 
          padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;
        }
        .stat-trend-chip.up { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .stat-trend-chip.down { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        /* Admin Footer Style */
        .admin-main { display: flex; flex-direction: column; min-height: 100vh; }
        .admin-content { flex: 1; }
        .admin-footer {
          padding: 32px 60px;
          border-top: 1px solid var(--admin-border);
          background: white;
          width: 100%;
        }

        /* Admin Confirm Modal */
        .admin-confirm-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); 
          backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000;
          animation: adminFadeIn 0.3s ease;
        }
        .admin-confirm-card {
          background: white; width: 100%; max-width: 400px; padding: 32px; border-radius: 28px;
          text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
        }
        .confirm-icon-area { display: flex; justify-content: center; margin-bottom: 20px; }
        .confirm-icon-glow {
          width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center;
          position: relative; transition: all 0.3s;
        }
        .confirm-icon-glow.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .confirm-icon-glow.danger::after { content: ''; position: absolute; inset: -4px; border-radius: 24px; border: 2px solid rgba(239, 68, 68, 0.1); animation: pulse 2s infinite; }
        
        .admin-confirm-card h3 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .admin-confirm-card p { color: #64748b; line-height: 1.6; margin-bottom: 30px; }
        
        .confirm-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .confirm-btn-secondary {
          padding: 14px; border-radius: 16px; border: 1px solid #e2e8f0; background: white;
          color: #64748b; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .confirm-btn-primary {
          padding: 14px; border-radius: 16px; border: none; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .confirm-btn-primary.danger { background: #ef4444; color: white; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.25); }
        
        .confirm-btn-secondary:hover { background: #f8fafc; color: #0f172a; }
        .confirm-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(239, 68, 68, 0.3); }

        @keyframes adminFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.2); opacity: 0; } }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .developer-credit-horizontal {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 0.85rem;
          color: #64748b;
        }
        .admin-footer .dev-name.clickable {
          color: #0077b5; /* LinkedIn Brand Blue */
          text-decoration: none;
          font-weight: 700;
          padding: 2px 4px;
          border-radius: 4px;
          transition: all 0.2s;
          position: relative;
        }
        .admin-footer .dev-name.clickable::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 4px;
          right: 4px;
          height: 2px;
          background: #0077b5;
          transform: scaleX(0);
          transition: transform 0.3s ease;
          transform-origin: right;
        }
        .admin-footer .dev-name.clickable:hover {
          color: #005582;
          background: rgba(0, 119, 181, 0.05);
        }
        .admin-footer .dev-name.clickable:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }

        /* Section Header Overhaul - Premium Styles */
        .premium-section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 40px;
          gap: 24px;
        }
        .header-main-group { display: flex; align-items: center; gap: 20px; }
        .title-stack { display: flex; flex-direction: column; gap: 4px; }
        .pro-admin-title { font-size: 2.25rem; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -1px; }
        .pro-admin-subtitle { font-size: 0.95rem; color: #64748b; font-weight: 500; margin: 0; }
        
        .pro-back-btn {
          width: 48px; height: 48px; border-radius: 16px; border: 1px solid #e2e8f0; background: white;
          color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .pro-back-btn:hover { background: #f8fafc; color: #0f172a; transform: translateX(${language === 'ar' ? '4px' : '-4px'}); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }

        .header-actions-group { display: flex; align-items: center; gap: 16px; flex: 1; justify-content: flex-end; }
        .pro-search-wrapper { width: 100%; max-width: 320px; }
        
        .pro-add-btn {
          padding: 14px 24px; border-radius: 16px; border: none; background: #fbbf24; color: #0f172a;
          font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 25px rgba(251, 191, 36, 0.2);
          white-space: nowrap;
        }
        .pro-add-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(251, 191, 36, 0.3); background: #f59e0b; }
        .pro-add-btn:active { transform: translateY(-1px); }

        .pro-content-card {
          background: white; border-radius: 32px; padding: 12px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 4px 30px rgba(0,0,0,0.02);
        }

        @media (max-width: 1024px) {
          .premium-section-header { flex-direction: column; align-items: flex-start; gap: 20px; }
          .header-actions-group { width: 100%; justify-content: space-between; gap: 12px; }
          .pro-search-wrapper { max-width: none; }
        }
        @media (max-width: 640px) {
          .pro-admin-title { font-size: 1.75rem; }
          .pro-admin-subtitle { font-size: 0.85rem; }
          .pro-add-btn span { display: none; }
          .pro-add-btn { padding: 12px; border-radius: 12px; }
          .header-main-group { gap: 12px; }
          .pro-back-btn { width: 40px; height: 40px; border-radius: 12px; }
        }

        .section-header {
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          position: relative;
        }
        .section-header h2::after {
          content: '';
          position: absolute;
          bottom: -13px;
          ${language === 'ar' ? 'right: 0' : 'left: 0'};
          width: 40px;
          height: 3px;
          background: #3b82f6;
          border-radius: 10px;
        }

        .view-all {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .view-all:hover {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2);
        }
        .view-all svg {
          transition: transform 0.3s ease;
        }
        .view-all:hover svg {
          transform: translateX(${language === 'ar' ? '-4px' : '4px'});
        }

        /* Primary Action Button (New Product) */
        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: #fbbf24;
          color: #0f172a;
          border: none;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
        }
        .add-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 20px rgba(251, 191, 36, 0.3);
          background: #f59e0b;
        }
        .add-btn:active {
          transform: translateY(0) scale(0.98);
        }
        .add-btn svg {
          transition: transform 0.3s ease;
        }
        .add-btn:hover svg {
          transform: rotate(90deg);
        }

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

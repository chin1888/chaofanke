import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'en' | 'zh';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

// Translation dictionary
const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Sidebar
    'admin.title': 'Admin Panel',
    'admin.logout': 'Logout',
    'menu.dashboard': 'Dashboard',
    'menu.overview': 'Overview',
    'menu.traffic': 'Traffic',
    'menu.sales': 'Sales',
    'menu.products': 'Products',
    'menu.banners': 'Banners',
    'menu.categories': 'Categories',
    'menu.users': 'Users',
    'menu.reviews': 'Reviews',
    'menu.payments': 'Payments',
    'menu.admins': 'Admins',

    // Common
    'common.save': 'Save',
    'common.saveChanges': 'Save Changes',
    'common.saving': 'Saving...',
    'common.saved': 'Saved',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search...',
    'common.loading': 'Loading...',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.name': 'Name',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.back': 'Back',
    'common.create': 'Create',
    'common.upload': 'Upload',
    'common.remove': 'Remove',
    'common.confirm': 'Confirm',
    'common.total': 'Total',
    'common.date': 'Date',
    'common.amount': 'Amount',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.totalOrders': 'Total Orders',
    'dashboard.totalRevenue': 'Total Revenue',
    'dashboard.totalUsers': 'Total Users',
    'dashboard.recentOrders': 'Recent Orders',
    'dashboard.topProducts': 'Top Products',

    // Users
    'users.title': 'User Management',
    'users.totalUsers': 'Total Users',
    'users.newThisMonth': 'New This Month',
    'users.activeUsers': 'Active Users',
    'users.searchPlaceholder': 'Search users...',
    'users.username': 'Username',
    'users.email': 'Email',
    'users.phone': 'Phone',
    'users.registered': 'Registered',
    'users.role': 'Role',

    // Products
    'products.title': 'Products',
    'products.addProduct': 'Add Product',
    'products.editProduct': 'Edit Product',
    'products.sku': 'SKU',
    'products.stock': 'Stock',
    'products.price': 'Price',
    'products.category': 'Category',
    'products.basicInfo': 'Basic Information',
    'products.pricing': 'Pricing',
    'products.images': 'Images',
    'products.features': 'Features',
    'products.boxContents': 'Box Contents',
    'products.detailContent': 'Detail Content',
    'products.saveDetails': 'Save Details',
    'products.addImageBlock': 'Add Image Block',
    'products.addTextBlock': 'Add Text Block',
    'products.noProducts': 'No products found',

    // Orders
    'orders.title': 'Orders',
    'orders.orderId': 'Order ID',
    'orders.customer': 'Customer',
    'orders.total': 'Total',
    'orders.status': 'Status',
    'orders.date': 'Date',

    // Banners
    'banners.title': 'Banner Management',

    // Categories
    'categories.title': 'Categories',

    // Reviews
    'reviews.title': 'Reviews',

    // Payments
    'payments.title': 'Payment Gateways',

    // Traffic
    'traffic.title': 'Traffic Statistics',

    // Overview
    'overview.title': 'Overview',

    // Language toggle
    'lang.en': 'EN',
    'lang.zh': '中文',
  },
  zh: {
    // Sidebar
    'admin.title': '管理后台',
    'admin.logout': '退出登录',
    'menu.dashboard': '仪表盘',
    'menu.overview': '概览',
    'menu.traffic': '流量统计',
    'menu.sales': '订单管理',
    'menu.products': '商品管理',
    'menu.banners': '轮播管理',
    'menu.categories': '分类管理',
    'menu.users': '用户管理',
    'menu.reviews': '评论管理',
    'menu.payments': '支付设置',
    'menu.admins': '管理员',

    // Common
    'common.save': '保存',
    'common.saveChanges': '保存更改',
    'common.saving': '保存中...',
    'common.saved': '已保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.add': '添加',
    'common.search': '搜索...',
    'common.loading': '加载中...',
    'common.actions': '操作',
    'common.status': '状态',
    'common.name': '名称',
    'common.active': '启用',
    'common.inactive': '停用',
    'common.yes': '是',
    'common.no': '否',
    'common.back': '返回',
    'common.create': '创建',
    'common.upload': '上传',
    'common.remove': '移除',
    'common.confirm': '确认',
    'common.total': '总计',
    'common.date': '日期',
    'common.amount': '金额',

    // Dashboard
    'dashboard.title': '仪表盘',
    'dashboard.totalOrders': '总订单数',
    'dashboard.totalRevenue': '总收入',
    'dashboard.totalUsers': '总用户数',
    'dashboard.recentOrders': '最近订单',
    'dashboard.topProducts': '热销商品',

    // Users
    'users.title': '用户管理',
    'users.totalUsers': '总用户数',
    'users.newThisMonth': '本月新增',
    'users.activeUsers': '活跃用户',
    'users.searchPlaceholder': '搜索用户...',
    'users.username': '用户名',
    'users.email': '邮箱',
    'users.phone': '手机号',
    'users.registered': '注册时间',
    'users.role': '角色',

    // Products
    'products.title': '商品管理',
    'products.addProduct': '添加商品',
    'products.editProduct': '编辑商品',
    'products.sku': 'SKU',
    'products.stock': '库存',
    'products.price': '价格',
    'products.category': '分类',
    'products.basicInfo': '基本信息',
    'products.pricing': '价格设置',
    'products.images': '商品图片',
    'products.features': '产品特点',
    'products.boxContents': '包装内容',
    'products.detailContent': '商品详情',
    'products.saveDetails': '保存详情',
    'products.addImageBlock': '添加图片',
    'products.addTextBlock': '添加文字',
    'products.noProducts': '暂无商品',

    // Orders
    'orders.title': '订单管理',
    'orders.orderId': '订单号',
    'orders.customer': '客户',
    'orders.total': '总计',
    'orders.status': '状态',
    'orders.date': '日期',

    // Banners
    'banners.title': '轮播管理',

    // Categories
    'categories.title': '分类管理',

    // Reviews
    'reviews.title': '评论管理',

    // Payments
    'payments.title': '支付设置',

    // Traffic
    'traffic.title': '流量统计',

    // Overview
    'overview.title': '数据概览',

    // Language toggle
    'lang.en': 'EN',
    'lang.zh': '中文',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('admin_lang') as Lang) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('admin_lang', lang);
  }, [lang]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  Download,
  Search,
  Lock,
  ShieldCheck,
  ArrowUpRight,
  Package,
  ShoppingBag,
  Users,
  FileCheck,
  BarChart3,
} from 'lucide-react';
import {
  Product,
  ProductCategory,
  ProductSubType,
  Order,
  Customer,
  PaymentStatus,
  OrderStatus,
} from '../types';
import { CATEGORIES, formatIDR } from '../seedData';

interface AdminDashboardProps {
  userEmail: string | null;
  isFirebaseAdmin: boolean;
  isAdminPinUnlocked: boolean;
  onUnlockAdminPin: (emailInput: string, pinInput: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  products: Product[];
  orders: Order[];
  customers: Customer[];
  onSaveProduct: (
    productData: Omit<Product, 'id' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSeedDefaultCatalog: () => Promise<void>;
  onApproveOrRejectPayment: (
    order: Order,
    newPaymentStatus: PaymentStatus,
    newOrderStatus: OrderStatus,
    adminNotes: string
  ) => Promise<void>;
  onUpdateCustomer: (customer: Customer) => Promise<void>;
  isLoadingAction: boolean;
}

type AdminTab =
  | 'products'
  | 'orders'
  | 'approvals'
  | 'customers'
  | 'sales_report';

const SUBTYPES_BY_CATEGORY: Record<ProductCategory, ProductSubType[]> = {
  'Parfum & Lip Oil': ['Perfume', 'Lip Oil'],
  'Tas & Sepatu': ['Tas', 'Sepatu'],
  'Jam Tangan & Baju': ['Jam Tangan', 'Baju'],
};

const DEFAULT_IMAGES_BY_SUBTYPE: Record<ProductSubType, string> = {
  Perfume: '/src/assets/images/ysl_perfume_collection_1791516916656.jpg',
  'Lip Oil': '/src/assets/images/ysl_lip_oil_collection_1791516929517.jpg',
  Tas: '/src/assets/images/ysl_leather_bag_shoes_1791516940750.jpg',
  Sepatu: '/src/assets/images/ysl_leather_bag_shoes_1791516940750.jpg',
  'Jam Tangan': '/src/assets/images/ysl_watch_couture_1791516951016.jpg',
  Baju: '/src/assets/images/ysl_couture_clothing_blazer_1791518017079.jpg',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userEmail,
  isFirebaseAdmin,
  isAdminPinUnlocked,
  onUnlockAdminPin,
  onGoogleLogin,
  products,
  orders,
  customers,
  onSaveProduct,
  onDeleteProduct,
  onSeedDefaultCatalog,
  onApproveOrRejectPayment,
  onUpdateCustomer,
  isLoadingAction,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [loginEmail, setLoginEmail] = useState(userEmail || 'arizo4212@gmail.com');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Product Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [sku, setSku] = useState('YSL-NEW-013');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Parfum & Lip Oil');
  const [subType, setSubType] = useState<ProductSubType>('Perfume');
  const [price, setPrice] = useState<number>(1850000);
  const [stock, setStock] = useState<number>(15);
  const [volumeOrSize, setVolumeOrSize] = useState('90 ml');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(
    DEFAULT_IMAGES_BY_SUBTYPE['Perfume']
  );
  const [featured, setFeatured] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Order & Approval Inspection Modal
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');

  // Customer Edit Modal
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custPostal, setCustPostal] = useState('');

  // Form Login Gate if not authenticated or Admin Session not unlocked
  if (!userEmail || (!isFirebaseAdmin && !isAdminPinUnlocked)) {
    const handleAdminSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError(null);
      try {
        await onUnlockAdminPin(loginEmail.trim(), loginPin.trim());
      } catch (err) {
        setLoginError(
          err instanceof Error ? err.message : 'Gagal verifikasi kredensial Admin.'
        );
      }
    };

    return (
      <section className="max-w-xl mx-auto my-12 px-6">
        <div className="bg-white border border-[#E5E0D8] p-8 md:p-10">
          <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-5 mb-6">
            <div>
              <p className="text-xs text-[#71706B] tracking-widest uppercase">
                YSL Maison Administration
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-[#141413] mt-1">
                Portal Login Pengelola
              </h2>
            </div>
            <Lock className="w-6 h-6 text-[#A6823C]" />
          </div>

          <p className="text-sm text-[#71706B] leading-relaxed mb-6">
            Masuk ke konsol manajemen tunggal YSL Beauty & Maison untuk mengelola
            12 katalog produk & stok, riwayat pesanan, data pelanggan, persetujuan
            bukti pembayaran, serta laporan penjualan real-time dari Firestore.
          </p>

          {!userEmail ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#141413] leading-relaxed">
                Untuk menulis perubahan ke database produksi Firestore yang
                terlindungi, silakan autentikasi akun Google Anda terlebih dahulu.
              </div>
              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full py-3 px-5 bg-[#141413] text-white text-sm font-medium hover:bg-[#292826] transition-colors cursor-pointer"
              >
                Masuk dengan Google (Otentikasi Database)
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1.5">
                  Email Administrator Terdaftar
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5E0D8] focus:outline-none focus:border-[#141413]"
                  placeholder="arizo4212@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1.5">
                  Kode Akses / Passkey Admin Maison
                </label>
                <input
                  type="password"
                  required
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5E0D8] focus:outline-none focus:border-[#141413] font-mono-tabular"
                  placeholder="Masukkan kode akses: YSL2026"
                />
                <p className="text-xs text-[#71706B] mt-1.5">
                  Gunakan kode otorisasi standar butik: <span className="font-mono-tabular font-semibold text-[#141413]">YSL2026</span>
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-[#FDF2F2] border border-[#F5C2C2] text-xs text-[#991B1B]">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoadingAction}
                className="w-full py-3 px-5 bg-[#141413] text-white text-sm font-medium hover:bg-[#292826] transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoadingAction ? 'Memverifikasi Otoritas...' : 'Buka Konsol Admin YSL'}
              </button>
            </form>
          )}
        </div>
      </section>
    );
  }

  // Open Product Modal for Create or Edit
  const openNewProductModal = () => {
    setEditingProduct(null);
    const nextNum = String(products.length + 1).padStart(3, '0');
    setSku(`YSL-PRD-${nextNum}`);
    setName('');
    setCategory('Parfum & Lip Oil');
    setSubType('Perfume');
    setPrice(2500000);
    setStock(10);
    setVolumeOrSize('90 ml');
    setDescription('');
    setImageUrl(DEFAULT_IMAGES_BY_SUBTYPE['Perfume']);
    setFeatured(false);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setSku(prod.sku);
    setName(prod.name);
    setCategory(prod.category);
    setSubType(prod.subType);
    setPrice(prod.price);
    setStock(prod.stock);
    setVolumeOrSize(prod.volumeOrSize);
    setDescription(prod.description);
    setImageUrl(prod.imageUrl);
    setFeatured(prod.featured);
    setIsProductModalOpen(true);
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSku = sku
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 40);
    await onSaveProduct(
      {
        sku: cleanSku || 'YSL-ITEM-01',
        name: name.trim().slice(0, 120),
        category,
        subType,
        price: Math.max(0, Number(price)),
        stock: Math.max(0, Math.floor(Number(stock))),
        description:
          description.trim().length >= 10
            ? description.trim().slice(0, 600)
            : `${name.trim()} koleksi eksklusif Yves Saint Laurent Beauté & Maison.`,
        volumeOrSize: volumeOrSize.trim().slice(0, 60) || 'Standard Edition',
        imageUrl: imageUrl.trim() || DEFAULT_IMAGES_BY_SUBTYPE[subType],
        featured,
      },
      editingProduct?.id
    );
    setIsProductModalOpen(false);
  };

  // Sales & Metrics Computations
  const pendingApprovalOrders = orders.filter(
    (o) => o.paymentStatus === 'waiting_approval'
  );
  const approvedOrders = orders.filter((o) => o.paymentStatus === 'approved');
  const totalRevenueApproved = approvedOrders.reduce(
    (acc, o) => acc + o.totalAmount,
    0
  );
  const totalUnitsSoldApproved = approvedOrders.reduce(
    (acc, o) => acc + o.itemCount,
    0
  );
  const totalStockAvailable = products.reduce((acc, p) => acc + p.stock, 0);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      categoryFilter === 'ALL' || p.category === categoryFilter;
    const q = productSearch.toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.subType.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'ALL') return true;
    return o.orderStatus === orderStatusFilter;
  });

  // Export Sales Report CSV
  const handleDownloadSalesCsv = () => {
    const headers = [
      'Order Number',
      'Tanggal',
      'Pelanggan',
      'Email',
      'Metode Pembayaran',
      'Status Pembayaran',
      'Status Order',
      'Jumlah Item',
      'Total Nominal (IDR)',
    ];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString('id-ID'),
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.customerEmail,
      o.paymentMethod,
      o.paymentStatus,
      o.orderStatus,
      o.itemCount,
      o.totalAmount,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Sales_YSL_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E5E0D8] pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#71706B]">
            <ShieldCheck className="w-4 h-4 text-[#1E3A2F]" />
            <span>Single Source of Truth · Real-Time Firestore Database</span>
            <span>·</span>
            <span>Admin: {userEmail}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#141413] mt-1">
            Executive Admin Panel YSL Maison
          </h1>
        </div>

        {/* Navigation Tabs for the 5 Required Admin Modules */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F2EFE9] p-1.5 border border-[#E5E0D8]">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#141413] text-white'
                : 'text-[#141413] hover:bg-white/70'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Data Produk & Stok ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-[#141413] text-white'
                : 'text-[#141413] hover:bg-white/70'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>
              Approval Pembayaran ({pendingApprovalOrders.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#141413] text-white'
                : 'text-[#141413] hover:bg-white/70'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Data Order & Riwayat ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-[#141413] text-white'
                : 'text-[#141413] hover:bg-white/70'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Pelanggan ({customers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sales_report')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'sales_report'
                ? 'bg-[#141413] text-white'
                : 'text-[#141413] hover:bg-white/70'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Laporan Sales</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="bg-white border border-[#E5E0D8] p-5">
          <p className="text-xs text-[#71706B]">Total Katalog & Unit Stok</p>
          <p className="text-2xl font-semibold text-[#141413] font-mono-tabular mt-2">
            {products.length} Produk · {totalStockAvailable} Unit
          </p>
          <p className="text-xs text-[#71706B] mt-1">
            3 Kategori Utama YSL Beauty & Maison
          </p>
        </div>

        <div className="bg-white border border-[#E5E0D8] p-5">
          <p className="text-xs text-[#71706B]">Menunggu Approval Bukti Bayar</p>
          <p className="text-2xl font-semibold text-[#A6823C] font-mono-tabular mt-2">
            {pendingApprovalOrders.length} Transaksi
          </p>
          <p className="text-xs text-[#71706B] mt-1">
            Perlu verifikasi mutasi rekening / QRIS
          </p>
        </div>

        <div className="bg-white border border-[#E5E0D8] p-5">
          <p className="text-xs text-[#71706B]">Total Pelanggan Terdaftar</p>
          <p className="text-2xl font-semibold text-[#141413] font-mono-tabular mt-2">
            {customers.length} Pelanggan
          </p>
          <p className="text-xs text-[#71706B] mt-1">
            Tersinkronisasi dengan riwayat order
          </p>
        </div>

        <div className="bg-white border border-[#E5E0D8] p-5">
          <p className="text-xs text-[#71706B]">Total Penjualan Disetujui (Approved)</p>
          <p className="text-2xl font-semibold text-[#1E3A2F] font-mono-tabular mt-2">
            {formatIDR(totalRevenueApproved)}
          </p>
          <p className="text-xs text-[#71706B] mt-1">
            {approvedOrders.length} order lunas · {totalUnitsSoldApproved} item terjual
          </p>
        </div>
      </div>

      {/* MODULE 1: DATA PRODUK DAN STOK */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E5E0D8] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#71706B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Cari nama produk, SKU, tipe..."
                  className="pl-9 pr-4 py-2 text-xs bg-[#FAF8F5] border border-[#E5E0D8] focus:outline-none focus:border-[#141413] w-64"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 border border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap ${
                    categoryFilter === 'ALL'
                      ? 'bg-[#141413] text-white'
                      : 'text-[#71706B] hover:text-[#141413]'
                  }`}
                >
                  Semua ({products.length})
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-[#141413] text-white'
                        : 'text-[#71706B] hover:text-[#141413]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onSeedDefaultCatalog}
                disabled={isLoadingAction}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#E5E0D8] text-[#141413] hover:bg-[#FAF8F5] transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sinkronisasi Katalog Lengkap YSL</span>
              </button>

              <button
                type="button"
                onClick={openNewProductModal}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#141413] text-white hover:bg-[#292826] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Produk</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D8] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E0D8] bg-[#FAF8F5] text-[11px] uppercase tracking-wider text-[#71706B]">
                  <th className="py-3.5 px-4">Produk & SKU</th>
                  <th className="py-3.5 px-4">Kategori (3 Pilar)</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4">Ukuran / Spek</th>
                  <th className="py-3.5 px-4 text-right">Harga Satuan</th>
                  <th className="py-3.5 px-4 text-center">Stok Real-Time</th>
                  <th className="py-3.5 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8] text-sm">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-[#FAF8F5]/60 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover bg-[#F2EFE9] border border-[#E5E0D8] shrink-0"
                        />
                        <div>
                          <p className="font-medium text-[#141413]">
                            {product.name}
                          </p>
                          <p className="text-xs text-[#71706B] font-mono-tabular">
                            {product.sku} {product.featured ? '· Highlight' : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-[#141413]">
                      {product.category}
                    </td>
                    <td className="py-4 px-4 text-xs text-[#71706B]">
                      {product.subType}
                    </td>
                    <td className="py-4 px-4 text-xs text-[#71706B]">
                      {product.volumeOrSize}
                    </td>
                    <td className="py-4 px-4 text-right font-mono-tabular font-medium text-[#141413]">
                      {formatIDR(product.price)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={isLoadingAction || product.stock <= 0}
                          onClick={() =>
                            onSaveProduct(
                              {
                                sku: product.sku,
                                name: product.name,
                                category: product.category,
                                subType: product.subType,
                                price: product.price,
                                stock: Math.max(0, product.stock - 1),
                                description: product.description,
                                volumeOrSize: product.volumeOrSize,
                                imageUrl: product.imageUrl,
                                featured: product.featured,
                              },
                              product.id
                            )
                          }
                          className="w-6 h-6 border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono-tabular hover:border-[#141413] cursor-pointer disabled:opacity-40"
                          title="Kurangi 1 stok"
                        >
                          -
                        </button>
                        <span
                          className={`font-mono-tabular text-xs font-semibold min-w-[3rem] text-center ${
                            product.stock <= 3
                              ? 'text-[#991B1B]'
                              : 'text-[#141413]'
                          }`}
                        >
                          {product.stock}
                        </span>
                        <button
                          type="button"
                          disabled={isLoadingAction}
                          onClick={() =>
                            onSaveProduct(
                              {
                                sku: product.sku,
                                name: product.name,
                                category: product.category,
                                subType: product.subType,
                                price: product.price,
                                stock: product.stock + 1,
                                description: product.description,
                                volumeOrSize: product.volumeOrSize,
                                imageUrl: product.imageUrl,
                                featured: product.featured,
                              },
                              product.id
                            )
                          }
                          className="w-6 h-6 border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono-tabular hover:border-[#141413] cursor-pointer disabled:opacity-40"
                          title="Tambah 1 stok"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProductModal(product)}
                          className="p-1.5 text-[#71706B] hover:text-[#141413] border border-[#E5E0D8] cursor-pointer"
                          title="Edit Produk"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 text-[#71706B] hover:text-[#991B1B] border border-[#E5E0D8] cursor-pointer"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 2: APPROVAL BUKTI PEMBAYARAN DARI PELANGGAN */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E0D8] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#141413]">
                Verifikasi & Approval Bukti Pembayaran Pelanggan
              </h2>
              <p className="text-xs text-[#71706B] mt-0.5">
                Periksa bukti transfer atau resi QRIS yang diunggah pelanggan,
                lalu klik Setujui (Approve) untuk memproses pengiriman atau Tolak
                (Reject) bila mutasi tidak sesuai.
              </p>
            </div>
            <div className="text-xs font-mono-tabular text-[#141413]">
              Menunggu Verifikasi: <strong>{pendingApprovalOrders.length}</strong>{' '}
              · Total Disetujui: <strong>{approvedOrders.length}</strong>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white border border-[#E5E0D8] p-12 text-center">
              <p className="text-base text-[#141413] font-medium">
                Belum ada bukti pembayaran yang masuk
              </p>
              <p className="text-xs text-[#71706B] mt-1">
                Pesanan baru dari pelanggan beserta foto bukti transfer akan
                muncul secara otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-[#E5E0D8] p-6 flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 border-b border-[#E5E0D8] pb-4">
                      <div>
                        <span className="font-mono-tabular text-xs font-semibold text-[#141413]">
                          {order.orderNumber}
                        </span>
                        <span className="mx-2 text-[#71706B]">·</span>
                        <span className="text-xs text-[#71706B]">
                          {new Date(order.createdAt).toLocaleString('id-ID')}
                        </span>
                        <h3 className="text-lg font-semibold text-[#141413] mt-1">
                          {order.customerName}
                        </h3>
                        <p className="text-xs text-[#71706B]">
                          {order.customerEmail} · {order.customerPhone}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-mono-tabular text-base font-semibold text-[#141413]">
                          {formatIDR(order.totalAmount)}
                        </p>
                        <p className="text-xs text-[#71706B] mt-0.5">
                          Status Bayar:{' '}
                          <strong
                            className={
                              order.paymentStatus === 'approved'
                                ? 'text-[#1E3A2F]'
                                : order.paymentStatus === 'rejected'
                                ? 'text-[#991B1B]'
                                : 'text-[#A6823C]'
                            }
                          >
                            {order.paymentStatus === 'approved'
                              ? 'DISETUJUI'
                              : order.paymentStatus === 'rejected'
                              ? 'DITOLAK'
                              : 'MENUNGGU APPROVAL'}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[#71706B] block">
                            Metode & Pengirim:
                          </span>
                          <span className="font-medium text-[#141413]">
                            {order.paymentMethod} — {order.paymentAccountSender}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#71706B] block">
                            Nomor Referensi Bank:
                          </span>
                          <span className="font-mono-tabular font-medium text-[#141413]">
                            {order.paymentReferenceNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#71706B] block">
                            Rincian Produk ({order.itemCount} unit):
                          </span>
                          <span className="text-[#141413] leading-relaxed">
                            {order.itemsSummary}
                          </span>
                        </div>
                        {order.adminNotes && (
                          <div>
                            <span className="text-[#71706B] block">
                              Catatan Verifikasi Admin:
                            </span>
                            <span className="text-[#141413] italic">
                              "{order.adminNotes}"
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="border border-[#E5E0D8] bg-[#FAF8F5] p-2 flex flex-col items-center justify-center">
                        <img
                          src={order.paymentProofImage}
                          alt={`Bukti bayar ${order.orderNumber}`}
                          referrerPolicy="no-referrer"
                          className="max-h-44 object-contain cursor-pointer"
                          onClick={() => {
                            setInspectingOrder(order);
                            setAdminNotesInput(order.adminNotes || '');
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setInspectingOrder(order);
                            setAdminNotesInput(order.adminNotes || '');
                          }}
                          className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#141413] hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Perbesar Bukti Pembayaran</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E5E0D8]">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectingOrder(order);
                        setAdminNotesInput(order.adminNotes || '');
                      }}
                      className="px-3.5 py-2 text-xs font-medium border border-[#E5E0D8] text-[#141413] hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Detail & Catatan Admin
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={
                          isLoadingAction || order.paymentStatus === 'rejected'
                        }
                        onClick={() =>
                          onApproveOrRejectPayment(
                            order,
                            'rejected',
                            'cancelled',
                            'Bukti pembayaran tidak sesuai mutasi rekening.'
                          )
                        }
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#F5C2C2] text-[#991B1B] bg-[#FDF2F2] hover:bg-[#FCE8E8] cursor-pointer disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Tolak Bukti</span>
                      </button>

                      <button
                        type="button"
                        disabled={
                          isLoadingAction || order.paymentStatus === 'approved'
                        }
                        onClick={() =>
                          onApproveOrRejectPayment(
                            order,
                            'approved',
                            'processing',
                            'Pembayaran terverifikasi lunas oleh Admin YSL.'
                          )
                        }
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#1E3A2F] text-white hover:bg-[#162B22] cursor-pointer disabled:opacity-40"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Pembayaran</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODULE 3: DATA ORDER DAN RIWAYAT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E5E0D8] p-5">
            <div>
              <h2 className="text-xl font-semibold text-[#141413]">
                Data Order & Riwayat Pemenuhan Pesanan
              </h2>
              <p className="text-xs text-[#71706B]">
                Kelola siklus pengiriman pesanan mulai dari verifikasi pembayaran,
                pengemasan (processing), pengiriman kurir (shipped), hingga
                selesai (completed).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-[#FAF8F5] p-1 border border-[#E5E0D8]">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'pending_verification', label: 'Verifikasi' },
                { id: 'processing', label: 'Diproses' },
                { id: 'shipped', label: 'Dikirim' },
                { id: 'completed', label: 'Selesai' },
                { id: 'cancelled', label: 'Dibatalkan' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setOrderStatusFilter(st.id)}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap ${
                    orderStatusFilter === st.id
                      ? 'bg-[#141413] text-white'
                      : 'text-[#71706B] hover:text-[#141413]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D8] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E0D8] bg-[#FAF8F5] text-[11px] uppercase tracking-wider text-[#71706B]">
                  <th className="py-3.5 px-4">No. Order & Waktu</th>
                  <th className="py-3.5 px-4">Pelanggan & Alamat</th>
                  <th className="py-3.5 px-4">Item Pesanan</th>
                  <th className="py-3.5 px-4 text-right">Total Nominal</th>
                  <th className="py-3.5 px-4">Approval Bayar</th>
                  <th className="py-3.5 px-4">Status Order</th>
                  <th className="py-3.5 px-4 text-right">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8] text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-[#71706B]"
                    >
                      Tidak ada riwayat pesanan pada filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF8F5]/60">
                      <td className="py-4 px-4">
                        <p className="font-mono-tabular font-semibold text-[#141413]">
                          {order.orderNumber}
                        </p>
                        <p className="text-[#71706B] mt-0.5">
                          {new Date(order.createdAt).toLocaleString('id-ID')}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-[#141413]">
                          {order.customerName}
                        </p>
                        <p className="text-[#71706B]">{order.customerPhone}</p>
                        <p className="text-[#71706B] max-w-xs truncate">
                          {order.shippingAddress}
                        </p>
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-[#141413] line-clamp-2">
                          {order.itemsSummary}
                        </p>
                        <p className="text-[#71706B] mt-0.5">
                          {order.itemCount} unit · {order.paymentMethod}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-right font-mono-tabular font-semibold text-[#141413]">
                        {formatIDR(order.totalAmount)}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`font-medium ${
                            order.paymentStatus === 'approved'
                              ? 'text-[#1E3A2F]'
                              : order.paymentStatus === 'rejected'
                              ? 'text-[#991B1B]'
                              : 'text-[#A6823C]'
                          }`}
                        >
                          {order.paymentStatus === 'approved'
                            ? 'Approved'
                            : order.paymentStatus === 'rejected'
                            ? 'Rejected'
                            : 'Waiting Approval'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-[#141413]">
                        {order.orderStatus}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <select
                          aria-label={`Ubah status ${order.orderNumber}`}
                          value={order.orderStatus}
                          disabled={isLoadingAction}
                          onChange={(e) => {
                            const nextOrderSt = e.target.value as OrderStatus;
                            const nextPaySt: PaymentStatus =
                              nextOrderSt === 'processing' ||
                              nextOrderSt === 'shipped' ||
                              nextOrderSt === 'completed'
                                ? 'approved'
                                : nextOrderSt === 'cancelled'
                                ? 'rejected'
                                : order.paymentStatus;
                            onApproveOrRejectPayment(
                              order,
                              nextPaySt,
                              nextOrderSt,
                              order.adminNotes ||
                                `Status diperbarui ke ${nextOrderSt}`
                            );
                          }}
                          className="px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D8] text-[#141413] focus:outline-none focus:border-[#141413]"
                        >
                          <option value="pending_verification">
                            pending_verification
                          </option>
                          <option value="processing">processing</option>
                          <option value="shipped">shipped</option>
                          <option value="completed">completed</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 4: DATA PELANGGAN */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E0D8] p-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#141413]">
                Direktori Data Pelanggan YSL Maison
              </h2>
              <p className="text-xs text-[#71706B]">
                Data profil, kontak pengiriman, dan akumulasi transaksi pelanggan
                yang tersimpan di koleksi Firestore `/customers`.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D8] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E0D8] bg-[#FAF8F5] text-[11px] uppercase tracking-wider text-[#71706B]">
                  <th className="py-3.5 px-4">Nama Pelanggan</th>
                  <th className="py-3.5 px-4">Kontak (Email & Telepon)</th>
                  <th className="py-3.5 px-4">Alamat Pengiriman Utama</th>
                  <th className="py-3.5 px-4 text-center">Jumlah Order</th>
                  <th className="py-3.5 px-4 text-right">Total Belanja</th>
                  <th className="py-3.5 px-4 text-right">Pembaruan Terakhir</th>
                  <th className="py-3.5 px-4 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8] text-xs">
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-[#71706B]"
                    >
                      Belum ada data pelanggan terdaftar. Data pelanggan otomatis
                      tercatat saat checkout pesanan.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF8F5]/60">
                      <td className="py-4 px-4 font-medium text-[#141413]">
                        {c.name}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-[#141413]">{c.email}</p>
                        <p className="text-[#71706B] font-mono-tabular">
                          {c.phone}
                        </p>
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-[#141413]">{c.address}</p>
                        <p className="text-[#71706B]">
                          {c.city} · {c.postalCode}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-center font-mono-tabular font-semibold text-[#141413]">
                        {c.totalOrders}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-tabular font-semibold text-[#1E3A2F]">
                        {formatIDR(c.totalSpent)}
                      </td>
                      <td className="py-4 px-4 text-right text-[#71706B]">
                        {new Date(c.updatedAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCustomer(c);
                            setCustName(c.name);
                            setCustPhone(c.phone);
                            setCustAddress(c.address);
                            setCustCity(c.city);
                            setCustPostal(c.postalCode);
                          }}
                          className="px-3 py-1.5 border border-[#E5E0D8] text-[#141413] hover:bg-[#FAF8F5] cursor-pointer"
                        >
                          Edit Profil
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 5: LAPORAN SALES */}
      {activeTab === 'sales_report' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E0D8] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#141413]">
                Laporan Sales & Analitik Pendapatan Real-Time
              </h2>
              <p className="text-xs text-[#71706B] mt-0.5">
                Rekapitulasi performa penjualan berdasarkan status approval
                pembayaran, metode pembayaran, dan rincian transaksi.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadSalesCsv}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#141413] text-white text-xs font-medium hover:bg-[#292826] transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Laporan Sales</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['Bank Transfer BCA', 'Bank Transfer Mandiri', 'QRIS YSL Beaute'] as const).map(
              (method) => {
                const methodOrders = approvedOrders.filter(
                  (o) => o.paymentMethod === method
                );
                const methodTotal = methodOrders.reduce(
                  (sum, o) => sum + o.totalAmount,
                  0
                );
                return (
                  <div
                    key={method}
                    className="bg-white border border-[#E5E0D8] p-5"
                  >
                    <div className="flex items-center justify-between text-xs text-[#71706B]">
                      <span>Kanal Pembayaran (Approved)</span>
                      <ArrowUpRight className="w-4 h-4 text-[#A6823C]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#141413] mt-1">
                      {method}
                    </h3>
                    <p className="text-2xl font-semibold font-mono-tabular text-[#1E3A2F] mt-3">
                      {formatIDR(methodTotal)}
                    </p>
                    <p className="text-xs text-[#71706B] mt-1 font-mono-tabular">
                      {methodOrders.length} transaksi lunas terverifikasi
                    </p>
                  </div>
                );
              }
            )}
          </div>

          <div className="bg-white border border-[#E5E0D8] p-6">
            <h3 className="text-lg font-semibold text-[#141413] mb-4">
              Jurnal Transaksi Penjualan (Approved & Pending)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E0D8] bg-[#FAF8F5] text-[11px] uppercase tracking-wider text-[#71706B]">
                    <th className="py-3 px-4">No. Order</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4">Status Approval</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-right">Nilai Penjualan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8] text-xs">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#FAF8F5]/60">
                      <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#141413]">
                        {o.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-[#71706B]">
                        {new Date(o.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-[#141413]">
                        {o.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-[#71706B]">
                        {o.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={
                            o.paymentStatus === 'approved'
                              ? 'text-[#1E3A2F] font-semibold'
                              : o.paymentStatus === 'rejected'
                              ? 'text-[#991B1B]'
                              : 'text-[#A6823C]'
                          }
                        >
                          {o.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono-tabular">
                        {o.itemCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#141413]">
                        {formatIDR(o.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT PRODUK */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E5E0D8] max-w-lg w-full p-6 md:p-8 my-8">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4 mb-5">
              <h3 className="text-xl font-semibold text-[#141413]">
                {editingProduct ? 'Edit Data Produk & Stok' : 'Tambah Produk YSL Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-xs text-[#71706B] hover:text-[#141413] cursor-pointer"
              >
                Tutup [X]
              </button>
            </div>

            <form onSubmit={handleProductFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#141413] mb-1">
                    Kode SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#141413] mb-1">
                    Ukuran / Volume
                  </label>
                  <input
                    type="text"
                    required
                    value={volumeOrSize}
                    onChange={(e) => setVolumeOrSize(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#141413] mb-1">
                  Nama Produk
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#141413] mb-1">
                    Kategori (3 Kategori Utama)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const nextCat = e.target.value as ProductCategory;
                      const firstSub = SUBTYPES_BY_CATEGORY[nextCat][0];
                      setCategory(nextCat);
                      setSubType(firstSub);
                      setImageUrl(DEFAULT_IMAGES_BY_SUBTYPE[firstSub]);
                    }}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#141413] mb-1">
                    Sub-Tipe Produk
                  </label>
                  <select
                    value={subType}
                    onChange={(e) => {
                      const nextSub = e.target.value as ProductSubType;
                      setSubType(nextSub);
                      setImageUrl(DEFAULT_IMAGES_BY_SUBTYPE[nextSub]);
                    }}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                  >
                    {SUBTYPES_BY_CATEGORY[category].map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#141413] mb-1">
                    Harga (IDR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#141413] mb-1">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#141413] mb-1">
                  Deskripsi Editorial Produk (Min. 10 Karakter)
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="featured-Check"
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                <label htmlFor="featured-Check" className="text-[#141413]">
                  Tampilkan sebagai produk unggulan (Featured)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E0D8] text-[#141413] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoadingAction}
                  className="px-5 py-2 bg-[#141413] text-white font-medium cursor-pointer"
                >
                  Simpan ke Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSPEKSI BUKTI PEMBAYARAN & APPROVAL */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E5E0D8] max-w-xl w-full p-6 md:p-8 my-8">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4 mb-5">
              <div>
                <span className="font-mono-tabular text-xs text-[#71706B]">
                  {inspectingOrder.orderNumber}
                </span>
                <h3 className="text-xl font-semibold text-[#141413]">
                  Inspeksi Bukti Pembayaran — {inspectingOrder.customerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="text-xs text-[#71706B] hover:text-[#141413] cursor-pointer"
              >
                Tutup [X]
              </button>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E5E0D8] p-3 mb-5 flex justify-center">
              <img
                src={inspectingOrder.paymentProofImage}
                alt="Bukti Transfer"
                referrerPolicy="no-referrer"
                className="max-h-80 object-contain"
              />
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-[#71706B]">Nominal Pesanan:</span>
                <span className="font-mono-tabular font-semibold text-[#141413]">
                  {formatIDR(inspectingOrder.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71706B]">Metode & Pengirim:</span>
                <span className="font-medium text-[#141413]">
                  {inspectingOrder.paymentMethod} ·{' '}
                  {inspectingOrder.paymentAccountSender}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71706B]">Nomor Referensi:</span>
                <span className="font-mono-tabular text-[#141413]">
                  {inspectingOrder.paymentReferenceNumber}
                </span>
              </div>
              <div>
                <label className="block font-medium text-[#141413] mb-1">
                  Catatan Verifikasi Admin:
                </label>
                <input
                  type="text"
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Contoh: Mutasi BCA sesuai, pesanan segera dikirim"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E0D8]">
              <button
                type="button"
                onClick={async () => {
                  await onApproveOrRejectPayment(
                    inspectingOrder,
                    'rejected',
                    'cancelled',
                    adminNotesInput || 'Bukti pembayaran ditolak oleh Admin.'
                  );
                  setInspectingOrder(null);
                }}
                className="px-4 py-2 text-xs font-medium border border-[#F5C2C2] text-[#991B1B] bg-[#FDF2F2] cursor-pointer"
              >
                Tolak Pembayaran
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onApproveOrRejectPayment(
                    inspectingOrder,
                    'approved',
                    'processing',
                    adminNotesInput || 'Bukti pembayaran disetujui lunas.'
                  );
                  setInspectingOrder(null);
                }}
                className="px-5 py-2 text-xs font-medium bg-[#1E3A2F] text-white cursor-pointer"
              >
                Setujui (Approve) & Proses Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PELANGGAN */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E0D8] max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-[#141413] mb-4">
              Perbarui Data Pelanggan
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onUpdateCustomer({
                  ...editingCustomer,
                  name: custName.trim().slice(0, 100),
                  phone: custPhone.trim().slice(0, 30),
                  address: custAddress.trim().slice(0, 400),
                  city: custCity.trim().slice(0, 80),
                  postalCode: custPostal.trim().slice(0, 15),
                });
                setEditingCustomer(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-medium mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  required
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  required
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Kota</label>
                  <input
                    type="text"
                    required
                    value={custCity}
                    onChange={(e) => setCustCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Kode Pos</label>
                  <input
                    type="text"
                    required
                    value={custPostal}
                    onChange={(e) => setCustPostal(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 border border-[#E5E0D8] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#141413] text-white cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

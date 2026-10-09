/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import {
  ShoppingBag,
  Search,
  Plus,
  Check,
  Shield,
  LogOut,
  UserCheck,
  SlidersHorizontal,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from './firebase';
import {
  Product,
  ProductCategory,
  CartItem,
  Order,
  Customer,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
} from './types';
import {
  INITIAL_YSL_PRODUCTS,
  HERO_CAMPAIGN_IMAGE,
  CATEGORIES,
  formatIDR,
} from './seedData';
import { AdminDashboard } from './components/AdminDashboard';
import { CartDrawer, CustomerOrdersView } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';

type ActiveView = 'storefront' | 'my_orders' | 'admin';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false);
  const [isAdminPinUnlocked, setIsAdminPinUnlocked] = useState(false);

  // Navigation & Filter States
  const [activeView, setActiveView] = useState<ActiveView>('storefront');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubType, setSelectedSubType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Firestore Collections State (Single Source of Truth)
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Shopping Cart & Product Modal State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ysl_maison_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductModal, setSelectedProductModal] =
    useState<Product | null>(null);
  const [addedProductToast, setAddedProductToast] = useState<string | null>(
    null
  );
  const [systemBanner, setSystemBanner] = useState<string | null>(null);

  // Persist shopping cart locally until checkout commits to Firestore
  useEffect(() => {
    try {
      localStorage.setItem('ysl_maison_cart', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  // 1. Test Firestore connection & listen to Auth state
  useEffect(() => {
    testFirestoreConnection();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
      if (user?.email === 'arizo4212@gmail.com' && user.emailVerified) {
        setIsFirebaseAdmin(true);
      } else {
        setIsFirebaseAdmin(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Check /admins/{uid} document if user is signed in
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;
    const adminDocRef = doc(db, 'admins', currentUser.uid);
    const unsubAdmin = onSnapshot(
      adminDocRef,
      (snap) => {
        if (snap.exists()) {
          setIsFirebaseAdmin(true);
          setIsAdminPinUnlocked(true);
        }
      },
      () => {
        // Non-admin user reading own admin doc is allowed; ignore if missing
      }
    );
    return () => unsubAdmin();
  }, [isAuthReady, currentUser]);

  // 3. Real-time listener on /products (Public Catalog)
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubProducts = onSnapshot(
      productsRef,
      async (snapshot) => {
        const loaded: Product[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }));
        loaded.sort((a, b) => a.sku.localeCompare(b.sku));
        setProducts(loaded);
        setIsLoadingCatalog(false);

        // Auto-seed or sync missing default YSL products (including new Baju items) into Firestore if user is Admin
        if (
          loaded.length < INITIAL_YSL_PRODUCTS.length &&
          auth.currentUser &&
          auth.currentUser.email === 'arizo4212@gmail.com'
        ) {
          try {
            const existingIds = new Set(loaded.map((p) => p.id));
            const batch = writeBatch(db);
            const now = new Date().toISOString();
            INITIAL_YSL_PRODUCTS.forEach((item) => {
              if (!existingIds.has(item.id) || item.subType === 'Baju') {
                const ref = doc(db, 'products', item.id);
                batch.set(ref, {
                  sku: item.sku,
                  name: item.name,
                  category: item.category,
                  subType: item.subType,
                  price: item.price,
                  stock: item.stock,
                  description: item.description,
                  volumeOrSize: item.volumeOrSize,
                  imageUrl: item.imageUrl,
                  featured: item.featured,
                  updatedAt: now,
                });
              }
            });
            await batch.commit();
          } catch (err) {
            console.error('Auto-seed error:', err);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );

    return () => unsubProducts();
  }, [currentUser]);

  // 4. Real-time listener on /orders and /customers (Role-isolated per Firestore rules)
  useEffect(() => {
    if (!isAuthReady || !currentUser) {
      setOrders([]);
      setCustomers([]);
      return;
    }

    const canReadAll =
      currentUser.email === 'arizo4212@gmail.com' || isFirebaseAdmin;

    const ordersQuery = canReadAll
      ? collection(db, 'orders')
      : query(
          collection(db, 'orders'),
          where('customerUid', '==', currentUser.uid)
        );

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const list: Order[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Order, 'id'>),
        }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setOrders(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    const customersQuery = canReadAll
      ? collection(db, 'customers')
      : query(
          collection(db, 'customers'),
          where('uid', '==', currentUser.uid)
        );

    const unsubCustomers = onSnapshot(
      customersQuery,
      (snapshot) => {
        const list: Customer[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Customer, 'id'>),
        }));
        list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setCustomers(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'customers');
      }
    );

    return () => {
      unsubOrders();
      unsubCustomers();
    };
  }, [isAuthReady, currentUser, isFirebaseAdmin]);

  // Merge live Firestore products with INITIAL_YSL_PRODUCTS so any newly added Baju products are immediately visible
  const displayProducts: Product[] = React.useMemo(() => {
    const map = new Map<string, Product>();
    INITIAL_YSL_PRODUCTS.forEach((p) => {
      map.set(p.id, {
        ...p,
        updatedAt: '2026-10-08T00:00:00.000Z',
      });
    });
    products.forEach((p) => {
      map.set(p.id, p);
    });
    return Array.from(map.values()).sort((a, b) => a.sku.localeCompare(b.sku));
  }, [products]);

  // Handlers: Auth
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setSystemBanner(
        error instanceof Error
          ? error.message
          : 'Gagal masuk dengan akun Google.'
      );
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdminPinUnlocked(false);
    setActiveView('storefront');
  };

  // Handler: Admin Form Login & Seed Verification
  const handleUnlockAdminPin = async (emailInput: string, pinInput: string) => {
    if (pinInput !== 'YSL2026') {
      throw new Error(
        'Kode Akses Admin tidak valid. Gunakan kode otorisasi: YSL2026'
      );
    }
    if (!currentUser) {
      throw new Error('Silakan masuk dengan akun Google terlebih dahulu.');
    }
    setIsLoadingAction(true);
    try {
      setIsAdminPinUnlocked(true);
      // If products collection in Firestore is still empty, seed the 12 default YSL products
      if (products.length === 0 && currentUser.email === 'arizo4212@gmail.com') {
        await handleSeedDefaultCatalog();
      }
      setSystemBanner(
        `Selamat datang di Konsol Admin YSL Maison (${emailInput}). Terhubung ke Firestore.`
      );
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Handler: Seed / Sync 12 YSL Products into Firestore
  const handleSeedDefaultCatalog = async () => {
    if (!currentUser) {
      await handleGoogleLogin();
      return;
    }
    setIsLoadingAction(true);
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      INITIAL_YSL_PRODUCTS.forEach((item) => {
        const ref = doc(db, 'products', item.id);
        batch.set(ref, {
          sku: item.sku,
          name: item.name,
          category: item.category,
          subType: item.subType,
          price: item.price,
          stock: item.stock,
          description: item.description,
          volumeOrSize: item.volumeOrSize,
          imageUrl: item.imageUrl,
          featured: item.featured,
          updatedAt: now,
        });
      });
      await batch.commit();
      setSystemBanner(
        `${INITIAL_YSL_PRODUCTS.length} Produk YSL (termasuk 6 koleksi Baju Couture) berhasil disinkronkan ke database Firestore.`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Handler: Save or Update Product in Firestore
  const handleSaveProduct = async (
    productData: Omit<Product, 'id' | 'updatedAt'>,
    existingId?: string
  ) => {
    setIsLoadingAction(true);
    const docId =
      existingId ||
      productData.sku.toLowerCase().replace(/[^a-z0-9-]/g, '-') ||
      `ysl-prod-${Date.now()}`;
    const path = `products/${docId}`;
    try {
      // Ensure the 12 default items exist in Firestore first if admin edits before initial sync
      if (products.length === 0) {
        await handleSeedDefaultCatalog();
      }
      await setDoc(doc(db, 'products', docId), {
        ...productData,
        updatedAt: new Date().toISOString(),
      });
      setSystemBanner(`Data produk "${productData.name}" berhasil disimpan.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setIsLoadingAction(true);
    const path = `products/${productId}`;
    try {
      await deleteDoc(doc(db, 'products', productId));
      setSystemBanner('Produk berhasil dihapus dari katalog database.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Shopping Cart Handlers
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + 1);
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: nextQty } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setAddedProductToast(product.name);
    setTimeout(() => setAddedProductToast(null), 2600);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nextQty = Math.min(
            item.product.stock,
            item.quantity + delta
          );
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Checkout & Real-Time Firestore Order Creation + Stock Decrement + Customer Upsert
  const handleSubmitOrder = async (payload: {
    customerName: string;
    customerPhone: string;
    address: string;
    city: string;
    postalCode: string;
    paymentMethod: PaymentMethod;
    paymentAccountSender: string;
    paymentReferenceNumber: string;
    paymentProofImage: string;
  }): Promise<string> => {
    if (!currentUser) {
      throw new Error('Silakan login terlebih dahulu.');
    }
    if (cart.length === 0) {
      throw new Error('Keranjang belanja kosong.');
    }

    setIsLoadingAction(true);
    const now = new Date().toISOString();
    const orderNumber = `YSL-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const totalAmount = cart.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    );
    const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
    const itemsSummary = cart
      .map((i) => `${i.product.name} (${i.quantity}x)`)
      .join(', ')
      .slice(0, 1450);

    try {
      // 1. Decrement product stock in Firestore if product exists in /products
      if (products.length > 0) {
        for (const item of cart) {
          const liveProd = products.find((p) => p.id === item.product.id);
          if (liveProd) {
            const nextStock = Math.max(0, liveProd.stock - item.quantity);
            await updateDoc(doc(db, 'products', liveProd.id), {
              stock: nextStock,
              updatedAt: now,
            });
          }
        }
      }

      // 2. Create Order document in /orders/{orderId}
      const orderData: Omit<Order, 'id'> = {
        orderNumber,
        customerUid: currentUser.uid,
        customerName: payload.customerName.slice(0, 100),
        customerEmail: (currentUser.email || 'customer@ysl.com').slice(0, 150),
        customerPhone: payload.customerPhone.slice(0, 30),
        shippingAddress:
          `${payload.address}, ${payload.city} ${payload.postalCode}`.slice(
            0,
            500
          ),
        itemsSummary,
        itemCount,
        totalAmount,
        paymentMethod: payload.paymentMethod,
        paymentAccountSender: payload.paymentAccountSender.slice(0, 120),
        paymentReferenceNumber: payload.paymentReferenceNumber.slice(0, 80),
        paymentProofImage: payload.paymentProofImage.slice(0, 345000),
        paymentStatus: 'waiting_approval',
        orderStatus: 'pending_verification',
        adminNotes: '',
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'orders', orderId), orderData);

      // 3. Upsert Customer Profile in /customers/{uid}
      const existingCustomer = customers.find((c) => c.uid === currentUser.uid);
      const customerDoc: Omit<Customer, 'id'> = {
        uid: currentUser.uid,
        name: payload.customerName.slice(0, 100),
        email: (currentUser.email || 'customer@ysl.com').slice(0, 150),
        phone: payload.customerPhone.slice(0, 30),
        address: payload.address.slice(0, 400),
        city: payload.city.slice(0, 80),
        postalCode: payload.postalCode.slice(0, 15),
        totalOrders: (existingCustomer?.totalOrders || 0) + 1,
        totalSpent: (existingCustomer?.totalSpent || 0) + totalAmount,
        updatedAt: now,
      };

      await setDoc(doc(db, 'customers', currentUser.uid), customerDoc);

      setCart([]);
      setSystemBanner(
        `Order ${orderNumber} berhasil dibuat dan bukti pembayaran telah dikirim ke Admin.`
      );
      return orderNumber;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Admin Handler: Approve or Reject Customer Payment Proof
  const handleApproveOrRejectPayment = async (
    order: Order,
    newPaymentStatus: PaymentStatus,
    newOrderStatus: OrderStatus,
    adminNotes: string
  ) => {
    setIsLoadingAction(true);
    const path = `orders/${order.id}`;
    try {
      await setDoc(doc(db, 'orders', order.id), {
        orderNumber: order.orderNumber,
        customerUid: order.customerUid,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        itemsSummary: order.itemsSummary,
        itemCount: order.itemCount,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentAccountSender: order.paymentAccountSender,
        paymentReferenceNumber: order.paymentReferenceNumber,
        paymentProofImage: order.paymentProofImage,
        paymentStatus: newPaymentStatus,
        orderStatus: newOrderStatus,
        adminNotes: adminNotes.slice(0, 400),
        createdAt: order.createdAt,
        updatedAt: new Date().toISOString(),
      });
      setSystemBanner(
        `Status pembayaran ${order.orderNumber} diperbarui menjadi ${newPaymentStatus.toUpperCase()}.`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Customer Handler: Reupload payment proof if needed
  const handleCustomerReuploadProof = async (
    order: Order,
    newSender: string,
    newRef: string,
    newProofImg: string
  ) => {
    const path = `orders/${order.id}`;
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        paymentAccountSender: newSender.trim().slice(0, 120),
        paymentReferenceNumber: newRef.trim().slice(0, 80),
        paymentProofImage: newProofImg.slice(0, 345000),
        paymentStatus: 'waiting_approval',
        updatedAt: new Date().toISOString(),
      });
      setSystemBanner(
        `Bukti pembayaran baru untuk ${order.orderNumber} berhasil dikirim ulang.`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Admin Handler: Update Customer record
  const handleUpdateCustomer = async (customer: Customer) => {
    setIsLoadingAction(true);
    const path = `customers/${customer.id}`;
    try {
      await setDoc(doc(db, 'customers', customer.id), {
        uid: customer.uid,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postalCode: customer.postalCode,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        updatedAt: new Date().toISOString(),
      });
      setSystemBanner(`Data pelanggan ${customer.name} berhasil diperbarui.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Filter Storefront Products
  const filteredStorefrontProducts = displayProducts.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSub =
      selectedSubType === 'ALL' || p.subType === selectedSubType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.subType.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    return matchesCat && matchesSub && matchesSearch;
  });

  const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#141413]">
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-sm border-b border-[#E5E0D8] px-6 lg:px-12 py-4 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('storefront');
            setSelectedCategory('ALL');
            setSelectedSubType('ALL');
          }}
          className="text-xl md:text-2xl font-bold tracking-widest text-[#141413] font-serif-luxury whitespace-nowrap shrink-0"
        >
          YVES SAINT LAURENT
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#71706B]">
          <button
            type="button"
            onClick={() => {
              setActiveView('storefront');
              setSelectedCategory('ALL');
              setSelectedSubType('ALL');
            }}
            className={`hover:text-[#141413] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeView === 'storefront' && selectedCategory === 'ALL'
                ? 'text-[#141413] border-b border-[#141413]'
                : ''
            }`}
          >
            Semua Koleksi ({displayProducts.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('storefront');
              setSelectedCategory('Parfum & Lip Oil');
              setSelectedSubType('ALL');
            }}
            className={`hover:text-[#141413] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeView === 'storefront' &&
              selectedCategory === 'Parfum & Lip Oil'
                ? 'text-[#141413] border-b border-[#141413]'
                : ''
            }`}
          >
            Parfum & Lip Oil
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('storefront');
              setSelectedCategory('Tas & Sepatu');
              setSelectedSubType('ALL');
            }}
            className={`hover:text-[#141413] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeView === 'storefront' && selectedCategory === 'Tas & Sepatu'
                ? 'text-[#141413] border-b border-[#141413]'
                : ''
            }`}
          >
            Tas & Sepatu
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('storefront');
              setSelectedCategory('Jam Tangan & Baju');
              setSelectedSubType('ALL');
            }}
            className={`hover:text-[#141413] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeView === 'storefront' &&
              selectedCategory === 'Jam Tangan & Baju'
                ? 'text-[#141413] border-b border-[#141413]'
                : ''
            }`}
          >
            Jam Tangan & Baju
          </button>

          <button
            type="button"
            onClick={() => setActiveView('admin')}
            className={`hover:text-[#141413] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeView === 'admin'
                ? 'text-[#141413] border-b border-[#141413] font-semibold'
                : ''
            }`}
          >
            Admin Panel
          </button>
        </nav>

        {/* Zone 3: 1 primary action (Shopping Bag) */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-[#141413] hover:bg-[#292826] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shopping Bag ({totalCartItems})</span>
          </button>
        </div>
      </header>

      {/* Secondary Sub-Toolbar for Mobile Nav, Order Tracking, and User Session */}
      <div className="bg-[#F2EFE9] border-b border-[#E5E0D8] px-6 lg:px-12 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveView('storefront')}
            className={`cursor-pointer whitespace-nowrap ${
              activeView === 'storefront'
                ? 'font-semibold text-[#141413]'
                : 'text-[#71706B] hover:text-[#141413]'
            }`}
          >
            Butik Webstore
          </button>
          <span className="text-[#E5E0D8]">/</span>
          <button
            type="button"
            onClick={() => setActiveView('my_orders')}
            className={`cursor-pointer whitespace-nowrap ${
              activeView === 'my_orders'
                ? 'font-semibold text-[#141413]'
                : 'text-[#71706B] hover:text-[#141413]'
            }`}
          >
            Riwayat Order & Bukti Bayar Saya ({orders.length})
          </button>
          <span className="text-[#E5E0D8]">/</span>
          <button
            type="button"
            onClick={() => setActiveView('admin')}
            className={`flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              activeView === 'admin'
                ? 'font-semibold text-[#141413]'
                : 'text-[#71706B] hover:text-[#141413]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#A6823C]" />
            <span>Portal Admin & Laporan Sales</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-[#71706B] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#1E3A2F]" />
                <span className="truncate max-w-[180px]">
                  {currentUser.email}
                </span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[#71706B] hover:text-[#141413] flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="font-medium text-[#141413] hover:underline cursor-pointer whitespace-nowrap"
            >
              Login Pelanggan / Admin (Google)
            </button>
          )}
        </div>
      </div>

      {/* Dismissible Notification Banner */}
      {systemBanner && (
        <div className="bg-[#141413] text-[#FAF8F5] px-6 lg:px-12 py-2.5 text-xs flex items-center justify-between">
          <span>{systemBanner}</span>
          <button
            type="button"
            onClick={() => setSystemBanner(null)}
            className="text-[#C5A059] hover:underline ml-4 cursor-pointer whitespace-nowrap"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Toast Notification on Add to Cart */}
      {addedProductToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141413] text-white px-5 py-3.5 border border-[#C5A059] shadow-lg flex items-center gap-3 text-xs">
          <Check className="w-4 h-4 text-[#C5A059]" />
          <span>
            <strong>{addedProductToast}</strong> ditambahkan ke Shopping Bag
          </span>
        </div>
      )}

      {/* MAIN VIEW SWITCHER */}
      <main className="flex-1">
        {activeView === 'admin' && (
          <AdminDashboard
            userEmail={currentUser?.email || null}
            isFirebaseAdmin={isFirebaseAdmin}
            isAdminPinUnlocked={isAdminPinUnlocked}
            onUnlockAdminPin={handleUnlockAdminPin}
            onGoogleLogin={handleGoogleLogin}
            products={displayProducts}
            orders={orders}
            customers={customers}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onSeedDefaultCatalog={handleSeedDefaultCatalog}
            onApproveOrRejectPayment={handleApproveOrRejectPayment}
            onUpdateCustomer={handleUpdateCustomer}
            isLoadingAction={isLoadingAction}
          />
        )}

        {activeView === 'my_orders' && (
          <CustomerOrdersView
            orders={orders}
            userEmail={currentUser?.email || null}
            onGoogleLogin={handleGoogleLogin}
            onReuploadProof={handleCustomerReuploadProof}
          />
        )}

        {activeView === 'storefront' && (
          <>
            {/* SECTION 1: Storefront Split-Screen Luxury Hero */}
            <section className="border-b border-[#E5E0D8] bg-[#141413] text-[#FAF8F5]">
              <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-6 p-8 md:p-14 lg:p-20 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xs text-[#C5A059] tracking-widest uppercase">
                      <span>Maison Yves Saint Laurent Paris</span>
                      <span>·</span>
                      <span>Koleksi Resmi 2026</span>
                    </div>

                    <h1
                      className="text-4xl sm:text-5xl lg:text-[54px] font-semibold leading-[1.08] text-white"
                      style={{ textWrap: 'balance' }}
                    >
                      Keanggunan Haute Beauté, Maroquinerie & Horologi Paris.
                    </h1>

                    <p className="text-sm md:text-base text-[#D5D0C8] leading-relaxed max-w-xl">
                      Jelajahi {displayProducts.length} mahakarya kurasi dalam 3 kategori utama:
                      keharuman ikonik <em>Libre</em> & kilau <em>Loveshine Lip Oil</em>,
                      tas kulit <em>Matelassé</em> & stiletto <em>Opyum</em>,
                      hingga jam tangan emas oktagonal & koleksi baju haute couture{' '}
                      <em>Le Smoking</em>, <em>Lavallière</em>, <em>Velvet Evening Dress</em>, dan{' '}
                      <em>L01 Biker Jacket</em>.
                    </p>
                  </div>

                  <div className="pt-10 flex flex-wrap items-center gap-4">
                    <a
                      href="#catalog-section"
                      className="px-7 py-3.5 bg-[#C5A059] text-[#141413] text-xs font-semibold tracking-wider uppercase hover:bg-[#d4b26c] transition-colors whitespace-nowrap shrink-0"
                    >
                      Belanja {displayProducts.length} Koleksi
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveView('admin')}
                      className="px-6 py-3.5 border border-[#FAF8F5]/30 text-[#FAF8F5] text-xs font-medium hover:border-[#C5A059] hover:text-[#C5A059] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Buka Konsol Admin
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 relative min-h-[340px] lg:min-h-[540px]">
                  <img
                    src={HERO_CAMPAIGN_IMAGE}
                    alt="YSL Libre Perfume and Quilted Leather Bag Campaign"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-8">
                    <div className="text-xs text-[#FAF8F5]/90">
                      <span>
                        Parfum & Lip Oil · Tas & Sepatu · Jam Tangan & Baju
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: Featured 12-Product Collection across 3 Categories */}
            <section
              id="catalog-section"
              className="max-w-[1360px] mx-auto px-6 py-14 space-y-10"
            >
              {/* Filter & Search Bar */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#E5E0D8] pb-8">
                <div>
                  <p className="text-xs text-[#71706B] uppercase tracking-widest">
                    Katalog Resmi Terhubung Firestore
                  </p>
                  <h2 className="text-3xl md:text-4xl font-semibold text-[#141413] mt-1">
                    {displayProducts.length} Produk Eksklusif · 3 Kategori Utama
                  </h2>
                </div>

                {/* Interactive Category Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F2EFE9] border border-[#E5E0D8]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('ALL');
                        setSelectedSubType('ALL');
                      }}
                      className={`px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedCategory === 'ALL'
                          ? 'bg-[#141413] text-white'
                          : 'text-[#71706B] hover:text-[#141413]'
                      }`}
                    >
                      Semua Kategori ({displayProducts.length})
                    </button>
                    {CATEGORIES.map((cat) => {
                      const count = displayProducts.filter(
                        (p) => p.category === cat
                      ).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setSelectedSubType('ALL');
                          }}
                          className={`px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-[#141413] text-white'
                              : 'text-[#71706B] hover:text-[#141413]'
                          }`}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sub-type Filter + Search Input */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-[#71706B] flex items-center gap-1 mr-2">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Lini Produk:</span>
                  </span>
                  {(
                    [
                      'ALL',
                      'Perfume',
                      'Lip Oil',
                      'Tas',
                      'Sepatu',
                      'Jam Tangan',
                      'Baju',
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedSubType(st)}
                      className={`px-3 py-1 text-xs border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedSubType === st
                          ? 'border-[#141413] bg-[#141413] text-white font-medium'
                          : 'border-[#E5E0D8] bg-white text-[#71706B] hover:text-[#141413]'
                      }`}
                    >
                      {st === 'ALL' ? 'Semua Lini' : st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#71706B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari Parfum, Lip Oil, Tas, Sepatu..."
                    className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-[#E5E0D8] focus:outline-none focus:border-[#141413]"
                  />
                </div>
              </div>

              {/* 3-Column Product Grid */}
              {isLoadingCatalog && displayProducts.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="h-96 bg-[#F2EFE9] border border-[#E5E0D8] animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredStorefrontProducts.length === 0 ? (
                <div className="bg-white border border-[#E5E0D8] p-12 text-center">
                  <p className="text-lg font-medium text-[#141413]">
                    Tidak ada produk yang cocok dengan filter pencarian
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSelectedSubType('ALL');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-5 py-2.5 bg-[#141413] text-white text-xs font-medium cursor-pointer"
                  >
                    Reset Filter Katalog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredStorefrontProducts.map((product) => (
                    <article
                      key={product.id}
                      className="bg-white border border-[#E5E0D8] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div>
                        {/* Product Image (70% height emphasis) */}
                        <div
                          onClick={() => setSelectedProductModal(product)}
                          className="aspect-[4/3] bg-[#F2EFE9] border-b border-[#E5E0D8] overflow-hidden cursor-pointer relative group"
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Clean Unboxed Metadata */}
                        <div className="p-6">
                          <div className="flex items-center justify-between text-xs text-[#71706B]">
                            <span className="uppercase tracking-wider">
                              {product.category} · {product.subType}
                            </span>
                            <span className="font-mono-tabular">
                              {product.stock > 0
                                ? `Stok: ${product.stock}`
                                : 'Habis'}
                            </span>
                          </div>

                          <h3
                            onClick={() => setSelectedProductModal(product)}
                            className="text-lg font-semibold text-[#141413] mt-2 cursor-pointer hover:text-[#A6823C] transition-colors"
                          >
                            {product.name}
                          </h3>

                          <p className="text-xs text-[#71706B] mt-2 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      {/* Price & Add to Cart Footer */}
                      <div className="px-6 pb-6 pt-3 border-t border-[#E5E0D8]/60 flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[11px] text-[#71706B] block">
                            {product.volumeOrSize}
                          </span>
                          <span className="text-base font-mono-tabular font-semibold text-[#141413]">
                            {formatIDR(product.price)}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={product.stock <= 0}
                          onClick={() => handleAddToCart(product)}
                          className="px-4 py-2.5 bg-[#141413] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#292826] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {product.stock > 0 ? 'Add to Cart' : 'Stok Habis'}
                          </span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* SECTION 3: Architectural Craftsmanship & 3-Pillar Overview */}
            <section className="border-t border-[#E5E0D8] bg-[#F2EFE9] py-16 px-6">
              <div className="max-w-[1360px] mx-auto space-y-10">
                <div className="max-w-2xl">
                  <p className="text-xs text-[#71706B] uppercase tracking-widest">
                    Tiga Pilar Koleksi YSL Maison
                  </p>
                  <h2 className="text-3xl font-semibold text-[#141413] mt-1">
                    Kurasi Lengkap dari Beauté hingga Haute Couture
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white border border-[#E5E0D8] p-7 space-y-3">
                    <p className="text-xs font-mono-tabular text-[#A6823C]">
                      01. KATEGORI PERTAMA
                    </p>
                    <h3 className="text-2xl font-semibold text-[#141413]">
                      Parfum & Lip Oil
                    </h3>
                    <p className="text-xs text-[#71706B] leading-relaxed">
                      Menghadirkan 4 produk unggulan: <em>YSL Libre EDP Intense</em>,{' '}
                      <em>Black Opium Le Parfum</em>,{' '}
                      <em>Loveshine Plumping Lip Oil Gloss</em>, dan{' '}
                      <em>Volupté Tint-in-Oil Rose Gold</em>.
                    </p>
                  </div>

                  <div className="bg-white border border-[#E5E0D8] p-7 space-y-3">
                    <p className="text-xs font-mono-tabular text-[#A6823C]">
                      02. KATEGORI KEDUA
                    </p>
                    <h3 className="text-2xl font-semibold text-[#141413]">
                      Tas & Sepatu
                    </h3>
                    <p className="text-xs text-[#71706B] leading-relaxed">
                      Menghadirkan 4 mahakarya kulit Italia: tas bahu{' '}
                      <em>Loulou Matelassé</em>, <em>Sunset Chain Bag</em>,
                      sepatu stiletto paten <em>Opyum 110</em>, serta{' '}
                      <em>Le Loafer Cassandre</em>.
                    </p>
                  </div>

                  <div className="bg-white border border-[#E5E0D8] p-7 space-y-3">
                    <p className="text-xs font-mono-tabular text-[#A6823C]">
                      03. KATEGORI KETIGA
                    </p>
                    <h3 className="text-2xl font-semibold text-[#141413]">
                      Jam Tangan & Baju
                    </h3>
                    <p className="text-xs text-[#71706B] leading-relaxed">
                      Menghadirkan 8 koleksi horologi dan busana haute couture: arloji emas{' '}
                      <em>Rive Gauche Octagonal</em> & <em>Cassandre Cuff</em>, serta 6 koleksi baju:{' '}
                      <em>Le Smoking Blazer</em>, blus sutra <em>Lavallière</em>,{' '}
                      <em>Couture Velvet Evening Dress</em>, jaket kulit <em>L01 Lambskin Biker</em>,{' '}
                      <em>Rive Gauche Cashmere Sweater</em>, dan <em>Caban Wool Coat</em>.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#141413] text-[#FAF8F5] border-t border-[#E5E0D8]/20 px-6 lg:px-12 py-10">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-[#71706B]">
          <div>
            <p className="font-serif-luxury text-lg text-white tracking-widest">
              YVES SAINT LAURENT BEAUTÉ & MAISON
            </p>
            <p className="mt-1">
              Marketplace Resmi dengan Koneksi Database Real-Time Firestore ·
              Single Source of Truth.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveView('storefront')}
              className="hover:text-white cursor-pointer"
            >
              Katalog 12 Produk
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="hover:text-white cursor-pointer"
            >
              Shopping Cart ({totalCartItems})
            </button>
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="hover:text-white cursor-pointer"
            >
              Admin Login & Laporan Sales
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-Over Shopping Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        userEmail={currentUser?.email || null}
        userName={currentUser?.displayName || null}
        onGoogleLogin={handleGoogleLogin}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isLoadingAction}
      />

      {/* Contiguous Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductModal}
        onClose={() => setSelectedProductModal(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

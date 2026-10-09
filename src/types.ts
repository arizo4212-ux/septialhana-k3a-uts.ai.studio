export type ProductCategory =
  | 'Parfum & Lip Oil'
  | 'Tas & Sepatu'
  | 'Jam Tangan & Baju';

export type ProductSubType =
  | 'Perfume'
  | 'Lip Oil'
  | 'Tas'
  | 'Sepatu'
  | 'Jam Tangan'
  | 'Baju';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  subType: ProductSubType;
  price: number;
  stock: number;
  description: string;
  volumeOrSize: string;
  imageUrl: string;
  featured: boolean;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Customer {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  totalOrders: number;
  totalSpent: number;
  updatedAt: string;
}

export type PaymentMethod =
  | 'Bank Transfer BCA'
  | 'Bank Transfer Mandiri'
  | 'QRIS YSL Beaute';

export type PaymentStatus = 'waiting_approval' | 'approved' | 'rejected';

export type OrderStatus =
  | 'pending_verification'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerUid: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  itemsSummary: string;
  itemCount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentAccountSender: string;
  paymentReferenceNumber: string;
  paymentProofImage: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

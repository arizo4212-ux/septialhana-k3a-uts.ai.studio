import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Upload,
  CheckCircle2,
  X,
  ArrowRight,
  Clock,
  FileText,
} from 'lucide-react';
import { CartItem, Order, PaymentMethod } from '../types';
import { formatIDR, compressOrGenerateReceiptImage } from '../seedData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  userEmail: string | null;
  userName: string | null;
  onGoogleLogin: () => Promise<void>;
  onSubmitOrder: (payload: {
    customerName: string;
    customerPhone: string;
    address: string;
    city: string;
    postalCode: string;
    paymentMethod: PaymentMethod;
    paymentAccountSender: string;
    paymentReferenceNumber: string;
    paymentProofImage: string;
  }) => Promise<string>;
  isSubmitting: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  userEmail,
  userName,
  onGoogleLogin,
  onSubmitOrder,
  isSubmitting,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [customerName, setCustomerName] = useState(userName || '');
  const [customerPhone, setCustomerPhone] = useState('0812-8890-4421');
  const [address, setAddress] = useState('Jl. Senopati No. 88, Kebayoran Baru');
  const [city, setCity] = useState('Jakarta Selatan');
  const [postalCode, setPostalCode] = useState('12190');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('Bank Transfer BCA');
  const [paymentAccountSender, setPaymentAccountSender] = useState('');
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState(
    `BCA-${Math.floor(10000000 + Math.random() * 90000000)}`
  );
  const [proofPreview, setProofPreview] = useState<string>('');
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressOrGenerateReceiptImage(file);
      setProofPreview(compressed);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal membaca file bukti transfer'
      );
    }
  };

  const handleGenerateSlipPreview = async () => {
    const generated = await compressOrGenerateReceiptImage(undefined, {
      orderNumber: `YSL-${Math.floor(100000 + Math.random() * 900000)}`,
      sender: paymentAccountSender || customerName || userName || 'Pelanggan YSL',
      bank: paymentMethod,
      amount: subtotal,
      reference: paymentReferenceNumber,
    });
    setProofPreview(generated);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      let finalProof = proofPreview;
      if (!finalProof) {
        finalProof = await compressOrGenerateReceiptImage(undefined, {
          orderNumber: `YSL-${Math.floor(100000 + Math.random() * 900000)}`,
          sender:
            paymentAccountSender || customerName || userName || 'Pelanggan YSL',
          bank: paymentMethod,
          amount: subtotal,
          reference: paymentReferenceNumber,
        });
      }

      const orderNum = await onSubmitOrder({
        customerName: (customerName || userName || 'Pelanggan YSL').trim(),
        customerPhone: customerPhone.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        paymentMethod,
        paymentAccountSender: (
          paymentAccountSender ||
          customerName ||
          userName ||
          'Rekening Pelanggan'
        ).trim(),
        paymentReferenceNumber: paymentReferenceNumber.trim(),
        paymentProofImage: finalProof,
      });

      setLastOrderNumber(orderNum);
      setStep('success');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal membuat pesanan.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div className="bg-[#FAF8F5] w-full max-w-lg h-full flex flex-col justify-between border-l border-[#E5E0D8] overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-6 bg-white border-b border-[#E5E0D8] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#141413]" />
            <h2 className="text-xl font-semibold text-[#141413]">
              {step === 'cart'
                ? `Shopping Bag (${totalUnits})`
                : step === 'checkout'
                ? 'Checkout & Bukti Pembayaran'
                : 'Konfirmasi Pesanan YSL'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep('cart');
              onClose();
            }}
            className="p-1.5 text-[#71706B] hover:text-[#141413] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 flex-1 space-y-6">
          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <p className="text-lg font-medium text-[#141413]">
                    Shopping Bag Anda Masih Kosong
                  </p>
                  <p className="text-xs text-[#71706B] max-w-xs mx-auto leading-relaxed">
                    Pilih produk dari 12 koleksi eksklusif Parfum & Lip Oil, Tas &
                    Sepatu, atau Jam Tangan & Baju YSL.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="bg-white border border-[#E5E0D8] p-4 flex gap-4"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 object-cover bg-[#F2EFE9] border border-[#E5E0D8] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] text-[#71706B]">
                              {product.category} · {product.subType}
                            </p>
                            <h3 className="text-sm font-semibold text-[#141413] truncate">
                              {product.name}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(product.id)}
                            className="text-[#71706B] hover:text-[#991B1B] cursor-pointer"
                            title="Hapus item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs font-mono-tabular font-medium text-[#141413] mt-1">
                          {formatIDR(product.price)}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-[#E5E0D8] bg-[#FAF8F5]">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, -1)}
                              className="px-2.5 py-1 text-xs font-mono-tabular hover:bg-white cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-xs font-mono-tabular font-semibold">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              disabled={quantity >= product.stock}
                              onClick={() => onUpdateQuantity(product.id, 1)}
                              className="px-2.5 py-1 text-xs font-mono-tabular hover:bg-white cursor-pointer disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-xs font-mono-tabular font-semibold text-[#141413]">
                            {formatIDR(product.price * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <div className="space-y-5">
              {!userEmail ? (
                <div className="bg-white border border-[#E5E0D8] p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-[#141413]">
                    Masuk untuk Melanjutkan Checkout
                  </h3>
                  <p className="text-xs text-[#71706B] leading-relaxed">
                    Pesanan, pengurangan stok otomatis, dan unggahan bukti
                    pembayaran tersimpan secara aman di database real-time
                    Firestore. Silakan masuk dengan akun Google Anda.
                  </p>
                  <button
                    type="button"
                    onClick={onGoogleLogin}
                    className="w-full py-3 px-4 bg-[#141413] text-white text-xs font-medium hover:bg-[#292826] cursor-pointer"
                  >
                    Masuk dengan Akun Google
                  </button>
                </div>
              ) : (
                <form
                  id="checkout-form"
                  onSubmit={handleCheckoutSubmit}
                  className="space-y-4 text-xs"
                >
                  <div className="bg-white border border-[#E5E0D8] p-4 space-y-3">
                    <p className="font-semibold text-[#141413] uppercase tracking-wider text-[11px]">
                      01. Data Pelanggan & Pengiriman
                    </p>
                    <div>
                      <label className="block font-medium text-[#141413] mb-1">
                        Nama Lengkap Penerima
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder={userName || 'Nama Lengkap Anda'}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-[#141413] mb-1">
                        Nomor Telepon / WhatsApp
                      </label>
                      <input
                        type="text"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-[#141413] mb-1">
                        Alamat Lengkap Pengiriman
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-[#141413] mb-1">
                          Kota / Kabupaten
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-[#141413] mb-1">
                          Kode Pos
                        </label>
                        <input
                          type="text"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] font-mono-tabular"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E5E0D8] p-4 space-y-3">
                    <p className="font-semibold text-[#141413] uppercase tracking-wider text-[11px]">
                      02. Instruksi Transfer & Bukti Pembayaran
                    </p>
                    <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D8] text-[11px] space-y-1">
                      <p className="font-medium text-[#141413]">
                        Rekening Resmi PT YSL Beauté Indonesia:
                      </p>
                      <p className="text-[#71706B] font-mono-tabular">
                        BCA: 8801-9920-11 · Mandiri: 122-00-9988776-5
                      </p>
                      <p className="text-[#141413] font-mono-tabular font-semibold">
                        Total Tagihan: {formatIDR(subtotal)}
                      </p>
                    </div>

                    <div>
                      <label className="block font-medium text-[#141413] mb-1">
                        Metode Pembayaran
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as PaymentMethod)
                        }
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                      >
                        <option value="Bank Transfer BCA">
                          Bank Transfer BCA
                        </option>
                        <option value="Bank Transfer Mandiri">
                          Bank Transfer Mandiri
                        </option>
                        <option value="QRIS YSL Beaute">QRIS YSL Beaute</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-[#141413] mb-1">
                          Nama Rekening Pengirim
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentAccountSender}
                          onChange={(e) =>
                            setPaymentAccountSender(e.target.value)
                          }
                          placeholder={userName || 'Nama Pemilik Rekening'}
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-[#141413] mb-1">
                          Nomor Referensi Transfer
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentReferenceNumber}
                          onChange={(e) =>
                            setPaymentReferenceNumber(e.target.value)
                          }
                          className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] font-mono-tabular"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-[#141413] mb-1.5">
                        Unggah Foto Bukti Pembayaran (Untuk Approval Admin)
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#141413] cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih File Gambar Resi</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={handleGenerateSlipPreview}
                          className="px-3 py-2 border border-[#E5E0D8] text-[#141413] hover:bg-[#FAF8F5] cursor-pointer"
                        >
                          Buat Slip Transfer Digital Otomatis
                        </button>
                      </div>

                      {proofPreview && (
                        <div className="mt-3 p-2 bg-[#FAF8F5] border border-[#E5E0D8] flex flex-col items-center">
                          <img
                            src={proofPreview}
                            alt="Preview Bukti Bayar"
                            className="max-h-44 object-contain"
                          />
                          <span className="text-[11px] text-[#1E3A2F] mt-1 font-medium">
                            Bukti pembayaran siap dikirim ke Admin
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 bg-[#FDF2F2] border border-[#F5C2C2] text-xs text-[#991B1B]">
                      {formError}
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="bg-white border border-[#E5E0D8] p-8 text-center space-y-4 my-6">
              <CheckCircle2 className="w-10 h-10 text-[#1E3A2F] mx-auto" />
              <p className="text-xs font-mono-tabular text-[#71706B]">
                ORDER #{lastOrderNumber}
              </p>
              <h3 className="text-2xl font-semibold text-[#141413]">
                Pesanan & Bukti Pembayaran Terkirim
              </h3>
              <p className="text-xs text-[#71706B] leading-relaxed">
                Terima kasih telah berbelanja di YSL Beauté & Maison. Bukti
                pembayaran Anda sedang menunggu verifikasi pada{' '}
                <strong>Admin Panel &rarr; Approval Pembayaran</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep('cart');
                  onClose();
                }}
                className="w-full py-3 px-4 bg-[#141413] text-white text-xs font-medium cursor-pointer"
              >
                Kembali ke Katalog
              </button>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && step !== 'success' && (
          <div className="p-6 bg-white border-t border-[#E5E0D8] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#71706B]">
                Total Pembayaran ({totalUnits} produk)
              </span>
              <span className="text-lg font-semibold font-mono-tabular text-[#141413]">
                {formatIDR(subtotal)}
              </span>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3.5 px-5 bg-[#141413] text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-[#292826] transition-colors cursor-pointer"
              >
                <span>Lanjut ke Pengiriman & Upload Bukti Bayar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-4 py-3 border border-[#E5E0D8] text-xs font-medium text-[#141413] cursor-pointer"
                >
                  Kembali
                </button>
                {userEmail && (
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-5 bg-[#141413] text-white text-xs font-medium hover:bg-[#292826] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'Menyimpan ke Database...'
                      : 'Kirim Order & Bukti Pembayaran'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface CustomerOrdersViewProps {
  orders: Order[];
  userEmail: string | null;
  onGoogleLogin: () => Promise<void>;
  onReuploadProof: (
    order: Order,
    newSender: string,
    newRef: string,
    newProofImg: string
  ) => Promise<void>;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({
  orders,
  userEmail,
  onGoogleLogin,
  onReuploadProof,
}) => {
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [senderInput, setSenderInput] = useState('');
  const [refInput, setRefInput] = useState('');
  const [proofImgInput, setProofImgInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!userEmail) {
    return (
      <section className="max-w-xl mx-auto my-14 px-6">
        <div className="bg-white border border-[#E5E0D8] p-8 text-center space-y-4">
          <Clock className="w-7 h-7 text-[#A6823C] mx-auto" />
          <h2 className="text-2xl font-semibold text-[#141413]">
            Riwayat Pesanan & Status Approval Pembayaran
          </h2>
          <p className="text-xs text-[#71706B] leading-relaxed">
            Masuk dengan akun Google Anda untuk memantau status verifikasi bukti
            pembayaran dan pengiriman pesanan secara real-time.
          </p>
          <button
            type="button"
            onClick={onGoogleLogin}
            className="px-6 py-3 bg-[#141413] text-white text-xs font-medium cursor-pointer"
          >
            Masuk dengan Google
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-10 space-y-6">
      <div className="border-b border-[#E5E0D8] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#71706B]">Akun Pelanggan: {userEmail}</p>
          <h1 className="text-3xl font-semibold text-[#141413] mt-1">
            Riwayat Pesanan & Status Approval
          </h1>
        </div>
        <p className="text-xs text-[#71706B] font-mono-tabular">
          Total Pesanan Anda: {orders.length}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] p-12 text-center">
          <FileText className="w-7 h-7 text-[#71706B] mx-auto mb-2" />
          <p className="text-base font-medium text-[#141413]">
            Anda belum memiliki riwayat pesanan
          </p>
          <p className="text-xs text-[#71706B] mt-1">
            Tambahkan produk YSL ke Shopping Bag dan selesaikan checkout untuk
            melihat status pesanan di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-[#E5E0D8] p-6 flex flex-col md:flex-row justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono-tabular font-semibold text-[#141413]">
                    {order.orderNumber}
                  </span>
                  <span className="text-[#71706B]">·</span>
                  <span className="text-[#71706B]">
                    {new Date(order.createdAt).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[#71706B]">·</span>
                  <span className="font-medium text-[#141413]">
                    Status Order: {order.orderStatus}
                  </span>
                </div>

                <p className="text-sm font-medium text-[#141413]">
                  {order.itemsSummary}
                </p>

                <p className="text-xs text-[#71706B]">
                  Tujuan Pengiriman: {order.shippingAddress}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
                  <span>
                    Metode: <strong>{order.paymentMethod}</strong> (
                    {order.paymentReferenceNumber})
                  </span>
                  <span>·</span>
                  <span>
                    Status Bukti Bayar:{' '}
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
                        ? 'DISETUJUI ADMIN (LUNAS)'
                        : order.paymentStatus === 'rejected'
                        ? 'DITOLAK — UNGGAH ULANG BUKTI'
                        : 'MENUNGGU APPROVAL ADMIN'}
                    </strong>
                  </span>
                </div>

                {order.adminNotes && (
                  <p className="text-xs text-[#141413] bg-[#FAF8F5] border border-[#E5E0D8] p-2.5 mt-2">
                    Catatan Admin: "{order.adminNotes}"
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end justify-between gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-[#71706B]">Total Pembayaran</p>
                  <p className="text-lg font-mono-tabular font-semibold text-[#141413]">
                    {formatIDR(order.totalAmount)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={order.paymentProofImage}
                    alt="Bukti Transfer"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-cover border border-[#E5E0D8]"
                  />
                  {order.orderStatus !== 'completed' &&
                    order.orderStatus !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUpdatingOrder(order);
                          setSenderInput(order.paymentAccountSender);
                          setRefInput(order.paymentReferenceNumber);
                          setProofImgInput(order.paymentProofImage);
                        }}
                        className="px-3.5 py-2 text-xs font-medium border border-[#E5E0D8] text-[#141413] hover:bg-[#FAF8F5] cursor-pointer"
                      >
                        Perbarui Bukti Bayar
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {updatingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E0D8] max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[#141413]">
              Perbarui Bukti Pembayaran ({updatingOrder.orderNumber})
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">
                  Nama Pengirim Rekening
                </label>
                <input
                  type="text"
                  value={senderInput}
                  onChange={(e) => setSenderInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Nomor Referensi
                </label>
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] font-mono-tabular"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Pilih File Gambar Bukti Baru
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const img = await compressOrGenerateReceiptImage(file);
                      setProofImgInput(img);
                    }
                  }}
                  className="w-full text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
              <button
                type="button"
                onClick={() => setUpdatingOrder(null)}
                className="px-4 py-2 text-xs border border-[#E5E0D8] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await onReuploadProof(
                      updatingOrder,
                      senderInput,
                      refInput,
                      proofImgInput
                    );
                    setUpdatingOrder(null);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="px-4 py-2 text-xs bg-[#141413] text-white cursor-pointer"
              >
                Simpan Bukti Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

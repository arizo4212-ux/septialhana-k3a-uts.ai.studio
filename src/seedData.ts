import { Product, ProductCategory } from './types';

export const HERO_CAMPAIGN_IMAGE =
  '/src/assets/images/hero_ysl_campaign_1791516903090.jpg';

export const CATEGORIES: ProductCategory[] = [
  'Parfum & Lip Oil',
  'Tas & Sepatu',
  'Jam Tangan & Baju',
];

export const INITIAL_YSL_PRODUCTS: Omit<Product, 'updatedAt'>[] = [
  // KATEGORI 1: Parfum & Lip Oil (4 Produk: 2 Perfume, 2 Lip Oil)
  {
    id: 'ysl-libre-edp-90ml',
    sku: 'YSL-PRF-001',
    name: 'YSL Libre Eau de Parfum Intense',
    category: 'Parfum & Lip Oil',
    subType: 'Perfume',
    price: 2950000,
    stock: 18,
    description:
      'Komposisi floral amber ikonik dengan esens lavender Prancis, orange blossom Maroko, dan sentuhan vanilla bourbon hangat dalam flakon kristal Cassandre.',
    volumeOrSize: '90 ml / 3.0 fl.oz',
    imageUrl: '/src/assets/images/ysl_perfume_collection_1791516916656.jpg',
    featured: true,
  },
  {
    id: 'ysl-black-opium-le-parfum',
    sku: 'YSL-PRF-002',
    name: 'YSL Black Opium Le Parfum',
    category: 'Parfum & Lip Oil',
    subType: 'Perfume',
    price: 3150000,
    stock: 14,
    description:
      'Kuartet vanilla couture berpadu dengan akord espresso hitam pekat dan buket bunga putih bercahaya untuk jejak aroma malam Paris yang intens.',
    volumeOrSize: '90 ml / 3.0 fl.oz',
    imageUrl: '/src/assets/images/ysl_perfume_collection_1791516916656.jpg',
    featured: false,
  },
  {
    id: 'ysl-loveshine-lip-oil-44',
    sku: 'YSL-LIP-003',
    name: 'YSL Loveshine Plumping Lip Oil Gloss #44',
    category: 'Parfum & Lip Oil',
    subType: 'Lip Oil',
    price: 790000,
    stock: 32,
    description:
      'Lip oil couture kaya nutrisi dengan ekstrak fig pulp dari Ourika Community Gardens dan 6 minyak botani murni untuk kilau kaca Nude Lavallière.',
    volumeOrSize: '6 ml / 0.20 fl.oz',
    imageUrl: '/src/assets/images/ysl_lip_oil_collection_1791516929517.jpg',
    featured: true,
  },
  {
    id: 'ysl-volupte-liquid-balm-02',
    sku: 'YSL-LIP-004',
    name: 'YSL Volupté Tint-in-Oil #02 Rose Gold',
    category: 'Parfum & Lip Oil',
    subType: 'Lip Oil',
    price: 760000,
    stock: 25,
    description:
      'Perawatan bibir berbasis minyak jojoba, passiflora, dan apricot kernel yang bereaksi dengan pH alami bibir menghasilkan rona rose-gold sehat.',
    volumeOrSize: '6 ml / 0.20 fl.oz',
    imageUrl: '/src/assets/images/ysl_lip_oil_collection_1791516929517.jpg',
    featured: false,
  },

  // KATEGORI 2: Tas & Sepatu (4 Produk: 2 Tas, 2 Sepatu)
  {
    id: 'ysl-loulou-matelasse-bag',
    sku: 'YSL-BAG-005',
    name: 'YSL Loulou Medium Matelassé Leather Bag',
    category: 'Tas & Sepatu',
    subType: 'Tas',
    price: 46500000,
    stock: 6,
    description:
      'Tas bahu kulit anak sapi berlapis jahitan chevron Y-quilted dengan perangkat keras monogram Cassandre emas antik dan rantai ganda konvertibel.',
    volumeOrSize: '32 x 22 x 12 cm',
    imageUrl: '/src/assets/images/ysl_leather_bag_shoes_1791516940750.jpg',
    featured: true,
  },
  {
    id: 'ysl-sunset-grain-de-poudre',
    sku: 'YSL-BAG-006',
    name: 'YSL Sunset Chain Bag in Grain de Poudre',
    category: 'Tas & Sepatu',
    subType: 'Tas',
    price: 42800000,
    stock: 8,
    description:
      'Siluet terstruktur dari kulit bertekstur grain de poudre tahan gores dengan kompartemen gusset ganda dan gantungan kunci terbungkus kulit.',
    volumeOrSize: '22 x 16 x 8 cm',
    imageUrl: '/src/assets/images/ysl_leather_bag_shoes_1791516940750.jpg',
    featured: false,
  },
  {
    id: 'ysl-opyum-110-patent-pumps',
    sku: 'YSL-SHO-007',
    name: 'YSL Opyum 110 Patent Leather Stiletto Pumps',
    category: 'Tas & Sepatu',
    subType: 'Sepatu',
    price: 21500000,
    stock: 9,
    description:
      'Sepatu stiletto pointed-toe dari kulit paten hitam mengilap dengan tumit arsitektural berukir monogram logam YSL berlapis emas.',
    volumeOrSize: 'EU 36 - 40 (Heel 110mm)',
    imageUrl: '/src/assets/images/ysl_leather_bag_shoes_1791516940750.jpg',
    featured: true,
  },
  {
    id: 'ysl-le-loafer-monogram-penny',
    sku: 'YSL-SHO-008',
    name: 'YSL Le Loafer Glazed Calfskin Penny Loafers',
    category: 'Tas & Sepatu',
    subType: 'Sepatu',
    price: 16900000,
    stock: 11,
    description:
      'Sepatu loafer klasik dari 100% kulit anak sapi mengilap dengan saddle strap berhias monogram Cassandre logam emas halus.',
    volumeOrSize: 'EU 37 - 42 (Heel 20mm)',
    imageUrl: '/src/assets/images/ysl_leather_bag_shoes_1791516940750.jpg',
    featured: false,
  },

  // KATEGORI 3: Jam Tangan & Baju (4 Produk: 2 Jam Tangan, 2 Baju)
  {
    id: 'ysl-rive-gauche-octagonal-watch',
    sku: 'YSL-WTC-009',
    name: 'YSL Rive Gauche Octagonal Gold Edition Watch',
    category: 'Jam Tangan & Baju',
    subType: 'Jam Tangan',
    price: 34200000,
    stock: 5,
    description:
      'Jam tangan dress ultra-tipis dengan bezel oktagonal brushed gold, dial batu onyx hitam pekat tanpa angka, dan kristal safir anti-reflektif.',
    volumeOrSize: '36 mm Case · Swiss Quartz',
    imageUrl: '/src/assets/images/ysl_watch_couture_1791516951016.jpg',
    featured: true,
  },
  {
    id: 'ysl-cassandre-bangle-timepiece',
    sku: 'YSL-WTC-010',
    name: 'YSL Cassandre Cuff Noir & Gold Timepiece',
    category: 'Jam Tangan & Baju',
    subType: 'Jam Tangan',
    price: 28900000,
    stock: 7,
    description:
      'Arloji perhiasan bergaya manset Paris 1970-an dengan jarum emas ramping, case persegi panjang terintegrasi, dan tahan air 3 ATM.',
    volumeOrSize: '24 x 31 mm · Swiss Movement',
    imageUrl: '/src/assets/images/ysl_watch_couture_1791516951016.jpg',
    featured: false,
  },
  {
    id: 'ysl-le-smoking-wool-blazer',
    sku: 'YSL-CLTH-011',
    name: 'YSL Le Smoking Tailored Grain de Poudre Blazer',
    category: 'Jam Tangan & Baju',
    subType: 'Baju',
    price: 54000000,
    stock: 6,
    description:
      'Blazer tuksedo double-breasted ikonik warisan Monsieur Saint Laurent sejak 1966 dengan kerah peak satin sutra, kancing emas Cassandre, dan bahu tegas.',
    volumeOrSize: 'FR 36 / 38 / 40 / 42',
    imageUrl: '/src/assets/images/ysl_couture_clothing_blazer_1791518017079.jpg',
    featured: true,
  },
  {
    id: 'ysl-lavalliere-silk-crepe-blouse',
    sku: 'YSL-CLTH-012',
    name: 'YSL Lavallière Sheer Silk Crêpe de Chine Blouse',
    category: 'Jam Tangan & Baju',
    subType: 'Baju',
    price: 26400000,
    stock: 10,
    description:
      'Blus sutra crêpe de chine semi-sheer buatan Prancis dengan pita leher lavallière dramatis dan manset berkancing berlapis emas.',
    volumeOrSize: 'FR 34 / 36 / 38 / 40',
    imageUrl: '/src/assets/images/ysl_silk_blouse_dress_1791518028506.jpg',
    featured: true,
  },
  {
    id: 'ysl-velvet-draped-evening-gown',
    sku: 'YSL-CLTH-013',
    name: 'YSL Couture Draped Silk-Velvet Evening Dress',
    category: 'Jam Tangan & Baju',
    subType: 'Baju',
    price: 62500000,
    stock: 5,
    description:
      'Gaun malam haute couture dari beludru sutra hitam pekat dengan potongan V-neck arsitektural dan draperi pinggang asimetris khas atelier Paris.',
    volumeOrSize: 'FR 36 / 38 / 40',
    imageUrl: '/src/assets/images/ysl_silk_blouse_dress_1791518028506.jpg',
    featured: true,
  },
  {
    id: 'ysl-classic-lambskin-biker-jacket',
    sku: 'YSL-CLTH-014',
    name: 'YSL L01 Classic Plongé Lambskin Motorcycle Jacket',
    category: 'Jam Tangan & Baju',
    subType: 'Baju',
    price: 78900000,
    stock: 4,
    description:
      'Jaket kulit biker L01 legendaris dari 100% kulit domba plongé lembut dengan ritsleting perak asimetris, sabuk pinggang, dan lapisan sutra.',
    volumeOrSize: 'FR 46 / 48 / 50',
    imageUrl:
      '/src/assets/images/ysl_rive_gauche_couture_apparel_1791518040492.jpg',
    featured: true,
  },
  {
    id: 'ysl-rive-gauche-cashmere-knit',
    sku: 'YSL-CLTH-015',
    name: 'YSL Rive Gauche Ivory Pure Cashmere Crewneck Sweater',
    category: 'Jam Tangan & Baju',
    subType: 'Baju',
    price: 22800000,
    stock: 12,
    description:
      'Sweater rajut kasmir murni Skotlandia berwarna gading hangat dengan bordir tonal Cassandre halus dan kerah rib klasik yang nyaman.',
    volumeOrSize: 'XS / S / M / L',
    imageUrl:
      '/src/assets/images/ysl_rive_gauche_couture_apparel_1791518040492.jpg',
    featured: false,
  },
  {
    id: 'ysl-caban-double-breasted-wool-coat',
    sku: 'YSL-CLTH-016',
    name: 'YSL Caban Double-Breasted Virgin Wool Couture Coat',
    category: 'Jam Tangan & Baju',
    subType: 'Baju',
    price: 68000000,
    stock: 5,
    description:
      'Mantel caban wol virgin hitam berpotongan tegas dengan kerah ulster lebar, 6 kancing logam emas berukir YSL, dan siluet struktural.',
    volumeOrSize: 'FR 36 / 38 / 40 / 42',
    imageUrl: '/src/assets/images/ysl_couture_clothing_blazer_1791518017079.jpg',
    featured: false,
  },
];

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generates a realistic synthetic payment receipt image (Data URL) or compresses a user file
 * so that it never exceeds Firestore's 1MB limit and adheres to the 350,000 char rule.
 */
export async function compressOrGenerateReceiptImage(
  file?: File,
  fallbackDetails?: {
    orderNumber: string;
    sender: string;
    bank: string;
    amount: number;
    reference: string;
  }
): Promise<string> {
  if (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 720;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Gagal memproses gambar bukti pembayaran'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          resolve(dataUrl.slice(0, 340000));
        };
        img.onerror = () => reject(new Error('Format gambar tidak valid'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  }

  // Generate clean digital transfer slip on canvas if customer uses instant digital slip
  const canvas = document.createElement('canvas');
  canvas.width = 520;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'https://ysl-receipt-verified';

  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, 520, 640);

  ctx.strokeStyle = '#C5A059';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 480, 600);

  ctx.fillStyle = '#141413';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('YVES SAINT LAURENT BEAUTÉ & MAISON', 45, 70);

  ctx.fillStyle = '#71706B';
  ctx.font = '12px sans-serif';
  ctx.fillText('BUKTI TRANSFER PEMBAYARAN RESMI', 45, 95);

  ctx.strokeStyle = '#E5E0D8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(45, 115);
  ctx.lineTo(475, 115);
  ctx.stroke();

  const details = [
    ['Nomor Order', fallbackDetails?.orderNumber || 'YSL-90210'],
    [' Tanggal Transaksi', new Date().toLocaleString('id-ID')],
    ['Metode Pembayaran', fallbackDetails?.bank || 'Bank Transfer BCA'],
    ['Nama Pengirim', fallbackDetails?.sender || 'Pelanggan YSL'],
    ['Nomor Referensi', fallbackDetails?.reference || 'REF-88492019'],
    ['Rekening Tujuan', 'PT YSL Beaute Indonesia (8801-9920-11)'],
    ['Nominal Transfer', formatIDR(fallbackDetails?.amount || 0)],
    ['Status Mutasi', 'BERHASIL / MENUNGGU VERIFIKASI ADMIN'],
  ];

  let y = 160;
  details.forEach(([label, val]) => {
    ctx.fillStyle = '#71706B';
    ctx.font = '13px sans-serif';
    ctx.fillText(label.trim(), 45, y);

    ctx.fillStyle = '#141413';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(String(val).slice(0, 38), 45, y + 22);
    y += 56;
  });

  ctx.fillStyle = '#1E3A2F';
  ctx.fillRect(45, 550, 430, 42);
  ctx.fillStyle = '#FAF8F5';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('VERIFIED ELECTRONIC RECEIPT · YSL MAISON', 110, 576);

  return canvas.toDataURL('image/jpeg', 0.8);
}

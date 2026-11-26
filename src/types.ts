export type TipeItem = "tiket" | "sewa" | "kantin";
export type StatusSewa = "disewa" | "dikembalikan" | "rusak";

export interface Item {
  id: string;
  nama: string;
  kategori: string;
  tipe: TipeItem;
  harga: number;
  stok: number;
  hargaAkhirPekan?: number; // khusus tiket
  kuota?: number;           // khusus tiket (kuota harian)
  deposit?: number;         // khusus sewa
}

export interface ItemKeranjang {
  idItem: string;
  nama: string;
  tipe: TipeItem;
  kategori: string;
  harga: number;
  deposit: number;
  jumlah: number;
}

export interface Member {
  id: string;
  nama: string;
  poin: number;
}

export interface Transaksi {
  id: string;
  tanggal: string;
  pembeli: string;
  items: ItemKeranjang[];
  subtotal: number;
  namaPromo: string;
  diskon: number;
  deposit: number;
  total: number;
  uangBayar: number;
  kembalian: number;
  idMember?: string;
}

export interface Sewa {
  id: string;
  idTransaksi: string;
  pembeli: string;
  idItem: string;
  nama: string;
  jumlah: number;
  deposit: number;
  batasKembali: string;
  status: StatusSewa;
  denda: number;
  tanggalKembali?: string;
}

export interface Database {
  tanggalKuota: string;
  items: Item[];
  members: Member[];
  transaksi: Transaksi[];
  sewa: Sewa[];
}

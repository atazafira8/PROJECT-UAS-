import { Database, Item } from "./types";

// Data awal. Menu kantin berasal dari versi UTS.
const itemAwal: Item[] = [
  { id: "T01", nama: "Tiket Dewasa", kategori: "Dewasa", tipe: "tiket", harga: 20000, hargaAkhirPekan: 25000, stok: 100, kuota: 100 },
  { id: "T02", nama: "Tiket Anak", kategori: "Anak", tipe: "tiket", harga: 15000, hargaAkhirPekan: 20000, stok: 100, kuota: 100 },
  { id: "S01", nama: "Ban Renang", kategori: "Perlengkapan", tipe: "sewa", harga: 10000, deposit: 20000, stok: 15 },
  { id: "S02", nama: "Pelampung", kategori: "Perlengkapan", tipe: "sewa", harga: 10000, deposit: 20000, stok: 15 },
  { id: "S03", nama: "Loker", kategori: "Loker", tipe: "sewa", harga: 5000, deposit: 20000, stok: 20 },
  { id: "S04", nama: "Kacamata Renang", kategori: "Perlengkapan", tipe: "sewa", harga: 8000, deposit: 15000, stok: 10 },
  { id: "K01", nama: "Mie Sempol", kategori: "Makanan", tipe: "kantin", harga: 5000, stok: 10 },
  { id: "K02", nama: "Sosis", kategori: "Makanan", tipe: "kantin", harga: 5000, stok: 10 },
  { id: "K03", nama: "Kentang Goreng", kategori: "Makanan", tipe: "kantin", harga: 8000, stok: 10 },
  { id: "K04", nama: "Pop Mie", kategori: "Makanan", tipe: "kantin", harga: 8000, stok: 10 },
  { id: "K05", nama: "Keripik", kategori: "Makanan", tipe: "kantin", harga: 5000, stok: 10 },
  { id: "K06", nama: "Es Teh", kategori: "Minuman", tipe: "kantin", harga: 4000, stok: 15 },
  { id: "K07", nama: "Air Mineral", kategori: "Minuman", tipe: "kantin", harga: 3000, stok: 20 },
  { id: "K08", nama: "Es Marimas", kategori: "Minuman", tipe: "kantin", harga: 3000, stok: 15 }
];

export function buatDataAwal(tanggal: string): Database {
  return {
    tanggalKuota: tanggal,
    items: itemAwal,
    members: [
      { id: "M001", nama: "Budi", poin: 0 },
      { id: "M002", nama: "Sari", poin: 0 }
    ],
    transaksi: [],
    sewa: []
  };
}

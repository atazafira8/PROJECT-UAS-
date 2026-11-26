import { tanya, tanyaAngka, tanyaTeks, tanyaYaTidak } from "./input";
import { simpanData } from "./penyimpanan";
import { Database, Item, ItemKeranjang, TipeItem } from "./types";
import { akhirPekan, formatRupiah } from "./util";

const DAFTAR_TIPE: TipeItem[] = ["tiket", "sewa", "kantin"];

export function cariItem(db: Database, id: string): Item | undefined {
  return db.items.find(item => item.id === id.toUpperCase());
}

// Harga tiket mengikuti hari biasa atau akhir pekan.
export function hargaBerlaku(item: Item): number {
  return item.tipe === "tiket" && akhirPekan() ? item.hargaAkhirPekan ?? item.harga : item.harga;
}

function cetakBaris(item: Item): void {
  const stok = item.stok > 0 ? `stok ${item.stok}` : "HABIS";
  console.log(`${item.id}  ${item.nama.padEnd(20)} ${formatRupiah(hargaBerlaku(item)).padStart(10)}  (${stok})`);
}

// READ: seluruh item dikelompokkan per tipe.
export function tampilkanItem(db: Database): void {
  console.log(`\n=== DAFTAR ITEM (${akhirPekan() ? "Akhir Pekan" : "Hari Biasa"}) ===`);
  DAFTAR_TIPE.forEach(tipe => {
    console.log(`\n[${tipe.toUpperCase()}]`);
    for (const item of db.items) {
      if (item.tipe === tipe) cetakBaris(item);
    }
  });
}

// READ: detail berdasarkan ID.
export async function detailItem(db: Database): Promise<void> {
  const item = cariItem(db, await tanyaTeks("ID item: "));
  if (!item) {
    console.log("Item tidak ditemukan.");
    return;
  }
  console.log(`\nID       : ${item.id}`);
  console.log(`Nama     : ${item.nama}`);
  console.log(`Tipe     : ${item.tipe}`);
  console.log(`Kategori : ${item.kategori}`);
  console.log(`Harga    : ${formatRupiah(item.harga)}`);
  if (item.tipe === "tiket") console.log(`Akhir pekan : ${formatRupiah(item.hargaAkhirPekan ?? item.harga)}`);
  if (item.tipe === "sewa") console.log(`Deposit  : ${formatRupiah(item.deposit ?? 0)}`);
  console.log(`Stok     : ${item.stok}`);
}

// SEARCH: kata kunci nama + filter tipe.
export async function pencarian(db: Database): Promise<void> {
  const kunci = (await tanyaTeks("Kata kunci nama: ")).toLowerCase();
  console.log("Filter tipe: 0. Semua  1. Tiket  2. Sewa  3. Kantin");
  const pilih = await tanyaAngka("Pilih filter: ", 0, 3);

  const hasil = db.items.filter(item =>
    item.nama.toLowerCase().includes(kunci) && (pilih === 0 || item.tipe === DAFTAR_TIPE[pilih - 1])
  );

  if (hasil.length === 0) console.log("Item tidak ditemukan.");
  else hasil.forEach(cetakBaris);
}

// CREATE
async function tambahItem(db: Database): Promise<void> {
  console.log("Tipe: 1. Tiket  2. Sewa  3. Kantin");
  const tipe = DAFTAR_TIPE[(await tanyaAngka("Pilih tipe: ", 1, 3)) - 1]!;
  const id = (await tanyaTeks("ID baru (contoh K09): ")).toUpperCase();

  if (!/^[A-Z]\d{2,3}$/.test(id)) {
    console.log("Format ID: 1 huruf diikuti 2-3 angka.");
    return;
  }
  if (cariItem(db, id)) {
    console.log("ID sudah dipakai.");
    return;
  }

  const item: Item = {
    id,
    tipe,
    nama: await tanyaTeks("Nama: "),
    kategori: await tanyaTeks("Kategori: "),
    harga: await tanyaAngka("Harga: ", 1, 10000000),
    stok: await tanyaAngka("Stok: ", 0, 10000)
  };

  if (tipe === "tiket") {
    item.hargaAkhirPekan = await tanyaAngka("Harga akhir pekan: ", 1, 10000000);
    item.kuota = item.stok;
  } else if (tipe === "sewa") {
    item.deposit = await tanyaAngka("Deposit: ", 0, 10000000);
  }

  db.items.push(item);
  simpanData(db);
  console.log("Item berhasil ditambahkan.");
}

// Item yang sedang dipakai tidak boleh diubah atau dihapus.
function sedangDipakai(db: Database, keranjang: ItemKeranjang[], id: string): boolean {
  const diKeranjang = keranjang.some(k => k.idItem === id);
  const disewa = db.sewa.some(s => s.idItem === id && s.status === "disewa");
  if (diKeranjang) console.log("Item masih ada di keranjang.");
  if (disewa) console.log("Item masih disewa.");
  return diKeranjang || disewa;
}

// UPDATE: tekan Enter untuk mempertahankan nilai lama.
async function ubahItem(db: Database, keranjang: ItemKeranjang[]): Promise<void> {
  const item = cariItem(db, await tanyaTeks("ID item yang diubah: "));
  if (!item) {
    console.log("Item tidak ditemukan.");
    return;
  }
  if (sedangDipakai(db, keranjang, item.id)) return;

  const angkaBaru = async (label: string, lama: number, min: number): Promise<number> => {
    while (true) {
      const teks = await tanya(`${label} [${lama}]: `);
      if (teks === "") return lama;
      if (/^\d+$/.test(teks) && Number(teks) >= min) return Number(teks);
      console.log(`Masukkan angka bulat minimal ${min}.`);
    }
  };

  item.nama = (await tanya(`Nama [${item.nama}]: `)) || item.nama;
  item.kategori = (await tanya(`Kategori [${item.kategori}]: `)) || item.kategori;
  item.harga = await angkaBaru("Harga", item.harga, 1);
  item.stok = await angkaBaru("Stok", item.stok, 0);

  if (item.tipe === "tiket") {
    item.hargaAkhirPekan = await angkaBaru("Harga akhir pekan", item.hargaAkhirPekan ?? item.harga, 1);
    item.kuota = await angkaBaru("Kuota harian", item.kuota ?? item.stok, 0);
  } else if (item.tipe === "sewa") {
    item.deposit = await angkaBaru("Deposit", item.deposit ?? 0, 0);
  }

  simpanData(db);
  console.log("Item berhasil diubah.");
}

// DELETE dengan konfirmasi Y/N.
async function hapusItem(db: Database, keranjang: ItemKeranjang[]): Promise<void> {
  const id = (await tanyaTeks("ID item yang dihapus: ")).toUpperCase();
  const indeks = db.items.findIndex(item => item.id === id);

  if (indeks === -1) {
    console.log("Item tidak ditemukan.");
    return;
  }
  if (sedangDipakai(db, keranjang, id)) return;

  if (await tanyaYaTidak(`Yakin menghapus ${db.items[indeks]!.nama}?`)) {
    db.items.splice(indeks, 1);
    simpanData(db);
    console.log("Item berhasil dihapus.");
  } else {
    console.log("Penghapusan dibatalkan.");
  }
}

export async function menuInventaris(db: Database, keranjang: ItemKeranjang[]): Promise<void> {
  let kembali = false;
  while (!kembali) {
    console.log("\n--- Kelola Inventaris ---\n1. Tambah  2. Ubah  3. Hapus  0. Kembali");
    switch (await tanya("Pilih: ")) {
      case "1": await tambahItem(db); break;
      case "2": await ubahItem(db, keranjang); break;
      case "3": await hapusItem(db, keranjang); break;
      case "0": kembali = true; break;
      default: console.log("Pilihan tidak valid.");
    }
  }
}

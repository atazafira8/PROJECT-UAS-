import { tanyaAngka, tanyaTeks, tanyaYaTidak } from "./input";
import { cariItem } from "./inventaris";
import { simpanData } from "./penyimpanan";
import { Database } from "./types";
import { formatRupiah, tanggalLokal } from "./util";

export const DENDA_PER_JAM = 5000;

// Denda tidak melebihi deposit.
export function hitungDenda(batas: Date, kembali: Date, depositPerUnit: number, rusak: number, deposit: number): number {
  const jamTerlambat = Math.max(0, Math.ceil((kembali.getTime() - batas.getTime()) / 3600000));
  return Math.min(deposit, jamTerlambat * DENDA_PER_JAM + rusak * depositPerUnit);
}

function statusWaktu(batas: Date, deposit: number): string {
  const sekarang = new Date();
  if (sekarang > batas) {
    const jam = Math.ceil((sekarang.getTime() - batas.getTime()) / 3600000);
    if (jam > 1) {
      if (jam * DENDA_PER_JAM >= deposit) {
        return "TERLAMBAT, deposit habis";
      }
      return `TERLAMBAT ${jam} jam`;
    }
    return "TERLAMBAT 1 jam";
  }
  return "dalam batas waktu";
}

export async function pengembalian(db: Database): Promise<void> {
  const aktif = db.sewa.filter(s => s.status === "disewa");
  if (aktif.length === 0) {
    console.log("\nTidak ada barang yang sedang disewa.");
    return;
  }

  console.log("\n=== SEDANG DISEWA ===");
  for (const s of aktif) {
    const status = statusWaktu(new Date(s.batasKembali), s.deposit);
    console.log(`${s.id}  ${s.pembeli} - ${s.nama} x${s.jumlah} (${status})`);
  }

  const id = (await tanyaTeks("ID sewa yang dikembalikan: ")).toUpperCase();
  const sewa = aktif.find(s => s.id === id);
  if (!sewa) {
    console.log("ID sewa tidak ditemukan.");
    return;
  }

  const rusak = await tanyaAngka(`Jumlah rusak/hilang (0-${sewa.jumlah}): `, 0, sewa.jumlah);
  const sekarang = new Date();
  const denda = hitungDenda(new Date(sewa.batasKembali), sekarang, sewa.deposit / sewa.jumlah, rusak, sewa.deposit);

  console.log(`Denda            : ${formatRupiah(denda)}`);
  console.log(`Deposit kembali  : ${formatRupiah(sewa.deposit - denda)}`);
  if (!(await tanyaYaTidak("Proses pengembalian?"))) return;

  sewa.status = rusak > 0 ? "rusak" : "dikembalikan";
  sewa.denda = denda;
  sewa.tanggalKembali = tanggalLokal(sekarang);

  const item = cariItem(db, sewa.idItem);
  if (item) item.stok += sewa.jumlah - rusak;

  simpanData(db);
  console.log("Pengembalian berhasil.");
}

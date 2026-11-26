import { Database } from "./types";
import { formatRupiah, tanggalLokal } from "./util";

export function rekapHarian(db: Database): void {
  const hariIni = tanggalLokal();
  const transaksi = db.transaksi.filter(t => t.tanggal === hariIni);

  let penjualan = 0;
  transaksi.forEach(t => { penjualan += t.subtotal - t.diskon; });

  let denda = 0;
  for (const s of db.sewa) {
    if (s.tanggalKembali === hariIni) denda += s.denda;
  }

  const depositDitahan = db.sewa
    .filter(s => s.status === "disewa")
    .reduce((total, s) => total + s.deposit, 0);

  console.log(`\n=== REKAP HARIAN ${hariIni} ===`);
  console.log(`Jumlah transaksi : ${transaksi.length}`);
  console.log(`Penjualan        : ${formatRupiah(penjualan)}`);
  console.log(`Denda            : ${formatRupiah(denda)}`);
  console.log(`Total omzet      : ${formatRupiah(penjualan + denda)}`);
  console.log(`Deposit ditahan  : ${formatRupiah(depositDitahan)} (bukan omzet)`);
  console.log("\nSisa stok:");
  for (const item of db.items) console.log(`- ${item.nama.padEnd(20)} ${item.stok}`);
}

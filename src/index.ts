// Program Kasir Terpadu Kolam Renang
import { InputBerakhir, tanya, tanyaYaTidak, tutupInput } from "./input";
import { detailItem, menuInventaris, pencarian, tampilkanItem } from "./inventaris";
import { menuKeranjang, tambahKeKeranjang } from "./keranjang";
import { rekapHarian } from "./laporan";
import { muatData, simpanData } from "./penyimpanan";
import { pengembalian } from "./sewa";
import { checkout } from "./transaksi";
import { ItemKeranjang } from "./types";

async function main(): Promise<void> {
  const db = muatData();
  const keranjang: ItemKeranjang[] = [];
  let berjalan = true;

  while (berjalan) {
    console.log("\n=== KASIR KOLAM RENANG ===");
    console.log("1. Daftar item");
    console.log("2. Detail item");
    console.log("3. Cari item");
    console.log("4. Tambah ke keranjang");
    console.log("5. Kelola keranjang");
    console.log("6. Checkout");
    console.log("7. Pengembalian sewa");
    console.log("8. Kelola inventaris");
    console.log("9. Rekap harian");
    console.log("0. Keluar");

    switch (await tanya("Pilih menu (0-9): ")) {
      case "1": tampilkanItem(db); break;
      case "2": await detailItem(db); break;
      case "3": await pencarian(db); break;
      case "4": await tambahKeKeranjang(db, keranjang); break;
      case "5": await menuKeranjang(db, keranjang); break;
      case "6": await checkout(db, keranjang); break;
      case "7": await pengembalian(db); break;
      case "8": await menuInventaris(db, keranjang); break;
      case "9": rekapHarian(db); break;
      case "0":
        if (keranjang.length === 0 || await tanyaYaTidak("Keranjang belum dibayar. Yakin keluar?")) {
          berjalan = false;
        }
        break;
      default:
        console.log("Pilihan menu tidak valid.");
    }
  }

  simpanData(db);
  console.log("\nData tersimpan. Terima kasih.");
}

main()
  .catch((error: unknown) => {
    if (!(error instanceof InputBerakhir)) console.error("Terjadi kesalahan:", error);
  })
  .finally(tutupInput);

import { tanya, tanyaAngka, tanyaTeks } from "./input";
import { cariItem, hargaBerlaku, tampilkanItem } from "./inventaris";
import { Database, ItemKeranjang } from "./types";
import { formatRupiah } from "./util";

export async function tambahKeKeranjang(db: Database, keranjang: ItemKeranjang[]): Promise<void> {
  tampilkanItem(db);
  let lanjut = true;

  // Pembeli bisa menambah banyak item sekaligus.
  while (lanjut) {
    const id = (await tanya("\nID item (Enter untuk selesai): ")).toUpperCase();
    if (id === "") {
      lanjut = false;
      continue;
    }

    const item = cariItem(db, id);
    if (!item) {
      console.log("Item tidak ditemukan.");
      continue;
    }

    const ada = keranjang.find(k => k.idItem === item.id);
    const sisa = item.stok - (ada ? ada.jumlah : 0);
    if (sisa <= 0) {
      console.log("Stok habis.");
      continue;
    }

    const jumlah = await tanyaAngka(`Jumlah ${item.nama} (1-${sisa}): `, 1, sisa);
    if (ada) {
      ada.jumlah += jumlah;
    } else {
      keranjang.push({
        idItem: item.id,
        nama: item.nama,
        tipe: item.tipe,
        kategori: item.kategori,
        harga: hargaBerlaku(item),
        deposit: item.deposit ?? 0,
        jumlah
      });
    }
    console.log(`${jumlah} x ${item.nama} masuk keranjang.`);
  }
}

export function tampilkanKeranjang(keranjang: ItemKeranjang[]): boolean {
  if (keranjang.length === 0) {
    console.log("\nKeranjang masih kosong.");
    return false;
  }
  console.log("\n=== KERANJANG ===");
  for (let i = 0; i < keranjang.length; i++) {
    const k = keranjang[i]!;
    console.log(`${i + 1}. [${k.idItem}] ${k.nama} ${k.jumlah} x ${formatRupiah(k.harga)} = ${formatRupiah(k.jumlah * k.harga)}`);
  }
  return true;
}

export async function menuKeranjang(db: Database, keranjang: ItemKeranjang[]): Promise<void> {
  if (!tampilkanKeranjang(keranjang)) return;

  console.log("\n1. Ubah jumlah  2. Hapus item  0. Kembali");
  const pilihan = await tanya("Pilih: ");
  if (pilihan === "0") return;
  if (pilihan !== "1" && pilihan !== "2") {
    console.log("Pilihan tidak valid.");
    return;
  }

  const id = (await tanyaTeks("ID item: ")).toUpperCase();
  const indeks = keranjang.findIndex(k => k.idItem === id);
  if (indeks === -1) {
    console.log("Item tidak ada di keranjang.");
    return;
  }

  if (pilihan === "1") {
    const stok = cariItem(db, id)?.stok ?? 0;
    keranjang[indeks]!.jumlah = await tanyaAngka(`Jumlah baru (1-${stok}): `, 1, stok);
    console.log("Jumlah diubah.");
  } else {
    keranjang.splice(indeks, 1);
    console.log("Item dihapus dari keranjang.");
  }
}

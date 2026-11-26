import { tanya, tanyaAngka, tanyaTeks, tanyaYaTidak } from "./input";
import { tampilkanKeranjang } from "./keranjang";
import { cariItem } from "./inventaris";
import { simpanData } from "./penyimpanan";
import { Database, ItemKeranjang, Member, Transaksi } from "./types";
import { formatRupiah, tanggalLokal } from "./util";

export const LAMA_SEWA_JAM = 3;

export function hitungSubtotal(keranjang: ItemKeranjang[]): number {
  let subtotal = 0;
  for (const k of keranjang) subtotal += k.harga * k.jumlah;
  return subtotal;
}

export function hitungDeposit(keranjang: ItemKeranjang[]): number {
  let deposit = 0;
  for (const k of keranjang) deposit += k.deposit * k.jumlah;
  return deposit;
}

function jumlahTiket(keranjang: ItemKeranjang[], kategori?: string): number {
  return keranjang
    .filter(k => k.tipe === "tiket" && (!kategori || k.kategori === kategori))
    .reduce((total, k) => total + k.jumlah, 0);
}

// Hanya diskon terbesar yang berlaku.
export function tentukanPromo(keranjang: ItemKeranjang[], member: boolean): { nama: string; persen: number } {
  if (jumlahTiket(keranjang) >= 10) return { nama: "Rombongan", persen: 15 };
  if (jumlahTiket(keranjang, "Dewasa") >= 2 && jumlahTiket(keranjang, "Anak") >= 2) {
    return { nama: "Paket Keluarga", persen: 12 };
  }
  if (member) return { nama: "Member", persen: 10 };
  return { nama: "Tanpa promo", persen: 0 };
}

export function hitungDiskon(subtotal: number, persen: number): number {
  let diskon = subtotal;
  diskon *= persen;
  diskon /= 100;
  return Math.round(diskon);
}

// 1 poin setiap Rp10.000 belanja.
export function hitungPoin(belanja: number): number {
  return (belanja - (belanja % 10000)) / 10000;
}

async function pilihMember(db: Database): Promise<Member | undefined> {
  while (true) {
    const id = (await tanya("ID member (Enter jika bukan, 'baru' untuk daftar): ")).toUpperCase();
    if (id === "") return undefined;

    if (id === "BARU") {
      const nomor = db.members.length + 1;
      const member: Member = { id: "M" + String(nomor).padStart(3, "0"), nama: await tanyaTeks("Nama member: "), poin: 0 };
      db.members.push(member);
      simpanData(db);
      console.log(`Terdaftar dengan ID ${member.id}.`);
      return member;
    }

    const member = db.members.find(m => m.id === id);
    if (member) return member;
    console.log("Member tidak ditemukan.");
  }
}

function cetakStruk(t: Transaksi): void {
  console.log("\n========== STRUK PEMBAYARAN ==========");
  console.log(`No      : ${t.id}`);
  console.log(`Waktu   : ${new Date().toLocaleString("id-ID")}`);
  console.log(`Pembeli : ${t.pembeli}${t.idMember ? ` (${t.idMember})` : ""}`);
  console.log("--------------------------------------");
  for (const k of t.items) {
    console.log(`${k.nama} ${k.jumlah} x ${formatRupiah(k.harga)} = ${formatRupiah(k.jumlah * k.harga)}`);
  }
  console.log("--------------------------------------");
  console.log(`Subtotal  : ${formatRupiah(t.subtotal)}`);
  console.log(`Diskon    : -${formatRupiah(t.diskon)} (${t.namaPromo})`);
  console.log(`Deposit   : ${formatRupiah(t.deposit)}`);
  console.log(`TOTAL     : ${formatRupiah(t.total)}`);
  console.log(`Bayar     : ${formatRupiah(t.uangBayar)}`);
  console.log(`Kembalian : ${formatRupiah(t.kembalian)}`);
  console.log("======================================");
}

export async function checkout(db: Database, keranjang: ItemKeranjang[]): Promise<void> {
  if (!tampilkanKeranjang(keranjang)) return;

  const pembeli = await tanyaTeks("\nNama pembeli: ");
  const member = await pilihMember(db);
  const subtotal = hitungSubtotal(keranjang);
  const promo = tentukanPromo(keranjang, member !== undefined);
  const diskon = hitungDiskon(subtotal, promo.persen);
  const deposit = hitungDeposit(keranjang);
  const total = subtotal - diskon + deposit;

  console.log(`\nSubtotal : ${formatRupiah(subtotal)}`);
  console.log(`Diskon   : -${formatRupiah(diskon)} (${promo.nama} ${promo.persen}%)`);
  console.log(`Deposit  : ${formatRupiah(deposit)}`);
  console.log(`TOTAL    : ${formatRupiah(total)}`);

  if (!(await tanyaYaTidak("Lanjut bayar?"))) return;

  let uangBayar = await tanyaAngka("Uang bayar (0 untuk batal): ", 0, 100000000);
  while (uangBayar !== 0 && uangBayar < total) {
    console.log(`Uang kurang ${formatRupiah(total - uangBayar)}.`);
    uangBayar = await tanyaAngka("Uang bayar (0 untuk batal): ", 0, 100000000);
  }
  if (uangBayar === 0) {
    console.log("Pembayaran dibatalkan. Keranjang tetap tersimpan.");
    return;
  }

  const sekarang = new Date();
  const transaksi: Transaksi = {
    id: "TRX" + String(db.transaksi.length + 1).padStart(4, "0"),
    tanggal: tanggalLokal(sekarang),
    pembeli,
    items: keranjang.map(k => ({ ...k })),
    subtotal,
    namaPromo: promo.nama,
    diskon,
    deposit,
    total,
    uangBayar,
    kembalian: uangBayar - total,
    ...(member ? { idMember: member.id } : {})
  };

  // Kurangi stok dan catat barang yang disewa.
  const batas = new Date(sekarang.getTime() + LAMA_SEWA_JAM * 3600000);
  for (const k of keranjang) {
    const item = cariItem(db, k.idItem);
    if (item) item.stok -= k.jumlah;

    if (k.tipe === "sewa") {
      db.sewa.push({
        id: "SW" + String(db.sewa.length + 1).padStart(4, "0"),
        idTransaksi: transaksi.id,
        pembeli,
        idItem: k.idItem,
        nama: k.nama,
        jumlah: k.jumlah,
        deposit: k.deposit * k.jumlah,
        batasKembali: batas.toISOString(),
        status: "disewa",
        denda: 0
      });
    }
  }

  if (member) member.poin += hitungPoin(subtotal - diskon);
  db.transaksi.push(transaksi);
  keranjang.length = 0;
  simpanData(db);

  cetakStruk(transaksi);
  if (member) console.log(`Total poin ${member.nama}: ${member.poin}`);
  if (deposit > 0) console.log(`Kembalikan barang sewa sebelum ${batas.toLocaleString("id-ID")}.`);
}

import * as readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const barisMasuk = rl[Symbol.asyncIterator]();

export class InputBerakhir extends Error {}

// Menerima satu baris input dari pengguna.
export async function tanya(pesan: string): Promise<string> {
  rl.setPrompt(pesan);
  rl.prompt();
  const hasil = await barisMasuk.next();
  if (hasil.done) throw new InputBerakhir();
  return String(hasil.value).trim();
}

// Mengulang pertanyaan sampai teks tidak kosong.
export async function tanyaTeks(pesan: string): Promise<string> {
  let teks = await tanya(pesan);
  while (teks === "") {
    console.log("Input tidak boleh kosong.");
    teks = await tanya(pesan);
  }
  return teks;
}

// Mengulang pertanyaan sampai input berupa bilangan bulat dalam rentang.
export async function tanyaAngka(pesan: string, min: number, maks: number): Promise<number> {
  let angka = 0;
  let valid = false;

  do {
    const teks = await tanya(pesan);
    angka = Number(teks);
    valid = /^\d+$/.test(teks) && angka >= min && angka <= maks;
    if (!valid) console.log(`Masukkan angka bulat ${min} sampai ${maks} (tanpa titik).`);
  } while (!valid);

  return angka;
}

export async function tanyaYaTidak(pesan: string): Promise<boolean> {
  while (true) {
    const jawab = (await tanya(`${pesan} (y/n): `)).toLowerCase();
    if (jawab === "y") return true;
    if (jawab === "n") return false;
    console.log("Jawab dengan y atau n.");
  }
}

export function tutupInput(): void {
  rl.close();
}

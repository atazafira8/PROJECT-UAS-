import * as fs from "fs";
import * as path from "path";
import { buatDataAwal } from "./data";
import { Database } from "./types";
import { tanggalLokal } from "./util";

const LOKASI = path.join(process.cwd(), "data", "db.json");

export function muatData(): Database {
  const hariIni = tanggalLokal();
  if (!fs.existsSync(LOKASI)) return buatDataAwal(hariIni);

  // Jika file rusak, JSON.parse gagal dan file lama tidak ditimpa.
  const db: Database = JSON.parse(fs.readFileSync(LOKASI, "utf-8"));

  // Kuota tiket diisi ulang saat berganti hari.
  if (db.tanggalKuota !== hariIni) {
    for (const item of db.items) {
      if (item.tipe === "tiket") item.stok = item.kuota ?? item.stok;
    }
    db.tanggalKuota = hariIni;
  }
  return db;
}

export function simpanData(db: Database): void {
  fs.mkdirSync(path.dirname(LOKASI), { recursive: true });
  fs.writeFileSync(LOKASI, JSON.stringify(db, null, 2));
}

export function formatRupiah(angka: number): string {
  return "Rp" + angka.toLocaleString("id-ID");
}

// Tanggal lokal dalam format YYYY-MM-DD.
export function tanggalLokal(waktu: Date = new Date()): string {
  const bulan = String(waktu.getMonth() + 1).padStart(2, "0");
  const hari = String(waktu.getDate()).padStart(2, "0");
  return `${waktu.getFullYear()}-${bulan}-${hari}`;
}

export function akhirPekan(waktu: Date = new Date()): boolean {
  return waktu.getDay() === 0 || waktu.getDay() === 6;
}

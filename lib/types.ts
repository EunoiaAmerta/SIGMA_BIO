export interface StudentData {
  NO: string;
  NISN: string;
  "Nama Lengkap": string;
  "Email Google": string;
  Kelas: string;
  "Current Semester": string;
  "Saldo Akhir GS": number;
  
  // Semester 1
  "Rata Harian (90%) S1": number;
  "Nilai Asli UAS S1": number;
  "Redeem GS UAS S1": number;
  "Final UAS (10%) S1": number;
  "NILAI RAPOR S1": number;
  "SISA SALDO": number;
  "KURS GS": number;
  "Saldo Akhir GS S1": number;
  
  // Semester 2
  "Rata Harian (90%) S2": number;
  "Nilai Asli UAS S2": number;
  "Redeem GS UAS S2": number;
  "Final UAS (10%) S2": number;
  "NILAI RAPOR S2": number;
  "SISA SALDO S2": number;
  "Saldo Akhir GS S2": number;
  
  // Golden Stars
  "Golden Star Semester 1": number;
  "Golden Star Semester 2": number;
  
  // Task Scores (Bab 1)
  "Tugas 1 Bab 1 S1": number;
  "Tugas 1 GS S1": number;
  "Tugas 2 Bab 1 S1": number;
  "Tugas 2 GS S1": number;
  "Tugas 3 Bab 1 S1": number;
  "Tugas 3 GS S1": number;
  "Tugas 4 Bab 1 S1": number;
  "Tugas 4 GS S1": number;
  "Tugas 5 Bab 1 S1": number;
  "Tugas 5 GS S1": number;
  "Tugas 6 Bab 1 S1": number;
  "Tugas 6 GS S1": number;
  
  // Summary
  "TOTAL GS DAPAT S1": number;
  "TOTAL GS TERPAKAI S1": number;
  "SALDO SAAT INI S1": number;
  "TOTAL GS DAPAT S2": number;
  "TOTAL GS TERPAKAI S2": number;
  "SALDO SAAT INI S2": number;
  
  // History and other fields
  [key: string]: any;
}

export interface UserSession {
  email: string;
  nisn: string;
  name: string;
  class: string;
  semester: "Semester Ganjil" | "Semester Genap";
}

export interface GrowthData {
  date: string;
  score: number;
}

export interface TransactionItem {
  chapter: string;
  earned: number;
  used: number;
  balance: number;
}

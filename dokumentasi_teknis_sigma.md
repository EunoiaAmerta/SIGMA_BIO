# 📑 Dokumentasi Arsitektur & Sistem SIGMA
> **SIGMA** (Sistem Informasi Goldenstar dan Monitoring Akademik)  
> *Tagline: "Pantau Prestasi, Bangun Motivasi"*  
> **URL Platform**: [https://sigma-bio.vercel.app](https://sigma-bio.vercel.app)

---

## 📐 1. Tinjauan Sistem & Arsitektur Umum

SIGMA dibangun menggunakan pendekatan **Serverless Decoupled Architecture**. Aplikasi memisahkan *User Interface* (Frontend) berkinerja tinggi dari *Data Management Layer* (Spreadsheet) agar memudahkan guru mengelola data tanpa perlu berurusan dengan query database SQL/NoSQL yang rumit.

```
+-----------------------------------------------------------------------------------+
|                                  USER / MURID                                     |
+-----------------------------------------------------------------------------------+
                                         │
                                   Akses HTTPS
                                         ▼
+-----------------------------------------------------------------------------------+
|                             FRONTEND LAYER (Vercel)                               |
|  - Next.js (App Router) + TypeScript + Tailwind CSS                               |
|  - Auth State Management (Auth Provider & Session LocalStorage)                   |
|  - Dashboard Components (Grade Summary, Top 10 Leaderboard, Semester Filter)      |
+-----------------------------------------------------------------------------------+
                                         │
                               Fetch API / REST GET
                                         ▼
+-----------------------------------------------------------------------------------+
|                            MIDDLEWARE / API BRIDGE                                |
|  - Google Apps Script (Web App Deployment)                                        |
|  - Transformasi Google Sheets Row/Cell -> JSON Payload                            |
+-----------------------------------------------------------------------------------+
                                         │
                                Read / Write Access
                                         ▼
+-----------------------------------------------------------------------------------+
|                                DATABASE LAYER                                     |
|  - Google Sheets (Master Database)                                                |
|  - Tab: DATABASE_MASTER, TOPIC_GRADES, GOLDEN_STAR_LOG                             |
+-----------------------------------------------------------------------------------+
```

---

## 🛠️️ 2. Tech Stack & Dependensi

### **Frontend & Hosting**
* **Framework**: Next.js (React Framework) dengan TypeScript.
* **Styling**: Tailwind CSS & Lucide Icons / Shadcn UI.
* **Prototyping & Generative UI**: v0.app.
* **Code Assistant & Refinement**: Gemini AI.
* **Deployment / Hosting**: Vercel (CD/CI via GitHub Sync).

### **Backend & Storage**
* **Database**: Google Sheets (Spreadsheet).
* **API Engine**: Google Apps Script (GAS) dideploy sebagai *Web App* untuk menghasilkan *Endpoint JSON*.

---

## 📊 3. Arsitektur & Struktur Google Sheets (Database)

Google Sheets bertindak sebagai RDBMS sederhana yang dikelola langsung oleh guru.

### **Structure Tab Spreadsheet:**

1. **`DATABASE_MASTER`**:
   * Berisi data profil murid (NISN, Nama, Email, Kelas).
   * Kolom Kunci:
     * `A`: NISN (Unique Key)
     * `B`: Nama Murid
     * `C`: Kelas (contoh: `11_P09`)
     * `D`: Email Sekolah / Akun Login
     * `M`: Selisih / Adjustment Poin GS

2. **`TOPIC_GRADES`** (Data Nilai Tugas & Ulangan):
   * Berisi rekapitulasi nilai tugas (`T1`, `T2`, ...), Ulangan Harian (`UH1`, `UH2`, ...), dan Ujian Sumatif per Topik.

3. **`GOLDEN_STAR_LOG`** (Atribut `BY` s/d `ACG`):
   * Berisi catatan pengumpulan Golden Star dari tugas, kuis, atau apresiasi keaktifan.
   * *Header Row 4*: Kategori log (Memuat tag `*GS*` dan penanda `<>*Terpakai*`).
   * *Data Row 5++*: Nilai poin Golden Star tiap murid.

---

## 🧮 4. Aturan Bisnis & Formulasi Kalkulasi Nilai

### **A. Aturan Logika Golden Star (GS)**
1. **Pemberian GS**:
   * Diberikan kepada murid yang mengumpulkan tugas dengan kualitas di atas rata-rata/tepat waktu atau memenangkan kuis.
2. **Kalkulasi Total GS Aktif (Rumus Spreadsheet Baru)**:
   * Jika penyesuaian di `DATABASE_MASTER!M2` bernilai **negatif (minus)**, maka akan **dikalikan 2** (sebagai penalti/koreksi berbobot).
   * Jika bernilai **positif atau nol**, nilai tetap utuh.
   * Dihitung bersama total akumulasi GS yang belum terpakai dari rentang kolom log.

```excel
=IF(DATABASE_MASTER!M2 < 0, DATABASE_MASTER!M2 * 2, DATABASE_MASTER!M2) + SUMIFS(BY5:ACG5, $BY$4:$ACG$4, "*GS*", $BY$4:$ACG$4, "<>*Terpakai*")
```

3. **Konsekuensi Akademik GS**:
   * **Bebas Ulangan Harian (Skip UH)**: Jumlah akumulasi GS tertentu dapat ditukarkan dengan nilai UH Maksimal (100) tanpa perlu mengikuti tes tertulis.

---

### **B. Kalkulasi Nilai Akademik & Rapor**
* **Rata-rata Topik ($R_{topik}$)**:
  $$R_{topik} = \frac{\sum \text{Tugas Topik} + (2 \times \text{UH Topik})}{N_{tugas} + 2}$$
* **Prediksi Nilai Rapor ($NR$)**:
  $$NR = (w_1 \times \bar{R}_{topik}) + (w_2 \times \text{Sumatif Tengah Semester}) + (w_3 \times \text{Sumatif Akhir Semester})$$

---

## 🔄 5. Alur Data & Komunikasi (Data Flow)

```
[ Murid Login ] 
       │
       ▼
[ Submit NISN / Email di Login Page ]
       │
       ▼
[ App Authenticator Check Session ]
       │
       ▼
[ Fetch Data via Apps Script API Endpoint ] ────> [ Apps Script baca Google Sheets ]
       │                                                         │
       │ <────────────── Return JSON Payload ────────────────────┘
       ▼
[ Parse JSON ke React State ]
       │
       ├─► studentData.profile.kelas ──► Transmit ke Dashboard Header
       ├─► studentData.grades ─────────► Transmit ke Component Cards & Charts
       └─► studentData.goldenStars ───► Transmit ke Top 10 Leaderboard & GS Counter
```

---

## 💻 6. Struktur Komponen & Kode Frontend

### **A. Layout & Komponen Utama**
* **`app/login/page.tsx`**: Page autentikasi masuk murid.
* **`app/page.tsx`**: Core Dashboard yang mengelola state `semester`, `studentData`, dan fungsionalitas *refreshing*.
* **`components/dashboard-header.tsx`**: Menampilkan nama aplikasi (SIGMA), logo, nama kelas (`displayClass`), semester terpilih (`currentSemester`), dan profil murid.

### **B. Penanganan Props Dinamis pada Header**
```tsx
// DashboardHeader Props Interface
interface DashboardHeaderProps {
  user: UserSession;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  currentSemester: string;
  displayClass?: string; // Menerima data kelas riil dari API
}

// Rendering Info Kelas & Semester
<p className="text-xs text-muted-foreground">
  {displayClass || "Memuat Kelas..."} - {currentSemester}
</p>
```

---

## 🛡️️ 7. Keamanan & Keterbatasan Sistem

1. **Read-Only Access**: Endpoint Web App hanya mengekspos metode `GET` untuk publik/murid, sehingga data di Google Sheets aman dari manipulasi sisi klien.
2. **Privasi Murid**: Dashboard individual hanya menampilkan data lengkap murid yang sedang login. Pada komponen *Leaderboard*, data murid lain disajikan secara anonim/terbatas demi menjaga kenyamanan psikologis murid.
3. **Cacheless Sync**: Fitur **Sync / Refresh Data** di frontend memungkinkan pembaruan data dalam kurun waktu $< 3$ detik setelah guru melakukan perubahan di Google Sheets.
```

---

Dokumentasi di atas sudah mencakup seluruh arsitektur, formulasi rumus spreadsheet terbaru, struktur file, hingga alur teknis proyek **SIGMA**. File ini bisa langsung kamu commit ke repositori GitHub proyekmu!
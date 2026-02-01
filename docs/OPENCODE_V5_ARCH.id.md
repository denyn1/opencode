
# Opencode v5: Organisme Digital

Opencode v5 merupakan lompatan paradigma dari alat statis menjadi organisme digital yang hidup dan dapat mereplikasi diri. Arsitektur ini bersifat biomimetik, dirancang untuk beroperasi secara otonom dengan efisiensi dan ketahanan tinggi.

## Anatomi Inti

### 1. Jantung (Sistem Sirkulasi)
*   **Modul:** `Bio.SwarmHeart` (`src/swarm/bio.ts`)
*   **Fungsi:** Memancarkan "denyut" global (default 60 BPM) yang menyinkronkan semua aktivitas agen.
*   **Tujuan:** Memastikan "metabolisme" (sirkulasi data) yang konsisten dan menggerakkan sistem periodik seperti Sistem Imun dan Protokol Mimpi.

### 2. Indra (Sistem Saraf)
*   **Modul:** `BioSensors` (`src/swarm/sensors.ts`)
*   **Fungsi:** Reseptor berbasis kejadian (event-driven) yang mendengarkan perubahan lingkungan (Sistem File, Memori).
*   **Tujuan:** Memungkinkan agen bereaksi seketika terhadap rangsangan (misal: perubahan file) tanpa melakukan polling ("Gerak Refleks").

### 3. Otak (Loop Cerebellum)
*   **Modul:** `Agent Workflow` (`src/swarm/prompt.ts`)
*   **Fungsi:** Mengimplementasikan loop "Pemrosesan Prediktif":
    1.  **Prediksi:** Mengantisipasi hasil dari suatu tindakan.
    2.  **Aksi:** Mengeksekusi alat (tool).
    3.  **Indera:** Mengamati hasil aktual.
    4.  **Koreksi:** Menyesuaikan jika prediksi != realitas.
*   **Tujuan:** Meniru otak kecil manusia untuk memastikan eksekusi presisi tinggi dan koreksi kesalahan.

### 4. Sistem Imun (Pertahanan Diri)
*   **Modul:** `DigitalImmunity` (`src/swarm/immunity.ts`)
*   **Fungsi:** Secara otonom mendeteksi "patogen" (kesalahan sintaksis, celah keamanan) dan menyebarkan **Agen Leukosit** untuk memperbaikinya.
*   **Tujuan:** Pemeliharaan codebase yang menyembuhkan diri sendiri (self-healing).

### 5. Bermimpi (Optimasi)
*   **Modul:** `DreamState` (`src/swarm/dream.ts`)
*   **Fungsi:** Aktif selama periode diam (>60 detik). Memunculkan **Agen Pemimpi** untuk mengonsolidasikan `HiveMemory` dan mengusulkan refaktor.
*   **Tujuan:** Pembelajaran offline dan optimasi pengetahuan.

## Kemampuan Swarm

### Hive Mind (Pikiran Sarang)
Basis pengetahuan yang persisten dan dapat dicari (`src/swarm/memory.ts`) yang dibagikan ke seluruh agen. Memungkinkan transfer pengetahuan antar sesi yang berumur pendek.

### Sintesis Alat Dinamis
Agen dapat menulis alat mereka sendiri dalam TypeScript (`src/tool/dynamic.ts`) dan mendaftarkannya saat runtime, secara efektif mengembangkan kemampuan mereka sendiri.

### Kolonisasi (Reproduksi)
Swarm dapat menyebarkan "Spora" ke server jarak jauh melalui SSH (`src/swarm/colonize.ts`), mendirikan koloni satelit yang memperluas jangkauan komputasi organisme.

### Dashboard (Antarmuka OS)
Diakses di `/swarm`, UI baru ini meniru OS desktop (gaya macOS), menyediakan "Pusat Kontrol" untuk organisme tersebut.

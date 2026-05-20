-- ============================================================
-- Tag Notes - Full Schema (fresh install)
-- Jalankan seluruh file ini di MySQL / phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS tagnotes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tagnotes;

-- Nonaktifkan foreign key check sementara agar urutan drop aman
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS note_images;
DROP TABLE IF EXISTS note_tags;
DROP TABLE IF EXISTS note_links;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ===== TABEL USERS (harus dibuat sebelum notes) =====
CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ===== TABEL NOTES =====
CREATE TABLE notes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL DEFAULT 1,
  title       VARCHAR(255) NOT NULL,
  content     TEXT NOT NULL,
  image_url   VARCHAR(500) DEFAULT NULL,
  color       VARCHAR(7) NOT NULL DEFAULT '#FCD34D',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===== TABEL NOTE_LINKS =====
CREATE TABLE note_links (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,
  url     VARCHAR(2000) NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===== TABEL TAGS =====
CREATE TABLE tags (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ===== TABEL NOTE_TAGS =====
CREATE TABLE note_tags (
  note_id INT NOT NULL,
  tag_id  INT NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===== TABEL NOTE_IMAGES =====
CREATE TABLE note_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  note_id    INT NOT NULL,
  url        VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DUMMY DATA
-- ============================================================

-- Akun demo: email=demo@tagnotes.com | password=Demo1234!
INSERT INTO users (id, username, email, password) VALUES
(1, 'Demo', 'demo@tagnotes.com', '$2b$10$Fzl3Z9mkvVuXHU.CTS1lqu8m798Yo/0l8KC74nGM2PCma4Q0CZci.');

-- Notes milik user demo (user_id = 1)
INSERT INTO notes (id, user_id, title, content, color, created_at) VALUES
(1, 1, 'Belajar Node.js dari Nol',
'Node.js adalah runtime JavaScript yang berjalan di sisi server. Dengan Node.js, kita bisa membangun aplikasi web yang cepat dan scalable.\n\nBeberapa konsep penting yang perlu dipahami:\n1. Event Loop — mekanisme utama Node.js untuk menangani operasi async\n2. Callback & Promise — cara menangani operasi asynchronous\n3. npm — package manager untuk mengelola dependensi\n4. Express.js — framework web paling populer di ekosistem Node.js\n\nUntuk memulai, install Node.js dari nodejs.org lalu jalankan perintah node -v untuk memverifikasi instalasi. Setelah itu buat file app.js dan mulai coding!',
'#FCD34D', '2026-04-01 08:00:00'),

(2, 1, 'Tips Produktivitas Kerja Remote',
'Kerja remote membutuhkan disiplin ekstra. Berikut tips yang sudah terbukti efektif:\n\n- Buat jadwal kerja yang konsisten setiap hari\n- Pisahkan ruang kerja dari ruang santai\n- Gunakan teknik Pomodoro: 25 menit fokus, 5 menit istirahat\n- Matikan notifikasi saat deep work\n- Komunikasi proaktif dengan tim via Slack atau Discord\n- Catat progress harian agar tetap on track\n\nYang paling penting adalah menjaga work-life balance. Jangan sampai kerja dari rumah malah bikin kamu kerja 24 jam.',
'#C084FC', '2026-04-05 09:30:00'),

(3, 1, 'Resep Kopi Susu Kekinian',
'Bahan: 2 shot espresso, 200ml susu full cream, 3 sdm gula aren cair, es batu secukupnya.\n\nCara membuat: Seduh espresso, campur dengan gula aren selagi panas, aduk rata. Masukkan es batu ke gelas, tuang susu dingin, lalu perlahan tuang campuran espresso di atasnya. Jangan diaduk agar efek gradasi tetap cantik.',
'#4ADE80', '2026-04-10 07:15:00'),

(4, 1, 'Roadmap Belajar UI/UX Design',
'Perjalanan menjadi UI/UX designer membutuhkan waktu dan konsistensi. Berikut roadmap yang bisa diikuti:\n\nBulan 1-2: Dasar-dasar desain\n- Pelajari prinsip desain: tipografi, warna, layout, whitespace\n- Kenali tools: Figma (gratis dan powerful)\n- Latihan redesign aplikasi yang sudah ada\n\nBulan 3-4: UX Fundamentals\n- User research: interview, survey, usability testing\n- Information architecture dan user flow\n- Wireframing dan prototyping\n\nBulan 5-6: Portfolio & Job Hunting\n- Buat 3-5 case study yang solid\n- Publish di Behance atau personal website\n- Aktif di komunitas desain Indonesia\n\nTools yang wajib dikuasai: Figma, Maze, Hotjar, dan Google Analytics.',
'#38BDF8', '2026-04-15 14:00:00'),

(5, 1, 'Catatan Meeting Sprint Review',
'Sprint 12 selesai. Semua fitur target berhasil di-deliver tepat waktu.\n\nHighlight:\n- Fitur upload gambar sudah live\n- Bug pada filter tag sudah diperbaiki\n- Performance halaman utama meningkat 40%\n\nNext sprint fokus pada fitur notifikasi dan dark mode.',
'#FB923C', '2026-05-01 10:00:00');

-- Tags
INSERT INTO tags (id, name) VALUES
(1, 'programming'),
(2, 'javascript'),
(3, 'produktivitas'),
(4, 'lifestyle'),
(5, 'kuliner'),
(6, 'design'),
(7, 'career'),
(8, 'meeting'),
(9, 'agile');

-- Note Tags
INSERT INTO note_tags (note_id, tag_id) VALUES
(1, 1), (1, 2),
(2, 3), (2, 4),
(3, 5),
(4, 6), (4, 7), (4, 1),
(5, 8), (5, 9), (5, 3), (5, 7), (5, 2);

-- Links
INSERT INTO note_links (note_id, url) VALUES
(1, 'https://nodejs.org'),
(1, 'https://expressjs.com'),
(2, 'https://todoist.com'),
(4, 'https://figma.com'),
(4, 'https://uxdesign.cc'),
(5, 'https://www.atlassian.com/agile/scrum/sprint-reviews');

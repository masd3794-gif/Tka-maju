/* =========================================================================
   TKAMAJU — script.js
   Struktur: DB soal -> Auth (fetch ke backend Python) -> Navigasi layar
             -> Kuis -> Skor & Rank -> Leaderboard
   Backend: app.py (Flask) menyediakan /api/register, /api/login,
            /api/update_points, /api/leaderboard/<jenjang>
   ========================================================================= */

const API_BASE = ''; // sama origin dengan app.py, kosongkan jika satu server

/* ---------------------------------------------------------------------
   1) BANK SOAL
   Struktur: QUESTIONS[jenjang][mapel][mode] = [ {t:'mc'|'esai', q, o?, a, p} ]
   t:'mc'   -> o = array pilihan, a = index jawaban benar
   t:'esai' -> a = array jawaban yang diterima (dicocokkan tanpa peduli huruf besar/kecil & spasi)
   p = poin dasar soal (akan dikalikan pengganda mode saat submit)
--------------------------------------------------------------------- */
const SUBJECT_META = {
  bindo: {nm:'Bahasa Indonesia', ic:'📖', color:'var(--sub-bindo)', grad:'linear-gradient(135deg,#E5484D,#FF7A7F)'},
  matematika: {nm:'Matematika', ic:'📐', color:'var(--sub-mtk)', grad:'linear-gradient(135deg,#2F6FED,#5B9BFF)'},
  ipa: {nm:'IPA', ic:'🔬', color:'var(--sub-ipa)', grad:'linear-gradient(135deg,#1BA672,#3FD79A)'},
  ips: {nm:'IPS', ic:'🌏', color:'var(--sub-ips)', grad:'linear-gradient(135deg,#E38A2C,#FFB25E)'},
  bing: {nm:'Bahasa Inggris', ic:'🔤', color:'var(--sub-bing)', grad:'linear-gradient(135deg,#8B5CF6,#B79CFF)'},
};
const JENJANG_META = {sd:'SD/MI Sederajat', smp:'SMP/MTs Sederajat', sma:'SMA/SMK Sederajat'};
const MODE_POIN_MULTIPLIER = {mudah:1, sedang:1.5, susah:2};
const MODE_TIME_PER_SOAL = {mudah:40, sedang:30, susah:25}; // detik per soal

function mc(q,o,a,p=10){return {t:'mc', q, o, a, p};}
function esai(q,a,p=15){return {t:'esai', q, a:Array.isArray(a)?a:[a], p};}

const QUESTIONS = {
  sd: {
    bindo: {
      mudah:[
        mc('Sinonim dari kata "gembira" adalah…', ['Sedih','Senang','Marah','Takut'],1),
        mc('Antonim dari kata "besar" adalah…', ['Luas','Panjang','Kecil','Tinggi'],2),
        esai('Tulis kata baku yang benar: "aktifitas" atau "aktivitas"?', ['aktivitas']),
      ],
      sedang:[
        mc('Kalimat yang menggunakan huruf kapital dengan benar adalah…', ['saya tinggal di kota bandung','Saya tinggal di kota Bandung','Saya Tinggal Di Kota Bandung','saya Tinggal di Kota bandung'],1,15),
        mc('Kata "berlari" termasuk jenis kata…', ['Kata benda','Kata sifat','Kata kerja','Kata keterangan'],2,15),
        esai('Buatlah satu kalimat yang menggunakan kata hubung "karena". (Cukup sebutkan kata hubungnya)', ['karena'],15),
      ],
      susah:[
        mc('Ide pokok sebuah paragraf biasanya terletak pada kalimat…', ['Tengah paragraf','Kalimat tanya','Kalimat utama','Kalimat penutup selalu'],2,20),
        mc('Majas yang membandingkan manusia dengan benda mati disebut majas…', ['Personifikasi','Hiperbola','Metafora langsung','Litotes'],0,20),
        esai('Sebutkan satu contoh kalimat majemuk setara (cukup tulis kata hubungnya, misal: dan/tetapi/atau).', ['dan','tetapi','atau','lalu','kemudian'],20),
      ],
    },
    matematika: {
      mudah:[
        mc('Hasil dari 24 + 18 adalah…', ['32','42','40','44'],1),
        mc('Bentuk pecahan dari setengah adalah…', ['1/3','1/2','2/1','1/4'],1),
        esai('Berapakah hasil dari 9 × 6?', ['54']),
      ],
      sedang:[
        mc('Keliling persegi dengan sisi 12 cm adalah…', ['24 cm','36 cm','48 cm','60 cm'],2,15),
        mc('Hasil dari 144 : 12 adalah…', ['10','11','12','13'],2,15),
        esai('Sebuah toko menjual 3 lusin pensil. Berapa jumlah pensil seluruhnya?', ['36'],15),
      ],
      susah:[
        mc('Luas trapesium dengan sisi sejajar 8 cm dan 12 cm serta tinggi 6 cm adalah…', ['50 cm²','60 cm²','66 cm²','72 cm²'],1,20),
        mc('FPB dari 24 dan 36 adalah…', ['6','8','12','18'],2,20),
        esai('KPK dari 4 dan 6 adalah…', ['12'],20),
      ],
    },
    ipa: {
      mudah:[
        mc('Tumbuhan membuat makanannya sendiri melalui proses…', ['Respirasi','Fotosintesis','Fermentasi','Adaptasi'],1),
        mc('Alat pernapasan pada ikan adalah…', ['Paru-paru','Kulit','Insang','Trakea'],2),
        esai('Sebutkan wujud air pada suhu kamar (padat/cair/gas)?', ['cair']),
      ],
      sedang:[
        mc('Contoh sumber energi yang dapat diperbarui adalah…', ['Batu bara','Minyak bumi','Sinar matahari','Gas alam'],2,15),
        mc('Proses perubahan air menjadi uap disebut…', ['Membeku','Menguap','Mengembun','Mencair'],1,15),
        esai('Sebutkan satu contoh hewan yang mengalami metamorfosis sempurna.', ['kupu-kupu','katak','nyamuk','lalat'],15),
      ],
      susah:[
        mc('Bagian tumbuhan yang berfungsi menyerap air dan mineral dari tanah adalah…', ['Batang','Daun','Akar','Bunga'],2,20),
        mc('Gaya yang menyebabkan benda jatuh ke bawah disebut gaya…', ['Gesek','Magnet','Gravitasi','Otot'],2,20),
        esai('Sebutkan nama proses tumbuhan hijau mengeluarkan oksigen di siang hari.', ['fotosintesis'],20),
      ],
    },
    ips: {
      mudah:[
        mc('Ibu kota negara Indonesia adalah…', ['Bandung','Surabaya','Jakarta','Medan'],2),
        mc('Pulau terbesar di Indonesia bagian barat adalah…', ['Jawa','Sumatra','Kalimantan','Sulawesi'],1),
        esai('Sebutkan nama presiden pertama Indonesia.', ['soekarno','ir soekarno','ir. soekarno']),
      ],
      sedang:[
        mc('Kegiatan menghasilkan barang disebut kegiatan…', ['Konsumsi','Distribusi','Produksi','Promosi'],2,15),
        mc('Hari Kemerdekaan Indonesia diperingati setiap tanggal…', ['1 Juni','17 Agustus','28 Oktober','10 November'],1,15),
        esai('Sebutkan nama lambang negara Indonesia.', ['garuda pancasila','garuda'],15),
      ],
      susah:[
        mc('Organisasi pergerakan nasional pertama di Indonesia adalah…', ['Sarekat Islam','Budi Utomo','Indische Partij','Perhimpunan Indonesia'],1,20),
        mc('Bentuk kerja sama ekonomi negara-negara Asia Tenggara disebut…', ['ASEAN','PBB','WHO','APEC'],0,20),
        esai('Sebutkan nama perjanjian yang mengakui kedaulatan Indonesia tahun 1949.', ['konferensi meja bundar','kmb'],20),
      ],
    },
    bing: {
      mudah:[
        mc('"Buku" dalam bahasa Inggris adalah…', ['Book','Bag','Pen','Desk'],0),
        mc('"I ___ a student." Kata yang tepat adalah…', ['is','am','are','be'],1),
        esai('Terjemahkan ke Bahasa Inggris: "Kucing"', ['cat']),
      ],
      sedang:[
        mc('Bentuk lampau dari "go" adalah…', ['Goed','Gone','Went','Going'],2,15),
        mc('"She ___ to school every day." Jawaban tepat…', ['go','goes','going','gone'],1,15),
        esai('Terjemahkan: "Mereka sedang bermain bola." (gunakan kata "playing")', ['they are playing football','they are playing ball'],15),
      ],
      susah:[
        mc('Sinonim dari "happy" adalah…', ['Sad','Glad','Angry','Tired'],1,20),
        mc('Kalimat tanya yang benar: "___ is your name?"', ['What','Where','When','Why'],0,20),
        esai('Ubah menjadi kalimat negatif: "I like apples." (gunakan "don\'t")', ["i don't like apples","i do not like apples"],20),
      ],
    },
  },
  smp: {
    bindo: {
      mudah:[
        mc('Kalimat utama dalam sebuah paragraf disebut juga…', ['Kalimat penjelas','Kalimat topik','Kalimat tanya','Kalimat majemuk'],1),
        mc('Teks yang berisi langkah-langkah melakukan sesuatu disebut teks…', ['Deskripsi','Prosedur','Narasi','Eksposisi'],1),
        esai('Sebutkan kata baku dari "photo".', ['foto']),
      ],
      sedang:[
        mc('Majas yang membandingkan dua hal secara langsung menggunakan kata "seperti" disebut…', ['Metafora','Simile','Personifikasi','Ironi'],1,15),
        mc('Unsur intrinsik cerita yang menunjukkan latar tempat dan waktu disebut…', ['Tema','Alur','Latar','Amanat'],2,15),
        esai('Sebutkan struktur teks eksposisi yang berisi kesimpulan.', ['penegasan ulang','penutup','simpulan'],15),
      ],
      susah:[
        mc('Kalimat yang berisi opini biasanya ditandai dengan kata…', ['Sebenarnya, terjadi','Menurut saya, sebaiknya','Data menunjukkan','Berdasarkan hasil'],1,20),
        mc('Konjungsi yang menyatakan pertentangan adalah…', ['Dan','Karena','Tetapi','Lalu'],2,20),
        esai('Sebutkan jenis teks yang bertujuan meyakinkan pembaca dengan argumen.', ['eksposisi','argumentasi'],20),
      ],
    },
    matematika: {
      mudah:[
        mc('Hasil dari 3² + 4² adalah…', ['25','24','20','12'],0),
        mc('Bentuk sederhana dari 12/18 adalah…', ['2/3','3/4','1/2','4/6'],0),
        esai('Nilai x pada persamaan 2x = 16 adalah…', ['8']),
      ],
      sedang:[
        mc('Keliling lingkaran dengan jari-jari 7 cm (π=22/7) adalah…', ['22 cm','44 cm','66 cm','88 cm'],1,15),
        mc('Hasil dari (-3) × 4 - 5 adalah…', ['-17','7','-7','17'],0,15),
        esai('Jika y = 2x + 3 dan x = 5, maka nilai y adalah…', ['13'],15),
      ],
      susah:[
        mc('Akar-akar dari persamaan x² - 5x + 6 = 0 adalah…', ['2 dan 3','1 dan 6','-2 dan -3','2 dan -3'],0,20),
        mc('Gradien garis yang melalui titik (2,3) dan (4,7) adalah…', ['1','2','3','4'],1,20),
        esai('Hitung nilai dari 3√27 (akar pangkat tiga dari 27).', ['3'],20),
      ],
    },
    ipa: {
      mudah:[
        mc('Satuan SI untuk gaya adalah…', ['Joule','Newton','Watt','Pascal'],1),
        mc('Organel sel yang berfungsi sebagai penghasil energi adalah…', ['Nukleus','Ribosom','Mitokondria','Vakuola'],2),
        esai('Sebutkan proses perubahan zat cair menjadi gas.', ['penguapan','evaporasi']),
      ],
      sedang:[
        mc('Hukum Newton I disebut juga hukum…', ['Aksi-reaksi','Kelembaman','Percepatan','Gravitasi'],1,15),
        mc('pH air murni pada suhu normal adalah…', ['5','6','7','8'],2,15),
        esai('Sebutkan nama proses tumbuhan menyerap CO2 dan melepas O2.', ['fotosintesis'],15),
      ],
      susah:[
        mc('Rumus kimia dari air adalah…', ['CO2','H2O','O2','NaCl'],1,20),
        mc('Perpindahan panas tanpa zat perantara disebut…', ['Konduksi','Konveksi','Radiasi','Isolasi'],2,20),
        esai('Sebuah benda bermassa 10 kg dipercepat 2 m/s². Berapa gaya (F=m.a) dalam Newton?', ['20'],20),
      ],
    },
    ips: {
      mudah:[
        mc('Kegiatan ekonomi yang menyalurkan barang dari produsen ke konsumen disebut…', ['Produksi','Distribusi','Konsumsi','Investasi'],1),
        mc('Negara ASEAN yang menjadi tempat kelahiran organisasi tersebut adalah…', ['Malaysia','Thailand','Indonesia','Filipina'],1),
        esai('Sebutkan lembaga yang mengatur peredaran uang di Indonesia.', ['bank indonesia','bi']),
      ],
      sedang:[
        mc('Interaksi sosial yang mengarah pada persatuan disebut proses…', ['Disosiatif','Asosiatif','Konfliktual','Kompetitif'],1,15),
        mc('Faktor pendorong perdagangan antarnegara adalah…', ['Kesamaan sumber daya','Perbedaan sumber daya','Persamaan mata uang','Kesamaan iklim'],1,15),
        esai('Sebutkan nama peristiwa proklamasi kemerdekaan Indonesia (tanggal & bulan).', ['17 agustus','17 agustus 1945'],15),
      ],
      susah:[
        mc('Latar belakang utama terjadinya globalisasi adalah…', ['Perang dunia','Kemajuan teknologi & komunikasi','Bencana alam','Migrasi paksa'],1,20),
        mc('Dampak negatif urbanisasi bagi kota adalah…', ['Berkurangnya pengangguran desa','Kepadatan penduduk & kemacetan','Meningkatnya lahan pertanian','Menurunnya polusi'],1,20),
        esai('Sebutkan nama badan PBB yang menangani anak-anak.', ['unicef'],20),
      ],
    },
    bing: {
      mudah:[
        mc('"They ___ students." Jawaban yang tepat…', ['is','am','are','be'],2),
        mc('Antonim dari "big" adalah…', ['Large','Huge','Small','Tall'],2),
        esai('Terjemahkan: "Dia (perempuan) sedang membaca buku." (gunakan "reading")', ['she is reading a book']),
      ],
      sedang:[
        mc('Kalimat pasif dari "She writes a letter" adalah…', ['A letter writes her','A letter is written by her','She is written a letter','A letter was write her'],1,15),
        mc('"If it rains, I ___ stay home." (conditional type 1)', ['will','would','was','did'],0,15),
        esai('Ubah ke bentuk lampau (past tense): "I eat rice."', ['i ate rice'],15),
      ],
      susah:[
        mc('Kata penghubung yang tepat: "She was tired, ___ she kept working."', ['so','but','and','because'],1,20),
        mc('Bentuk comparative dari "good" adalah…', ['gooder','best','better','more good'],2,20),
        esai('Susun menjadi kalimat benar: "always / school / to / walks / he"', ['he always walks to school'],20),
      ],
    },
  },
  sma: {
    bindo: {
      mudah:[
        mc('Teks yang menyajikan fakta berdasarkan hasil penelitian disebut teks…', ['Laporan hasil observasi','Anekdot','Negosiasi','Eksemplum'],0),
        mc('Kalimat efektif adalah kalimat yang…', ['Panjang dan berbelit','Jelas, logis, dan tidak ambigu','Menggunakan banyak istilah asing','Berulang-ulang'],1),
        esai('Sebutkan sinonim dari kata "esensial".', ['penting','pokok','mendasar']),
      ],
      sedang:[
        mc('Struktur teks negosiasi diawali dengan…', ['Penutup','Orientasi','Persetujuan','Pengajuan'],1,15),
        mc('Majas yang melebih-lebihkan sesuatu disebut…', ['Hiperbola','Litotes','Ironi','Metonimia'],0,15),
        esai('Sebutkan istilah untuk kalimat yang menyatakan hubungan sebab-akibat.', ['kausalitas','sebab akibat'],15),
      ],
      susah:[
        mc('Ciri kebahasaan teks editorial yang menonjol adalah…', ['Kalimat perintah','Argumentasi & opini penulis','Dialog antartokoh','Data statistik semata'],1,20),
        mc('Kalimat "Meski hujan deras, ia tetap berangkat kerja" merupakan kalimat…', ['Kompleks setara','Kompleks bertingkat','Tunggal','Majemuk campuran'],1,20),
        esai('Sebutkan nama gaya bahasa yang menggunakan pengulangan kata di awal baris/kalimat.', ['repetisi','anafora'],20),
      ],
    },
    matematika: {
      mudah:[
        mc('Nilai dari log 100 (basis 10) adalah…', ['1','2','10','100'],1),
        mc('Turunan dari f(x) = x² adalah…', ['x','2x','x²','2'],1),
        esai('Hasil dari 5! (5 faktorial) adalah…', ['120']),
      ],
      sedang:[
        mc('Nilai limit x→2 dari (x²-4)/(x-2) adalah…', ['0','2','4','tak terdefinisi'],2,15),
        mc('Determinan matriks [[2,3],[1,4]] adalah…', ['5','8','11','-5'],1,15),
        esai('Hitung nilai dari sin 30°.', ['0.5','1/2'],15),
      ],
      susah:[
        mc('Integral dari 2x dx adalah…', ['x² + C','2x² + C','x + C','2 + C'],0,20),
        mc('Jumlah 10 suku pertama deret aritmetika dengan a=2, b=3 adalah…', ['155','20','65','245'],0,20),
        esai('Nilai dari cos 60° adalah…', ['0.5','1/2'],20),
      ],
    },
    ipa: {
      mudah:[
        mc('Satuan energi dalam SI adalah…', ['Newton','Joule','Watt','Pascal'],1),
        mc('Organel sel yang berperan dalam fotosintesis adalah…', ['Mitokondria','Ribosom','Kloroplas','Lisosom'],2),
        esai('Sebutkan rumus kimia glukosa.', ['c6h12o6']),
      ],
      sedang:[
        mc('Hukum kekekalan energi menyatakan bahwa energi…', ['Dapat diciptakan','Dapat dimusnahkan','Tidak dapat diciptakan atau dimusnahkan','Selalu bertambah'],2,15),
        mc('Proses pembelahan sel yang menghasilkan sel anak identik disebut…', ['Meiosis','Mitosis','Fertilisasi','Fragmentasi'],1,15),
        esai('Sebutkan nama hukum yang menyatakan F = m . a.', ['hukum newton 2','hukum newton ii','newton 2'],15),
      ],
      susah:[
        mc('Reaksi eksoterm adalah reaksi yang…', ['Menyerap kalor','Melepas kalor','Tidak melibatkan kalor','Selalu berlangsung lambat'],1,20),
        mc('Prinsip Le Chatelier berkaitan dengan…', ['Kesetimbangan kimia','Kecepatan reaksi','Ikatan kovalen','Bilangan oksidasi'],0,20),
        esai('Sebutkan satuan besaran kuat arus listrik dalam SI.', ['ampere'],20),
      ],
    },
    ips: {
      mudah:[
        mc('Ilmu yang mempelajari perilaku manusia dalam memenuhi kebutuhan disebut…', ['Sosiologi','Ekonomi','Geografi','Antropologi'],1),
        mc('Lembaga yang mengawasi persaingan usaha di Indonesia adalah…', ['OJK','KPK','KPPU','BPK'],2),
        esai('Sebutkan nama teori yang menjelaskan kebutuhan manusia bertingkat (Abraham Maslow).', ['hierarki kebutuhan maslow','teori maslow']),
      ],
      sedang:[
        mc('Inflasi yang disebabkan oleh naiknya biaya produksi disebut…', ['Demand pull inflation','Cost push inflation','Bottleneck inflation','Spiralling inflation'],1,15),
        mc('Bentuk penyimpangan sosial yang dilakukan secara berkelompok disebut…', ['Penyimpangan primer','Penyimpangan sekunder','Penyimpangan individu','Penyimpangan kolektif'],3,15),
        esai('Sebutkan nama organisasi kerja sama ekonomi negara-negara Eropa.', ['uni eropa','european union','eu'],15),
      ],
      susah:[
        mc('Konsep dasar geografi yang mengkaji keterkaitan antarwilayah disebut…', ['Interaksi','Interelasi','Deskripsi','Korologi'],1,20),
        mc('Kebijakan moneter kontraktif ditandai dengan…', ['Menurunkan suku bunga','Menaikkan suku bunga','Menambah uang beredar','Membeli surat berharga'],1,20),
        esai('Sebutkan nama teori yang menjelaskan pembagian kerja internasional berdasarkan keunggulan komparatif.', ['keunggulan komparatif','david ricardo'],20),
      ],
    },
    bing: {
      mudah:[
        mc('"By the time I arrived, they ___ left." (past perfect)', ['have','had','has','having'],1),
        mc('Sinonim dari "essential" adalah…', ['Optional','Crucial','Minor','Rare'],1),
        esai('Terjemahkan: "Pendidikan sangat penting untuk masa depan."', ['education is very important for the future']),
      ],
      sedang:[
        mc('Kalimat pasif yang tepat dari "They built this house in 1990" adalah…', ['This house built in 1990','This house was built in 1990','This house is building 1990','This house has build 1990'],1,15),
        mc('"Despite ___ hard, he failed the exam." Jawaban tepat…', ['study','studying','studied','to study'],1,15),
        esai('Ubah menjadi reported speech: He said, "I am busy."', ['he said that he was busy','he said he was busy'],15),
      ],
      susah:[
        mc('"Had I known earlier, I ___ differently." (conditional type 3)', ['would act','would have acted','will act','acted'],1,20),
        mc('Kata yang tepat: "The report, ___ was submitted late, contained errors."', ['who','which','whom','whose'],1,20),
        esai('Susun kalimat: "been / for / has / studying / she / years / English / three"', ['she has been studying english for three years'],20),
      ],
    },
  },
};

/* ---------------------------------------------------------------------
   2) SISTEM RANK
--------------------------------------------------------------------- */
const TIERS = [
  {key:'bronze1', nm:'Bronze 1', grp:'bronze', min:0},
  {key:'bronze2', nm:'Bronze 2', grp:'bronze', min:100},
  {key:'bronze3', nm:'Bronze 3', grp:'bronze', min:200},
  {key:'bronze4', nm:'Bronze 4', grp:'bronze', min:320},
  {key:'silver1', nm:'Silver 1', grp:'silver', min:460},
  {key:'silver2', nm:'Silver 2', grp:'silver', min:620},
  {key:'silver3', nm:'Silver 3', grp:'silver', min:800},
  {key:'silver4', nm:'Silver 4', grp:'silver', min:1000},
  {key:'gold1', nm:'Gold 1', grp:'gold', min:1220},
  {key:'gold2', nm:'Gold 2', grp:'gold', min:1460},
  {key:'gold3', nm:'Gold 3', grp:'gold', min:1720},
  {key:'gold4', nm:'Gold 4', grp:'gold', min:2000},
  {key:'emerald1', nm:'Emerald 1', grp:'emerald', min:2320},
  {key:'emerald2', nm:'Emerald 2', grp:'emerald', min:2680},
  {key:'emerald3', nm:'Emerald 3', grp:'emerald', min:3080},
  {key:'jenius', nm:'Jenius', grp:'jenius', min:3600},
];
function getTierForPoints(pts){
  let cur = TIERS[0];
  for(const t of TIERS){ if(pts >= t.min) cur = t; else break; }
  return cur;
}
function getNextTier(tierKey){
  const i = TIERS.findIndex(t=>t.key===tierKey);
  return TIERS[i+1] || null;
}
function badgeSVG(grp, size=56){
  const grad = grp==='jenius'
    ? `<linearGradient id="jg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FF5DA2"/><stop offset="50%" stop-color="#7B6BFF"/><stop offset="100%" stop-color="#2FC4E0"/></linearGradient>`
    : '';
  const fill = grp==='jenius' ? `url(#jg${size})` : {bronze:'#A9673A', silver:'#8B95A6', gold:'#D6A426', emerald:'#14A16B'}[grp];
  return `<svg width="${size}" height="${size}" viewBox="0 0 56 56"><defs>${grad}</defs>
    <path d="M28 3 L50 14 V32 C50 42 40 50 28 53 C16 50 6 42 6 32 V14 Z" fill="${fill}" opacity="0.18"/>
    <path d="M28 8 L45 17 V32 C45 40 37 46.5 28 49 C19 46.5 11 40 11 32 V17 Z" fill="${fill}"/>
    <path d="M20 28l6 6 11-13" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/* ---------------------------------------------------------------------
   3) API CLIENT — komunikasi dengan backend Python (app.py)
--------------------------------------------------------------------- */
let CURRENT_USER = null; // disimpan di memori JS, bukan localStorage

async function apiCall(path, method='GET', body=null){
  try{
    const opt = {method, headers:{'Content-Type':'application/json'}};
    if(body) opt.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opt);
    document.getElementById('conn-warn') && (document.getElementById('conn-warn').style.display = 'none');
    const data = await res.json();
    if(!res.ok){ return {ok:false, error: data.error || 'Terjadi kesalahan'}; }
    return {ok:true, data};
  }catch(e){
    const warn = document.getElementById('conn-warn');
    if(warn) warn.style.display = 'block';
    return {ok:false, error:'Tidak bisa terhubung ke server'};
  }
}

/* ---------------------------------------------------------------------
   4) AUTH FLOW
--------------------------------------------------------------------- */
function switchAuthTab(which){
  document.getElementById('tab-login').classList.toggle('active', which==='login');
  document.getElementById('tab-register').classList.toggle('active', which==='register');
  document.getElementById('form-login').classList.toggle('active', which==='login');
  document.getElementById('form-register').classList.toggle('active', which==='register');
}

async function doRegister(e){
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim().toLowerCase().replace(/\s+/g,'_');
  const password = document.getElementById('reg-password').value;
  const jenjang = document.getElementById('reg-jenjang').value;
  const errBox = document.getElementById('reg-error');
  errBox.textContent = '';

  if(!name || !username || password.length < 4){
    errBox.textContent = 'Lengkapi semua data. Kata sandi minimal 4 karakter.';
    return false;
  }
  const res = await apiCall('/api/register', 'POST', {name, username, password, jenjang});
  if(!res.ok){ errBox.textContent = res.error; return false; }
  CURRENT_USER = res.data.user;
  showToast('Akun berhasil dibuat! Selamat belajar 🎉');
  enterApp();
  return false;
}

async function doLogin(e){
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim().toLowerCase().replace(/\s+/g,'_');
  const password = document.getElementById('login-password').value;
  const errBox = document.getElementById('login-error');
  errBox.textContent = '';

  const res = await apiCall('/api/login', 'POST', {username, password});
  if(!res.ok){ errBox.textContent = res.error; return false; }
  CURRENT_USER = res.data.user;
  showToast('Selamat datang kembali, '+CURRENT_USER.name.split(' ')[0]+'!');
  enterApp();
  return false;
}

function doLogout(){
  CURRENT_USER = null;
  document.getElementById('bottomnav').style.display = 'none';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  goScreen('auth');
}

/* ---------------------------------------------------------------------
   5) NAVIGASI LAYAR
--------------------------------------------------------------------- */
let STATE = { jenjang:null, subject:null, mode:null, playtype:'klasik' };

function goScreen(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.nav===name));
  window.scrollTo(0,0);
  if(name==='home') renderHome();
  if(name==='leaderboard') renderLeaderboard();
  if(name==='profile') renderProfile();
}

function enterApp(){
  document.getElementById('bottomnav').style.display = 'flex';
  STATE.jenjang = CURRENT_USER.jenjang;
  goScreen('home');
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ---------------------------------------------------------------------
   6) HOME: pilih jenjang & mapel, banner rank
--------------------------------------------------------------------- */
function renderHome(){
  if(!CURRENT_USER) return;
  document.getElementById('home-av').textContent = CURRENT_USER.name.charAt(0).toUpperCase();
  document.getElementById('home-points').textContent = CURRENT_USER.points+' pt';

  document.querySelectorAll('.jenjang-card').forEach(c=>c.classList.toggle('active', c.dataset.j===STATE.jenjang));

  const grid = document.getElementById('subject-grid');
  grid.innerHTML = '';
  Object.keys(SUBJECT_META).forEach(key=>{
    const m = SUBJECT_META[key];
    const count = (QUESTIONS[STATE.jenjang]?.[key]?.mudah?.length||0)+(QUESTIONS[STATE.jenjang]?.[key]?.sedang?.length||0)+(QUESTIONS[STATE.jenjang]?.[key]?.susah?.length||0);
    const el = document.createElement('button');
    el.className = 'subject-card';
    el.style.background = m.grad;
    el.onclick = ()=>openSubject(key);
    el.innerHTML = `<div class="ic">${m.ic}</div><div class="nm">${m.nm}</div><div class="cnt">${count} soal tersedia</div>`;
    grid.appendChild(el);
  });

  renderRankWidget('home');
}

function setJenjang(j){
  STATE.jenjang = j;
  renderHome();
}

function openSubject(subjectKey){
  STATE.subject = subjectKey;
  const m = SUBJECT_META[subjectKey];
  document.getElementById('mode-subject-title').textContent = m.nm;
  document.getElementById('mode-subject-sub').textContent = JENJANG_META[STATE.jenjang]+' — pilih tingkat kesulitan';
  STATE.mode = null; STATE.playtype = 'klasik';
  document.getElementById('pt-klasik').style.outline = '2px solid var(--primary)';
  document.getElementById('pt-rank').style.outline = 'none';
  goScreen('mode');
}

function setMode(m){
  STATE.mode = m;
  showToast('Mode '+({mudah:'Mudah',sedang:'Sedang',susah:'Susah'}[m])+' dipilih');
}
function setPlaytype(pt){
  STATE.playtype = pt;
  document.getElementById('pt-klasik').style.outline = pt==='klasik' ? '2px solid var(--primary)' : 'none';
  document.getElementById('pt-rank').style.outline = pt==='rank' ? '2px solid #FF9F5A' : 'none';
}

/* ---------------------------------------------------------------------
   7) RANK WIDGET (dipakai di home & profile)
--------------------------------------------------------------------- */
function renderRankWidget(where){
  if(!CURRENT_USER) return;
  const pts = CURRENT_USER.points;
  const tier = getTierForPoints(pts);
  const next = getNextTier(tier.key);
  const suffix = where==='home' ? 'home' : 'profile';

  document.getElementById('rank-icon-'+suffix).innerHTML = badgeSVG(tier.grp, 56);
  document.getElementById('rank-tier-'+suffix).textContent = tier.nm;

  if(next){
    const span = next.min - tier.min;
    const progressed = pts - tier.min;
    const pct = Math.max(4, Math.min(100, Math.round((progressed/span)*100)));
    document.getElementById('rank-bar-'+suffix).style.width = pct+'%';
    document.getElementById('rank-pts-'+suffix).textContent = (next.min-pts)+' poin menuju '+next.nm;
  }else{
    document.getElementById('rank-bar-'+suffix).style.width = '100%';
    document.getElementById('rank-pts-'+suffix).textContent = 'Tingkat tertinggi tercapai! 🌟';
  }
}

function renderProfile(){
  if(!CURRENT_USER) return;
  document.getElementById('profile-av').textContent = CURRENT_USER.name.charAt(0).toUpperCase();
  document.getElementById('profile-name').textContent = CURRENT_USER.name;
  document.getElementById('profile-jenjang').textContent = JENJANG_META[CURRENT_USER.jenjang];
  document.getElementById('profile-points').textContent = CURRENT_USER.points+' poin';
  renderRankWidget('profile');

  const grid = document.getElementById('tier-grid');
  grid.innerHTML = '';
  const curTier = getTierForPoints(CURRENT_USER.points);
  TIERS.forEach(t=>{
    const row = document.createElement('div');
    row.className = 'tier-row'+(t.key===curTier.key?' current':'');
    const next = getNextTier(t.key);
    const range = next ? (t.min+' – '+(next.min-1)+' pt') : (t.min+'+ pt');
    row.innerHTML = `<div class="tier-ic">${badgeSVG(t.grp,38)}</div><div><div class="tier-nm">${t.nm}</div><div class="tier-rg">${range}</div></div>`;
    grid.appendChild(row);
  });
}

/* ---------------------------------------------------------------------
   8) KUIS
--------------------------------------------------------------------- */
let QUIZ = { list:[], idx:0, correct:0, wrong:0, points:0, startTime:0, timer:null, timeLeft:0, answered:false };

function startQuiz(){
  if(!STATE.mode){ showToast('Pilih tingkat kesulitan dulu ya'); return; }
  const pool = QUESTIONS[STATE.jenjang]?.[STATE.subject]?.[STATE.mode] || [];
  if(pool.length === 0){ showToast('Soal untuk kombinasi ini belum tersedia'); return; }
  QUIZ = { list: shuffleArr(pool.slice()), idx:0, correct:0, wrong:0, points:0, startTime:Date.now(), timer:null, timeLeft:0, answered:false };
  goScreen('quiz');
  renderQuestion();
}

function shuffleArr(arr){
  for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}

function renderQuestion(){
  clearInterval(QUIZ.timer);
  QUIZ.answered = false;
  const q = QUIZ.list[QUIZ.idx];
  document.getElementById('q-tag').textContent = 'Soal '+(QUIZ.idx+1)+'/'+QUIZ.list.length;
  document.getElementById('q-tag').style.background = SUBJECT_META[STATE.subject].color;
  document.getElementById('q-tag').style.color = '#fff';
  document.getElementById('q-text').textContent = q.q;
  document.getElementById('quiz-progress').style.width = Math.round((QUIZ.idx/QUIZ.list.length)*100)+'%';

  const optList = document.getElementById('opt-list');
  const essayBox = document.getElementById('essay-box');
  optList.innerHTML = '';
  if(q.t === 'mc'){
    essayBox.style.display = 'none';
    optList.style.display = 'flex';
    const letters = ['A','B','C','D'];
    q.o.forEach((opt,i)=>{
      const div = document.createElement('div');
      div.className = 'opt';
      div.innerHTML = `<div class="let">${letters[i]}</div><div>${opt}</div>`;
      div.onclick = ()=>selectOption(i, div);
      optList.appendChild(div);
    });
  }else{
    optList.style.display = 'none';
    essayBox.style.display = 'block';
    document.getElementById('essay-input').value = '';
  }

  document.getElementById('btn-next').textContent = 'Jawab';
  document.getElementById('btn-next').onclick = submitAnswer;
  document.getElementById('btn-skip').style.display = 'block';

  QUIZ.timeLeft = MODE_TIME_PER_SOAL[STATE.mode];
  updateTimerText();
  QUIZ.timer = setInterval(()=>{
    QUIZ.timeLeft--;
    updateTimerText();
    if(QUIZ.timeLeft <= 0){ clearInterval(QUIZ.timer); if(!QUIZ.answered) forceTimeUp(); }
  }, 1000);
}

function updateTimerText(){
  const chip = document.getElementById('timer-chip');
  const mm = String(Math.floor(Math.max(0,QUIZ.timeLeft)/60)).padStart(2,'0');
  const ss = String(Math.max(0,QUIZ.timeLeft)%60).padStart(2,'0');
  document.getElementById('timer-text').textContent = mm+':'+ss;
  chip.classList.toggle('warn', QUIZ.timeLeft <= 10);
}

let SELECTED_OPTION = null;
function selectOption(i, el){
  if(QUIZ.answered) return;
  document.querySelectorAll('.opt').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
  SELECTED_OPTION = i;
}

function forceTimeUp(){
  showToast('Waktu habis!');
  revealAnswer(false, null);
  setTimeout(()=>nextQuestion(false), 1100);
}

function submitAnswer(){
  if(QUIZ.answered) return;
  const q = QUIZ.list[QUIZ.idx];
  let isCorrect = false;
  if(q.t === 'mc'){
    if(SELECTED_OPTION === null){ showToast('Pilih salah satu jawaban dulu'); return; }
    isCorrect = SELECTED_OPTION === q.a;
  }else{
    const val = document.getElementById('essay-input').value.trim().toLowerCase().replace(/\s+/g,' ');
    if(!val){ showToast('Isi jawaban dulu ya'); return; }
    isCorrect = q.a.some(acc => acc.toLowerCase().trim() === val);
  }
  revealAnswer(isCorrect, q.t==='mc' ? SELECTED_OPTION : null);
  if(isCorrect){
    QUIZ.correct++;
    QUIZ.points += Math.round(q.p * MODE_POIN_MULTIPLIER[STATE.mode]);
  }else{
    QUIZ.wrong++;
  }
  setTimeout(()=>nextQuestion(false), 1000);
}

function revealAnswer(isCorrect, selectedIdx){
  QUIZ.answered = true;
  clearInterval(QUIZ.timer);
  document.getElementById('btn-skip').style.display = 'none';
  const q = QUIZ.list[QUIZ.idx];
  if(q.t === 'mc'){
    const opts = document.querySelectorAll('.opt');
    opts.forEach((o,i)=>{
      if(i === q.a) o.classList.add('correct');
      else if(i === selectedIdx) o.classList.add('wrong');
    });
  }
}

function nextQuestion(skipped){
  clearInterval(QUIZ.timer);
  SELECTED_OPTION = null;
  if(skipped){ QUIZ.wrong++; }
  QUIZ.idx++;
  if(QUIZ.idx >= QUIZ.list.length){ finishQuiz(); }
  else{ renderQuestion(); }
}

function confirmExitQuiz(){
  clearInterval(QUIZ.timer);
  goScreen('mode');
}

async function finishQuiz(){
  clearInterval(QUIZ.timer);
  const total = QUIZ.list.length;
  const pct = Math.round((QUIZ.correct/total)*100);
  const elapsed = Math.round((Date.now()-QUIZ.startTime)/1000);

  document.getElementById('result-pct').textContent = pct+'%';
  document.getElementById('result-correct').textContent = QUIZ.correct;
  document.getElementById('result-wrong').textContent = QUIZ.wrong;
  document.getElementById('result-time').textContent = Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0');
  document.getElementById('result-points').textContent = QUIZ.points;

  const circumference = 402;
  const offset = circumference - (pct/100)*circumference;
  const circle = document.getElementById('result-circle');
  circle.style.transition = 'none';
  circle.setAttribute('stroke-dashoffset', circumference);
  setTimeout(()=>{ circle.style.transition = 'stroke-dashoffset 1s ease'; circle.setAttribute('stroke-dashoffset', offset); }, 80);

  const rankupEl = document.getElementById('result-rankup');
  rankupEl.style.display = 'none';

  if(STATE.playtype === 'rank' && CURRENT_USER){
    const beforeTier = getTierForPoints(CURRENT_USER.points);
    const res = await apiCall('/api/update_points', 'POST', {username: CURRENT_USER.username, add_points: QUIZ.points});
    if(res.ok){
      CURRENT_USER.points = res.data.user.points;
      const afterTier = getTierForPoints(CURRENT_USER.points);
      if(afterTier.key !== beforeTier.key){
        rankupEl.style.display = 'block';
        rankupEl.textContent = '🎉 Naik tingkat! Sekarang: '+afterTier.nm;
      }
    }
  }

  goScreen('result');
}

/* ---------------------------------------------------------------------
   9) LEADERBOARD
--------------------------------------------------------------------- */
let LB_JENJANG = 'sd';
function setLbJenjang(j){
  LB_JENJANG = j;
  document.querySelectorAll('.lb-tab').forEach(t=>t.classList.toggle('active', t.dataset.lj===j));
  renderLeaderboard();
}
async function renderLeaderboard(){
  if(CURRENT_USER) LB_JENJANG = LB_JENJANG || CURRENT_USER.jenjang;
  document.querySelectorAll('.lb-tab').forEach(t=>t.classList.toggle('active', t.dataset.lj===LB_JENJANG));

  const listEl = document.getElementById('lb-list');
  listEl.innerHTML = '<div class="empty-hint">Memuat papan peringkat…</div>';

  const res = await apiCall('/api/leaderboard/'+LB_JENJANG, 'GET');
  if(!res.ok){ listEl.innerHTML = '<div class="empty-hint">Tidak bisa memuat papan peringkat.</div>'; return; }
  const users = res.data.users || [];

  if(users.length === 0){
    listEl.innerHTML = '<div class="empty-hint">Belum ada pemain di jenjang ini.<br>Jadilah yang pertama! 🚀</div>';
    return;
  }
  listEl.innerHTML = '';
  users.slice(0,50).forEach((u,i)=>{
    const row = document.createElement('div');
    const isMe = CURRENT_USER && u.username === CURRENT_USER.username;
    row.className = 'lb-row'+(i===0?' top1':i===1?' top2':i===2?' top3':'')+(isMe?' me':'');
    const tier = getTierForPoints(u.points);
    row.innerHTML = `<div class="lb-rank">${i+1}</div><div class="lb-av">${u.name.charAt(0).toUpperCase()}</div>
      <div class="lb-name">${u.name}${isMe?' (Kamu)':''}<small>${tier.nm}</small></div>
      <div class="lb-pts mono">${u.points} pt</div>`;
    listEl.appendChild(row);
  });
}

/* ---------------------------------------------------------------------
   10) INIT
--------------------------------------------------------------------- */
window.addEventListener('DOMContentLoaded', ()=>{
  goScreen('auth');
});

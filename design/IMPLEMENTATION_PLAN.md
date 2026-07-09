# Arduino Typing Tutor — UI Redesign Uygulama Planı

> Kaynak: `design/arduino-typing-tutor-redesign/project/*.dc.html` (Claude Design handoff)
> Konsept: **"Küçük bir hacker'ın kokpiti"** — kod editörü ciddiyeti + Duolingo enerjisi.
> Durum: TAMAMLANDI — tüm fazlar uygulandı (9 Temmuz 2026).

---

## Tasarım Sistemi Özeti (DesignSystem.dc.html)

### Renk token'ları

| Token | Koyu (varsayılan) | Aydınlık (`:root.light`) |
|---|---|---|
| `--bg-base` | `#0B1220` | `#F7FAFD` |
| `--bg-surface` | `#111A2C` | `#FFFFFF` |
| `--bg-elevated` | `#18233A` | `#F0F4FA` |
| `--bg-border` | `#24324D` | `#D6DEEA` |
| `--bg-muted` | `#0D1526` | `#EEF2F8` |
| `--text-primary` | `#F1F5FB` | `#16213A` |
| `--text-secondary` | `#A9B7D0` | `#5A6786` |
| `--text-muted` | `#6B7A99` | `#8592AD` |
| `--accent-cyan` | `#22D3EE` | `#0891B2` |
| `--accent-lime` | `#A3E635` | `#65A30D` |

Ek accent'ler (tasarımda kullanılıyor, token'a bağlanacak): amber `#FBBF24`, mor `#A78BFA`, turuncu `#FB923C`, kırmızı/hata `#FB7185`, doğru-yazım yeşili `#4ADE80` (aydınlıkta `#16A34A`), bekleyen metin `#56668A` (aydınlıkta `#9AA7C2`).

### Tipografi
- UI: **Nunito** (400/600/700/800/900) — Inter'in yerini alır
- Kod/monospace: **JetBrains Mono** (400/500/700) — kalır

### Parmak renkleri (revize — klavye ↔ el rehberi ortak)

| Parmak | Eski (`FINGER_COLORS`) | Yeni |
|---|---|---|
| leftPinky | `#9333EA` | `#A78BFA`* |
| leftRing | `#3B82F6` | `#60A5FA`* |
| leftMiddle | `#10B981` | `#34D399`* |
| leftIndex | `#EF4444` | `#F87171`* |
| leftThumb / rightThumb | `#6B7280` | `#94A3B8` |
| rightIndex | `#EC4899` | `#F472B6` |
| rightMiddle | `#06B6D4` | `#22D3EE` |
| rightRing | `#EAB308` | `#FACC15` |
| rightPinky | `#F97316` | `#FB923C` |

\* LessonView.dc.html'deki `F` sabitinden (DesignSystem.dc.html'deki ilk taslak paletten hafif farklı — LessonView prototipi esas alınacak çünkü klavye üzerinde test edilmiş hali o).
Not: `FINGER_COLORS` (types/index.ts) tek doğruluk kaynağı olacak; `Keyboard.tsx`'teki ayrı `FINGER_BG` Tailwind sınıf haritası kaldırılıp inline `FINGER_COLORS` kullanımına geçilecek → çift kaynak sorunu çözülür.

### Seviye kimlikleri (MainMenu header gradienti seviyeyle değişir)

| Seviye | Ad | Accent | Header gradienti |
|---|---|---|---|
| 1 | Çırak | `#A3E635` | `linear-gradient(120deg,#1A2E12,#101A0C)` |
| 2 | Usta Adayı | `#22D3EE` | `linear-gradient(120deg,#0E2E3E,#0C1F33)` |
| 3 | Kod Ustası | `#A78BFA` | `linear-gradient(120deg,#241640,#160E28)` |
| 4 | Arduino Uzmanı | `#FB923C` | `linear-gradient(120deg,#3A2008,#241407)` |
| 5 | Sertifikalı | `#FBBF24` | `linear-gradient(120deg,#3A2A08,#241C07)` |

Seviye hesabı UI-türetilmiş olacak (tamamlanan modül sayısından) — store'a yeni alan eklenmez.

### Emoji → Lucide ikon eşleştirme

| Emoji | Lucide | Kullanım |
|---|---|---|
| 🔥 | `Flame` | Seri (streak) |
| ⚡ | `Zap` | WPM / hız |
| 🏅 | `Award` | Rozet |
| 🔒 | `Lock` | Kilitli modül |
| 🔓 | `LockOpen` | Kilidi açılmış |
| ✅ | `CheckCircle2` / `Check` | Tamamlandı |
| 📬 | `Mail` | Öğretmen notu |
| ⚙️ | `Settings` | Ayarlar |
| 👨‍👩‍👧 / 👪 | `Users` | Ebeveyn paneli |
| 🎓 / 👨‍🏫 | `GraduationCap` | Öğretmen paneli |
| 📄 / 📝 | `FileCheck` | Sınav / not |
| 🏆 | `Trophy` | Final sınavı / sertifika |
| ⌨️ | `Keyboard` | Uygulama logosu |
| 📊 | `BarChart3` | İstatistikler |
| ⏰ / ⏱️ | `Clock` | Süre |
| ❌ | `XCircle` | Hata |
| 🎯 | `Target` | Doğruluk / İlk Ders rozeti |
| 🎖️ | `Medal` | Mükemmeliyetçi rozeti |
| 🗑️ | `Trash2` | Silme |
| 🖨️ | `Printer` | Yazdır |
| ⬇ (indir) | `Download` | Güncelleme / sertifika indir |
| 🔊 | `Volume2` | Ses ayarı |
| 🌙 / ☀️ | `Moon` / `Sun` | Tema |
| ▶ | `Play` | Aktif ders |
| ← / → | `ArrowLeft` / `ArrowRight` | Navigasyon |
| ➕ | `Plus` | Yeni profil / sınıf |
| 📋 | `Copy` | Sınıf kodu kopyala |
| 🚀 (rozet: İlk Ders) | `Rocket` | Rozet ikonu |
| İstisna | — | Avatar seçici: tasarımdaki özel SVG avatarlar (LED, çip, motor, buzzer, pil, sensör robotları) kullanılır, emoji değil |

---

## Ekran Bazlı Plan

### FAZ 1 — Token Altyapısı
| | |
|---|---|
| Mevcut | `App.css`: Inter fontu, gri-siyah (`#0A0A0A`) palet, `gray-###` → CSS değişkeni yönlendiren `!important` hack katmanı (satır 48-85) |
| Hedef | Lacivert "kokpit" paleti, Nunito, tam token seti (renk + radius + glow gölgeleri), Tailwind semantik renk bağları (`bg-surface`, `text-secondary`…) |
| Dosyalar | `src/App.css` (yeniden yazım), `tailwind.config.js` (token extend), `package.json` (lucide-react) |
| Riskler | Hack katmanı kaldırılınca `gray-###` kullanan tüm bileşenler eski Tailwind gri'lerine döner → geçiş süresince hack katmanı YENİ token değerlerine yönlendirilmiş halde tutulur, Faz 3-4'te bileşenler güncellendikçe adım adım silinir (Faz 5'te tamamen). |

### FAZ 2 — `src/components/ui/` kütüphanesi
Button (primary=cyan gradient / secondary / ghost / destructive / gold), Card, Chip, ProgressBar (cyan glow), Modal (backdrop-blur + popIn), Toast, Kbd, Tabs, Toggle, SegmentedControl. Referans: DesignSystem.dc.html §5 + Modals.dc.html. Ekranlara entegrasyon yok.

### FAZ 3a — MainMenu (387 satır)
| | |
|---|---|
| Mevcut | Düz kart listesi halinde modüller, emoji ikonlar, indigo/mor accent |
| Hedef | Seviye kimlikli gradient header + rozet çubuğu + açılır istatistik paneli (WPM trend SVG + hata tuşları çubuğu) + **zigzag "öğrenme haritası"** (SVG yol, daire düğümler, aktif modülde glowPulse) + final sınavı altın kartı + genel ilerleme + öğretmen notu banner'ı |
| Dosyalar | `MainMenu.tsx` (büyük yeniden yazım), muhtemelen `MainMenu` içinde kalan alt bileşenler |
| Riskler | En büyük yapısal değişiklik. Zigzag harita mutlak konumlu — modül sayısı `modules.json`'dan dinamik türetilmeli (tasarımda 8 modül sabit kodlu). Mevcut kilit/ilerleme mantığı (progressStore) aynen korunur. |

### FAZ 3b — LessonView (+ TypingArea, StatsPanel, Keyboard, HandGuide)
| | |
|---|---|
| Mevcut | Dikey yığın; klavye Tailwind `bg-*-500` parmak renkleri; el rehberi dikdörtgen SVG parmaklar |
| Hedef | Tek ekran (1280×800, scroll yok, `flex` + `min-height:0`): satır numaralı kod-editörü yazma alanı (aktif satır cyan sol bordür), yatay canlı istatistik şeridi (tabular-nums), token renkli klavye (basılı: scale 1.16 + beyaz ring; hata ısısı: kırmızı inset; shift: sarı pulse; aktif tuş altında zıplayan nokta), yeni yumuşak SVG el rehberi (yuvarlak parmak uçları, aktif parmakta wiggle + tırnak vurgusu, shift'te SHIFT etiketi), ortada aktif karakter rozeti |
| Dosyalar | `LessonView.tsx`, `TypingArea.tsx`, `StatsPanel.tsx`, `Keyboard.tsx`, `HandGuide.tsx` |
| Riskler | En yüksek işlevsel risk. Korunacak durum makineleri: karakter renk durumları (doğru/yanlış/aktif/bekleyen + `·` boşluk), `useAnimatedValue` WPM animasyonu, `getErrorIntensity` ısı haritası, shift-karşı-el mantığı, AltGr ipucu, `errorKeyMap`. Ders 74 (uzun Arduino kodu) ile taşma testi şart. Çok satırlı içerikte satır bölme yeni davranış — mevcut tek-blok akışı korunarak satır numarası görselleştirmesi eklenecek. |

### FAZ 3c — ResultScreen (+ Kbd kısayolları)
| | |
|---|---|
| Mevcut | Basit kart, emoji, R/N/M/G kısayolları görünmez değil ama düz metin |
| Hedef | popIn kademeli stat kartları (geçilen hedef sınırları lime bordürlü), konfeti (mevcut useConfetti korunur), XP/seri şeridi, Kbd bileşenli buton kısayolları (R/⏎/M/G), kaldığında turuncu "Neredeyse!" durumu |
| Dosyalar | `ResultScreen.tsx` |
| Riskler | Düşük. Kısayol tuş dinleyicileri aynen kalır. |

### FAZ 3d — ProfileSelect
| | |
|---|---|
| Mevcut | Emoji avatarlı kartlar |
| Hedef | "Kim kodluyor?" + Volti maskotu (blink animasyonlu robot SVG) + hover'da renkli glow kartlar + SVG robot avatar seti (6 çeşit) + yeni profil modalı (avatar+renk seçici) + kırmızı silme onayı |
| Dosyalar | `ProfileSelect.tsx`; `Profile.emoji` alanı korunur (geriye dönük uyum) — yeni avatar id'si aynı alanda saklanabilir |
| Riskler | Mevcut profillerde emoji kayıtlı; emoji→avatar eşleme/fallback gerekir. Store şeması değişmez. |

### FAZ 3e — Certificate
| | |
|---|---|
| Mevcut | Altın gradient çerçeve (yakın zamanda yenilendi) |
| Hedef | Daha "resmi belge" hali: çift ince altın bordür, köşe süsleri, italik isim, 3 stat + rozet madalyon dizisi, imza çizgisi, sertifika no; Yazdır + İndir butonları |
| Dosyalar | `Certificate.tsx` |
| Riskler | Düşük. `window.print()` ve cert ID mantığı korunur. |

### FAZ 4 — İkincil ekranlar (sırayla)
| Ekran | Hedef özeti |
|---|---|
| ParentPanel | Sakin yetişkin tonu: profil satırları (avatar + WPM), sınıfa katıl kartı, haftalık özet 4'lü grid + gün bazlı bar SVG, ipucu kutusu. Mevcut Recharts özetleri korunur/uyarlanır. |
| TeacherPanel | Sekmeler (Sınıflar / Sıralama), sınıf kartları (kesikli bordürlü kod kutusu + kopyala), motive edici leaderboard (ilk 3 renkli sıra, "herkes kendi hızında" notu) |
| SettingsModal | Toggle (ses), SegmentedControl (tema koyu/aydınlık), 3'lü zorluk seçici (yeşil/cyan/turuncu) + açıklama satırı |
| TeacherNotesModal | Sol accent bordürlü not kartları, okunmamış nokta göstergesi (createPortal korunur) |
| BadgeNotification | Altın çerçeveli tam ekran modal, floaty ikon, konfeti |
| UpdateChecker | Köşe toast: indirme ikonu + İndir/Sonra |
| AuthScreen | Token tabanlı form; şifremi unuttum/set-password akışı aynen |
| Spinner | Token rengi |

### FAZ 5 — Temizlik ve QA
- `gray-###` hack katmanı ve kalan referansların tamamen silinmesi, kullanılmayan keyframe/sınıf temizliği
- İki temada tüm ekran turu; kontrast (WCAG AA) ve tıklama alanı (çocuk kullanıcı ≥ 40px) kontrolü
- Animasyon tutarlılığı; `npm run build` + `npm run tauri build`
- Bu dosyanın "tamamlandı" işaretleriyle güncellenmesi

---

## Değişmeyecekler (tüm fazlarda)
- `src/store/*`, `src/hooks/*`, `src/utils/*`, `src/data/*`, `src/lib/supabase.ts` — dokunulmaz
- Bileşen props arayüzleri ve store çağrıları
- Türkçe Q düzeni + shift/AltGr köşe karakterleri (`keyboard-layout.json`)
- Tüm UI metinleri Türkçe
- Yeni bağımlılık: yalnızca `lucide-react`

## Commit planı
Her faz tek commit: `redesign(faz-N): <özet>` (Faz 3 ekran başına: `redesign(faz-3a): ...` vb.)

## Durum takibi
- [x] FAZ 0 — Keşif ve plan
- [x] FAZ 1 — Token altyapısı (commit 4416d79)
- [x] FAZ 2 — ui/ kütüphanesi (commit 14985c2)
- [x] FAZ 3a — MainMenu (commit 6f8539a)
- [x] FAZ 3b — LessonView (commit 5af8362)
- [x] FAZ 3c — ResultScreen (commit 7a6d247)
- [x] FAZ 3d — ProfileSelect (commit d54bf71)
- [x] FAZ 3e — Certificate (commit 605ebf6)
- [x] FAZ 4 — İkincil ekranlar (commit 4b457a2)
- [x] FAZ 5 — Temizlik ve QA
  - gray-### uyumluluk katmanı ve kullanılmayan keyframe'ler silindi
  - StatsChart token renklerine geçirildi (cyan/lime/amber/red)
  - İki temada tüm ekranlar doğrulandı (koyu + aydınlık)
  - Not: StatsChart hâlâ Recharts; tasarımdaki özel SVG mini-grafiklere
    geçiş isteğe bağlı gelecek iş olarak bırakıldı

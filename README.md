# ⌨️ Arduino Typing Tutor

10 parmak yazı tekniği öğrenirken Arduino programlamayı öğreten masaüstü uygulama.

## Hakkında

Arduino Typing Tutor, çocukların ve yeni başlayanların 10 parmak klavye tekniğini Arduino kod örnekleriyle pratik yaparak öğrenmesini sağlayan eğitici bir uygulamadır. Kullanıcı her tuşa bastığında hangi parmağını kullanması gerektiğini görsel olarak öğrenir; aynı zamanda gerçek Arduino sözdizimini yazarak programlamaya alışır.

## Özellikler

- **47 ders** — 5 modül + Final Sınavı
  - Modül 1: Ev Sırası Tuşları (A, S, D, F, J, K, L, Ş)
  - Modül 2: Üst Sıra (Q, W, E, R, T, Y, U, I, O, P)
  - Modül 3: Alt Sıra (Z, X, C, V, B, N, M)
  - Modül 4: Sayılar ve Semboller
  - Modül 5: Gerçek Arduino Kod Blokları
  - Final Sınavı: Sertifika için %95 doğruluk, 20 WPM
- **Görsel klavye** — Aktif tuş ve doğru parmak renk kodlu vurgulanır
- **El rehberi** — Hangi elin hangi parmağını kullanacağını animasyonlu gösterir
- **Shift tuşu desteği** — Büyük harf ve semboller için SHIFT animasyonu
- **Rozet sistemi** — 7 farklı başarım rozeti
- **Seri takibi** — Üst üste tamamlanan ders serisi
- **İstatistik grafikleri** — WPM ve doğruluk trend grafiği, en çok hata yapılan tuşlar
- **Ses efektleri** — Web Audio API ile dosyasız ses geri bildirimi
- **Koyu / Aydınlık tema** — Seviyeye göre renk uyumlu arayüz
- **Zorluk ayarı** — Kolay / Normal / Zor
- **Sertifika ekranı** — Final sınavını geçince kişiselleştirilmiş sertifika

## Kurulum

### Hazır Uygulama (macOS)

[Releases](https://github.com/mehmetakarim/Arduino-Typing-Tutor/releases) sayfasından `.dmg` dosyasını indirip kurabilirsiniz.

### Geliştirici Kurulumu

**Gereksinimler:**
- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs)
- [Tauri CLI](https://tauri.app/start/prerequisites/)

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme modunda çalıştır
npm run tauri dev

# Production build al
npm run tauri build
```

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Masaüstü | [Tauri v2](https://tauri.app) (Rust) |
| Arayüz | [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Stil | [Tailwind CSS v4](https://tailwindcss.com) |
| Build | [Vite](https://vite.dev) |
| State | [Zustand](https://zustand-demo.pmnd.rs) |
| Grafikler | [Recharts](https://recharts.org) |

## Lisans

MIT © [Mehmet Akar](https://github.com/mehmetakarim)

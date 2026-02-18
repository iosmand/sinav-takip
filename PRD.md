# Sınav Takip - Product Requirements Document (PRD) v3.1

## Genel Bakış

Sınav Takip, deneme sınavlarında doğru, yanlış ve boş yapılan soruları tek tek sayarak net puanı hesaplayan, geçmişi takip eden ve çalışma verilerini takvim üzerinde görselleştiren bir Progressive Web App (PWA) uygulamasıdır.

## Teknik Stack

- **Framework:** Astro.js (SSG)
- **UI Library:** Svelte 5
- **Styling:** CSS Custom Properties (Glassmorphism tema)
- **Font:** Inter (Google Fonts)
- **Veri Saklama:** LocalStorage
- **PWA:** Service Worker + manifest.json

## Veri Modeli

```typescript
interface ExamConfig {
  id: string;
  name: string;
  correctMultiplier: number;  // +1
  wrongMultiplier: number;    // -0.25
  blankMultiplier: number;    // 0
  totalQuestions?: number;
  isDefault?: boolean;
}

interface ExamResult {
  id: string;
  configId: string;
  configName: string;
  examName: string;         // "TYT Deneme 1"
  subject: string;          // "Matematik"
  correct: number;
  wrong: number;
  blank: number;
  netScore: number;
  date: string;             // ISO string
}

interface AppData {
  configs: ExamConfig[];
  results: ExamResult[];
  version: string;
}
```

## Varsayılan Dersler

Matematik, Geometri, Fizik, Kimya, Biyoloji, Türkçe, Edebiyat, Tarih, Coğrafya, Felsefe, Din Kültürü, İngilizce, Diğer

## Varsayılan Sınav Konfigürasyonları

| Sınav | Doğru | Yanlış | Boş |
|-------|-------|--------|-----|
| YKS (TYT/AYT) | +1 | -0.25 | 0 |
| KPSS | +1 | -0.25 | 0 |
| ALES | +1 | -0.25 | 0 |
| DGS | +1 | -0.25 | 0 |

## Sayfa Yapısı (SPA - 3 View)

### 1. Sayaç (Ana Sayfa)

Varsayılan olarak sayaç girişi gizlidir. "Yeni Sınav Ekle" butonu ile giriş formu açılır.

**Yeni Sınav Ekle butonu:**
- Glassmorphism kart tarzında, tam genişlik
- Tıklandığında giriş formunu açar, + ikonu ve metin içerir

**Giriş formu (toggle ile açılır/kapanır):**
- Başlık: "Yeni Sınav Girişi" + kapatma butonu
- Sınav türü seçici (dropdown - konfigürasyon)
- Sınav adı (text input, örn: "TYT Deneme 1")
- Ders seçici (dropdown, örn: "Matematik")
- 3 sayaç kartı: Doğru (yeşil) / Yanlış (kırmızı) / Boş (gri)
  - Her biri: `[ − ]  sayı  [ + ]` düzeni
  - Buton min boyut 48x48px, butonlar arası min 48px boşluk
- Özet: İki ayrı kutu yan yana - "Toplam Soru" ve "Net Puan"
- Aksiyon butonları: "Kaydet" ve "Sıfırla"
- Kaydedildikten sonra form otomatik kapanır

**Sonuç Paneli:**
- Geçmiş tablosundan seçilen kaydın detaylı istatistikleri
- Yeni eklenen kayıt otomatik seçilir
- Net puan ve toplam soru yan yana büyük kutularda
- **Modern segmentli bar:** Doğru, Yanlış, Boş ayrı segmentler halinde
  - Her segment muted renkli arka plan, koyu border (2px), yuvarlatılmış köşeler
  - Her segment içinde yüzdelik etiketi (örn: "45.5%")
  - Minimum genişlik garantisi ile tüm yazılar okunabilir
- D/Y/B detay kartları (sayı + yüzde)
- Sınav adı, ders, tarih gibi meta bilgiler
- Düzenleme butonu: seçili kaydın D/Y/B, sınav adı ve ders bilgisi güncellenebilir
- Boş state: "Bir kayıt seçin veya yeni değerlendirme yapın"

**Geçmiş Tablosu:**
- Varsayılan olarak bugünün verilerini gösterir
- **Tarih filtreleri:** Gün / Hafta / Ay / Yıl (tab butonlar, pagination yok)
- **Tarih navigasyonu:** İleri/geri ok butonları ile seçili dönemde gezinme
  - Desktop'ta filtre tab'ları solda, navigasyon sağda aynı satırda
  - Mobilde filtre tab'ları üstte, navigasyon altta
  - Geleceğe gidilemez (ileri buton bugünün dönemindeyken devre dışı)
  - Geçmişe gidildiğinde "Bugün" butonu görünür
- Filtre seçimine göre tarih aralığı etiketi gösterilir
- Modern tablo: Tarih, Sınav, Ders, D/Y/B, Net sütunları
- Satır tıklanarak seçilir, seçili satır sol kenarda mavi çizgi ile vurgulanır
- Hover efekti ile interaktif satırlar
- Her satırda silme butonu
- JSON dışa/içe aktarım + "Temizle" butonları header'da

### 2. Takvim

İnteraktif takvim sistemi - 4 görünüm modu:
- **Yıllık:** 12 ay kartı grid'i. Her kart aylık istatistikleri gösterir
  - **Modern segmentli bar:** Doğru, Yanlış, Boş ayrı segmentler halinde, her segment içinde yüzdelik etiketi
  - Toplam soru, D/Y/B sayıları, net, sınav sayısı, aktif gün bilgileri
  - Karta tıklanarak o ayın aylık görünümüne geçiş
- **Aylık:** Klasik takvim grid (7 sütun). Her gün kutusunda toplam soru, doğru, yanlış, boş özet
- **Haftalık:** 7 günlük detaylı görünüm
  - Her gün için **segmentli bar:** Doğru, Yanlış, Boş ayrı segmentler, yüzdelik etiketleri
  - Toplam soru sayısı ve detay butonu
- **Günlük:** Seçili günün tüm sınav kayıtları detaylı liste
  - Her deneme kartında **segmentli bar:** D/Y/B segmentleri ve yüzdelik etiketleri
  - Sınav adı, ders, D/Y/B sayıları, net puan

**Takvim navigasyonu:**
- İleri/geri ok butonları ile dönemler arası gezinme
- Geleceğe gidilemez (ileri buton bugünün dönemindeyken devre dışı)
- Her mod için uygun navigasyon (yıl, ay, hafta, gün)

Takvim özet istatistikleri:
- Seçili dönemdeki toplam çözülen soru
- Toplam doğru / yanlış / boş
- Ortalama net
- Çalışılan gün sayısı (streak)

### 3. Ayarlar

- Konfigürasyon yönetimi (listeleme, ekleme, silme)
- Açık/Koyu tema seçimi

## Bar Gösterimleri (Tutarlı Tasarım)

Tüm uygulamada kullanılan modern bar stili:
- **Segmentli yapı:** Doğru, Yanlış, Boş ayrı segmentler halinde
- **Renkler:** Muted, yarı saydam arka planlar (glassmorphism uyumlu)
  - Doğru: Hafif yeşil tint
  - Yanlış: Hafif kırmızı tint
  - Boş: Hafif gri tint
- **Border:** Her segment 2px kalınlığında, kendi renginden bir ton koyu border
- **Yuvarlatılmış köşeler:** Her segment kendi başına yuvarlatılmış (border-radius)
- **Yüzdelik etiketleri:** Her segment içinde yüzdelik gösterimi (örn: "45.5%")
- **Minimum genişlik:** Tüm yazıların okunabilir olması için minimum genişlik garantisi
- **Segment arası boşluk:** Modern pill/chip görünümü için segmentler arası gap

## Sayaç Renk Kodları

- Doğru: #22c55e (Yeşil)
- Yanlış: #ef4444 (Kırmızı)
- Boş: #6b7280 (Gri)
- Primary: #3b82f6 (Mavi - Açık tema) / #06b6d4 (Cyan - Koyu tema)

## UI/UX

- Glassmorphism tasarım: yarı saydam kartlar, backdrop-filter blur, glow efektleri
- **Açık tema:** Gradient arka plan (mor-mavi)
- **Koyu tema:** Saf siyah arka plan (#0a0a0a), cyan aksan rengi (#06b6d4)
- Inter font ailesi
- Responsive: Mobilde tek sütun, desktop'ta grid
- Sticky navigation bar (3 tab: Sayaç, Takvim, Ayarlar)
- Kartlar border-radius 20px, hover yükselme + glow

## PWA

- Service Worker ile offline çalışma
- manifest.json ile ana ekrana ekleme
- Tema rengi ve ikonlar

## Versiyon

- v3.1.0

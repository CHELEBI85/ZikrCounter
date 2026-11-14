# ZikirMatik — Manuel Android Build Rehberi

EAS Build kullanılmıyor. Release AAB/APK bu makinede Gradle ile üretilir.

---

## 1. Ortam (tek seferlik kontrol)

| Gereksinim | Durum |
|---|---|
| JDK 17 | ✅ Temurin 17.0.20.1 |
| Android SDK | ✅ `C:\Users\gezer\AppData\Local\Android\Sdk` |
| `android/local.properties` | ✅ oluşturuldu (SDK yolu) |
| `android/keystore.properties` | ✅ oluşturuldu (imza bilgileri) |
| Keystore | ✅ `credentials/android/keystore.jks` |

Kontrol:

```bash
java -version && echo $ANDROID_HOME
```

---

## 2. İmzalama nasıl kurgulandı

- Şifreler **`android/keystore.properties`** dosyasında (git'e girmez).
- `android/app/build.gradle` bu dosyayı okuyup `release` signingConfig'i kurar.
- Dosya yoksa release build **debug key** ile imzalanır (yalnızca yerel test için) — build patlamaz ama Play Store kabul etmez. Bu yüzden her yüklemeden önce **adım 5'teki doğrulamayı** çalıştır.

Keystore parmak izi (Play Console'daki ile aynı olmalı):

```
SHA-1   : 85:26:51:67:A0:52:31:0A:17:3A:DB:56:21:8D:87:AD:A6:3F:BC:55
SHA-256 : 68:F2:CC:8E:A4:41:D4:F2:0D:D9:2A:C3:D7:A3:83:E1:75:18:56:0C:0A:EB:51:4F:DB:0D:7A:FC:A5:D3:D6:FE
Alias   : 5026bd122b7c008497641d691954dccb
```

> ⚠️ Bu keystore kaybolursa uygulamaya bir daha güncelleme yükleyemezsin.
> `credentials/` klasörünün yedeğini repo dışında güvenli bir yerde tut.

---

## 3. Sürüm numarasını yükselt

Play Store'a her yeni yüklemede `versionCode` **artmalı**. İki yerde birden güncelle:

- `app.json` → `expo.version` (görünen sürüm) ve `expo.android.versionCode`
- `android/app/build.gradle` → `defaultConfig { versionCode ... versionName ... }`

Şu an: `versionName 1.1.0` / `versionCode 11`

---

## 4. Build al

Play Store'a yüklenecek **AAB**:

```bash
npm run build:aab
```

Cihaza elden kurmak / test için **APK**:

```bash
npm run build:apk
```

Sorun çıkarsa önce temizle:

```bash
npm run clean:android
```

**Çıktılar:**

| Tür | Yol |
|---|---|
| AAB | `android/app/build/outputs/bundle/release/app-release.aab` |
| APK | `android/app/build/outputs/apk/release/app-release.apk` |

---

## 5. İmzayı doğrula (yüklemeden önce ZORUNLU)

```bash
npm run verify:aab
```

Bu komut keystore'daki SHA-256 ile çıktıdaki imzayı karşılaştırır.
`[OK] Imza dogru` görmeden Play Console'a yükleme.

---

## 6. Play Console'a yükle

1. [Play Console](https://play.google.com/console) → ZikirMatik → **Üretim** (veya İç test)
2. **Yeni sürüm oluştur** → `app-release.aab` dosyasını sürükle
3. Sürüm notlarını gir → **İncele** → **Yayınla**

---

## Dikkat: `expo prebuild`

`npx expo prebuild --clean` çalıştırırsan `android/` klasörü **sıfırdan üretilir** ve
`build.gradle`'daki imzalama bloğu **silinir**. Bu durumda:

1. `git checkout android/app/build.gradle` ile geri al, **veya**
2. Adım 2'deki signingConfig bloğunu tekrar ekle.

`android/` klasörü git'te tutuluyor, o yüzden normalde prebuild'e hiç gerek yok.

---

## Git'e girmeyen dosyalar

Bunlar `.gitignore`'da — makine değiştirirsen elle taşıman gerekir:

```
credentials/                    # keystore.jks
credentials.json                # EAS formatındaki şifreler
android/keystore.properties     # Gradle'ın okuduğu şifreler
android/local.properties        # SDK yolu
```

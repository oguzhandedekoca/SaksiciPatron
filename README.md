# Saksici Patron - React + TypeScript + Vite

Bu proje, React + TypeScript + Vite kullanılarak geliştirilmiş bir oyun uygulamasıdır. Google Analytics entegrasyonu ile kullanıcı etkileşimleri takip edilmektedir.

## Google Analytics Kurulumu

Projeyi çalıştırmadan önce Google Analytics'i yapılandırmanız gerekmektedir:

1. **Google Analytics Hesabı Oluşturun:**

   - [Google Analytics](https://analytics.google.com/) adresine gidin
   - Yeni bir property oluşturun
   - Measurement ID'nizi alın (G-XXXXXXXXXX formatında)

2. **Environment Variable Ayarlayın:**

   - Proje kök dizininde `.env` dosyası oluşturun
   - Aşağıdaki satırı ekleyin:

   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

   - `G-XXXXXXXXXX` yerine kendi Measurement ID'nizi yazın

3. **Geliştirme Ortamında Test:**
   - `.env` dosyasında `VITE_GA_MEASUREMENT_ID=GA_MEASUREMENT_ID` olarak bırakırsanız, Google Analytics devre dışı kalır
   - Bu durumda console'da analytics hataları görmeyeceksiniz

## Özellikler

- **Oyun Takibi:** Oyun başlatma, pot fırlatma, çalışan vurma ve oyun tamamlama olayları takip edilir
- **Kullanıcı Etkileşimleri:** Sayfa görüntüleme ve buton tıklamaları takip edilir
- **Performans Metrikleri:** Oyun süresi, skor ve zorluk seviyesi analiz edilir
- **Akıllı Leaderboard:** Aynı isimdeki oyuncuların sadece en yüksek skorları gösterilir, duplicate skorlar otomatik temizlenir

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

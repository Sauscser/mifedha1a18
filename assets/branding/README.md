This folder contains NiSenti branding assets. The square `nisenti_playstore_512.png` is the authoritative artwork used for app-store, web, and legacy Android icons.

Files:
- `nisenti_playstore_512.png`: 512x512 Play Store and Expo app icon with the full NiSenti wordmark.
- `nisenti_foreground.png`: transparent full-size logo used to derive the Android adaptive foreground.
- `nisenti_foreground_adaptive.png`: generated foreground scaled to Android's adaptive-icon safe area.

To regenerate all icon assets and Android mipmaps on Windows, run from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate_and_deploy_icons.ps1
```

Notes:
- The app icon in `app.json` supplies the full square artwork to Expo and iOS; Android uses the adaptive-safe foreground over a white background.
- Rebuild and reinstall the Android app after generating icons. Existing installs and launcher caches do not change until the updated app is installed.

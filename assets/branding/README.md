This folder contains NiSenti branding assets.

Files:
- nisenti_launcher.svg: circular NiSenti launcher icon with a bold #e29d58 outline and centered NiSenti text.
- nisenti_playstore.svg: Play Store-ready art using the same circular NiSenti logo.

To generate PNG mipmaps for Android launcher and a 512x512 Play Store icon using ImageMagick on Windows (PowerShell), run:

magick convert nisenti_launcher.svg -resize 48x48 assets/android/icon-48.png
magick convert nisenti_launcher.svg -resize 72x72 assets/android/icon-72.png
magick convert nisenti_launcher.svg -resize 96x96 assets/android/icon-96.png
magick convert nisenti_launcher.svg -resize 144x144 assets/android/icon-144.png
magick convert nisenti_launcher.svg -resize 192x192 assets/android/icon-192.png
magick convert nisenti_launcher.svg -resize 512x512 assets/android/icon-512.png

magick convert nisenti_playstore.svg -resize 1024x1024 assets/branding/nisenti_playstore_1024.png
magick convert nisenti_playstore.svg -resize 512x512 assets/branding/nisenti_playstore_512.png

Notes:
- The Play Store requires a 512x512, 32-bit PNG with no alpha (or flattened).
- Replace the app icon references in app.json and/or the native Android resources as needed.

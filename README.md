# StudyFlow Warrior Plus — GitHub Pages PWA

Upload the contents of this folder to the root of a public GitHub repository.
In repository Settings > Pages, select Deploy from a branch, `main`, `/ (root)`, and Save.
Visit `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/` in Chrome on Android.
Use Chrome's ⋮ menu > Install app (or Add to Home screen, if offered).

Files: index.html (the complete app), manifest.webmanifest (install settings),
sw.js (offline cache), icons/ (home screen icons).

Your tasks are stored in browser localStorage, not synced between devices or
between the old downloaded HTML file and the new HTTPS site. Export a JSON backup
from the old app and import it into the hosted app if you want to migrate.
Back up regularly. Uninstalling or clearing site data may delete local data.

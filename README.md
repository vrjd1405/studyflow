# StudyFlow Desktop — Ultimate Edition

StudyFlow is a static, installable study planner. It includes a desktop dashboard, month/week/day calendar, task and event filters, subject notes, focus sessions, and analytics. The original warrior artwork, icons, and 14 scheduled activities from November 24 to December 2, 2026 are included.

## Deploy to GitHub Pages

1. In your current StudyFlow, open **Profile → Export JSON backup** and save a copy.
2. Unzip the package. Copy its contents into the folder your repository already publishes. The published folder should directly contain `index.html`, `desktop.css`, `sw.js`, `manifest.webmanifest`, and `icons/`.
3. Commit the files to your Pages source branch. Once the deployment finishes, open the HTTPS Pages address. Reload once if the previous version is still open.
4. After the first successful online load, the installed app can reopen offline. On a browser that offers PWA installation, use its address bar or menu to install StudyFlow.

There is no build step. The relative paths also work under a repository subdirectory, such as `/studyflow/`.

## Existing data

The app reads and writes the original `studyflow-warrior-v4` localStorage record. Use the same browser profile and origin (scheme, hostname, and port) to retain automatic access to that data. If you change browsers, profiles, or domains, open **Profile → Restore JSON backup** and select your saved file. Restoring a backup replaces the current data.

The original cumulative focus-session total is retained. Minutes are recorded for sessions completed in Ultimate Edition.

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

## Recurring tasks, live timeline, and reminders

In **Add activity**, select **Task**. Choose **Weekly or every day**, select weekdays, and choose an inclusive end date up to one year from the start. Or choose **Specific dates** and add dates with the picker. Each occurrence appears in the calendar, schedule and task list and has its own completion state. Edit one occurrence or remove this and later unfinished occurrences from its edit window.

The top of the dashboard shows the current and next timed activity using your device's local clock. Set a duration when adding or editing an activity. Older activities use 30 minutes. If activities overlap, the most recently started one is featured and the overlap count is shown. The green Now line marks your position in today's plan.

Timed activities have an optional in-app reminder. For system notifications, use **Profile → Enable device notifications** and allow notifications in your browser. Keep StudyFlow running and your device awake. Browser suspension can delay or skip a reminder. This GitHub Pages package does not schedule notifications after the app closes.

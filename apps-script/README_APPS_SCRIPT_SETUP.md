# Best Web Developer Google Sheets CMS Setup

This folder contains the Apps Script backend for the static HTML/CSS/JavaScript admin pages.

## Steps
1. Open the Google Sheet: https://docs.google.com/spreadsheets/d/1zlupdxEyaOhuurdvYi5DhRduXVszY5plN7UFqEfO0X4/edit
2. Go to **Extensions > Apps Script**.
3. Paste `Code.gs` into the Apps Script editor.
4. Optional but recommended: Project Settings > Script properties > add `ADMIN_PASSWORD` with your password.
5. Run `setupSheets()` once. This creates separate tabs: `Pages`, `Blogs`, `Services`, `Categories`, `Tags`, `SEO_Meta`, `GEO_Targets`, `AEO_FAQ`, `Settings`, and `Activity_Log`.
6. Deploy > New deployment > Web app.
7. Execute as: **Me**. Who has access: **Anyone with the link**.
8. Copy the Web App URL and paste it into `assets/js/cms-config.js` as `appsScriptUrl`.
9. Change `adminPassword` in `assets/js/cms-config.js` to match the script property.

## Security note
The static admin pages include a front-end password gate for convenience. The real write protection is the Apps Script `ADMIN_PASSWORD` check. Do not rely only on the front-end password for sensitive data.

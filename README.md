# Supreme Interiotech & Constructions

A responsive interior-design studio website with a Google Sheets portfolio, project video/photo modal, enquiry form, Apps Script email backend, and client project-update mailer.

## Files

- `index.html`, `style.css`, `script.js`: deploy these three files together to GitHub Pages.
- `Code.gs`: Google Apps Script backend, run as a bound script from the portfolio spreadsheet.
- `Projects-template.csv`: three example project rows for reference/import.

The website can read a one-row-per-project sheet with separate `image`, `video`, and `reels` columns, the older one-row-per-project schema, or the existing one-row-per-media schema. For the easiest maintenance, use one row per project and put multiple comma-separated links in each media cell.

## 1. Create the Google Sheet template

1. Create a Google spreadsheet, for example **Supreme Portfolio**.
2. Open **Extensions → Apps Script**.
3. Replace the editor contents with the full contents of `Code.gs`, then save.
4. In the function selector choose `setupSheets` and click **Run**. Approve the requested spreadsheet permissions.
5. Return to the spreadsheet. The setup creates these tabs:
   - **Projects**: seeded with three demo rows if the tab was empty.
   - **Enquiries**: website leads are saved here before emails are sent.
   - **Clients**: optional mailing list.
   - **Send Log**: results for each project-update email.

`Projects-template.csv` is an alternative example. If importing it, import into the **Projects** tab and keep the header names unchanged. The Apps Script setup creates the other tabs.

### Recommended media columns (one row per project)

Use these headers for the simple project-level layout:

| category | tier | project | image | video | reels | description | date |
|---|---|---|---|---|---|---|---|
| Residential | Signature | msr area project | `https://www.instagram.com/p/POST_ID/, https://example.com/room.jpg` | `https://youtu.be/VIDEO_ID_1, https://youtu.be/VIDEO_ID_2` | `https://www.instagram.com/reel/REEL_ID_1/, https://www.instagram.com/reel/REEL_ID_2/` | Interior project in the MSR area. | 2026-11-13 |

- Keep one row per project. To add a new photo, video, post, or Reel, add its URL to the matching cell, separated by a comma; do not add another row.
- `category` describes the project, such as `Residential`. `tier` must be `Premium`, `Signature`, or `Essential` and controls the portfolio filter. Keep it the same for every item in that project.
- `image` accepts direct photo URLs and Instagram post URLs. Instagram post links are recognized from `/p/` and shown as posts; direct image links open in the photo viewer.
- `video` accepts YouTube URLs or direct MP4, M4V, WebM, OGV, and OGG video URLs. A video file included in the website can be referenced by a relative path such as `assets/project-video.mp4`. `reels` accepts Instagram Reel URLs (`/reel/`).
- Instagram links must be public and allow embedding, but Instagram may show a poster instead of allowing playback inside this site. The embedded frame is sandboxed so Instagram links cannot navigate the visitor away. An Instagram Reel URL alone cannot provide inline playback. For reliable in-page playback, put the original video file in the website and add its path in `video`, for example `assets/project-reel.mp4`; use an MP4 encoded as H.264 video with AAC audio for broad browser support. YouTube embeds can also play in-page, subject to YouTube embed permissions and browser codec support.
- `date` accepts a year or a full date; full dates sort newest first and show on the project card.
- The project card summarizes its available media types. Opening it shows each video, photo, post, and Reel in the project's viewer. Repeated links are shown only once.

Google Sheets automatically quotes cells containing commas when publishing CSV. When editing in Sheets, enter all links in a media cell as a comma-separated list.

### Legacy Projects columns (one row per project)

Keep the header row exactly as shown:

| Title | Tier | Location | Year | Area (sq ft) | Description | YouTube URL | Cover Image URL | Photo URLs | Featured | Status |
|---|---|---|---:|---:|---|---|---|---|---|---|
| KSR Area Project | Premium | KSR area | 2026-11-12 |  | Interior project in the KSR area. | `https://youtu.be/SNc9uJD_y9s` |  | `https://www.instagram.com/p/DL7_mlJzEsP/` | Yes | Show |

- One row represents one project. Add multiple video URLs and photo URLs separated by commas.
- Videos, direct photos, Instagram posts, and Instagram Reels for a project are combined in one project viewer with previous/next controls; each project remains its own card.
- `Tier` must be `Premium`, `Signature`, or `Essential`.
- `Year` accepts a year such as `2026` or a full date such as `2026-11-12`; full dates sort newest first and show on the project card.
- Only `Status` = `Show` appears on the public site. Use `Hide` to keep a project out of view.
- `Featured` = `Yes` adds it to the featured area on the homepage as well as the portfolio.
- Use direct, publicly accessible image URLs for photos that should open in the site's lightbox. Public Instagram post and Reel URLs in `Photo URLs` are embedded as project slides and labeled by media type; repeated identical URLs are shown once.
- If Cover Image URL is empty, the first video's YouTube thumbnail is used; if there is no video, the first direct photo is used.
- YouTube video URLs are played in the site modal only. Embedding must be enabled on each video.

### Existing media-sheet columns (legacy: one row per media item)

The site also supports the currently connected sheet columns `category, project, type, title, link, description, date`. To assign the three service tiers, add a new column named `tier` (for example, after `category`) and fill it in on every media row for that project. Keep the same tier value for all rows belonging to one project. For example, add each MSR Area Project item as a separate row, keeping `project` and `tier` the same:

| category | tier | project | type | title | link | description | date |
|---|---|---|---|---|---|---|---|
| Residential | Signature | msr area project | video | Room walkthrough | `https://youtu.be/VIDEO_ID` |  | 2026-11-13 |
| Residential | Signature | msr area project | reel | Before and after | `https://www.instagram.com/reel/REEL_ID/` |  | 2026-11-14 |
| Residential | Signature | msr area project | post | Living room details | `https://www.instagram.com/p/POST_ID/` |  | 2026-11-14 |
| Residential | Signature | msr area project | image | Bedroom photo | `https://example.com/photo.jpg` |  | 2026-11-14 |

`category` describes the kind of project (such as Residential); `tier` selects the Premium, Signature, or Essential filter; `type` classifies each media item. Use `video` for YouTube, `reel` for an Instagram Reel, `post` for an Instagram post, and `image` for a direct image URL (or an Instagram URL, which is classified from its link). The project card summarizes which media types it contains, and the viewer labels each item. The `title` column is currently informational. To add a new post or Reel later, append a row with the same project name and tier, set its type and public link, then publish the updated sheet; the portfolio refreshes within about five minutes. A `category` value matching one of the tier names is also accepted when there is no tier value. The site's current KSR/MSR/BSR assignments are demo defaults only; explicit values in the sheet take precedence. Projects without an assigned tier default to Signature.

Rows with the same project value are grouped into a single card, and the project's media is placed together in the viewer. YouTube links become video slides; public Instagram posts and Reels become Instagram embed slides labeled by type; direct image links become lightbox photo slides. Repeated links of the same kind are deduplicated.

## 2. Publish the Projects tab as CSV

1. In the spreadsheet, choose **File → Share → Publish to web**.
2. Select the tab to publish (the current link publishes the media sheet; for the newer schema, select **Projects**) and choose **Comma-separated values (.csv)**.
3. Click **Publish**, confirm, and copy the URL.
4. In the `CONFIG` block at the very top of `script.js`, replace `PASTE_PUBLISHED_PROJECTS_CSV_URL_HERE` with that URL.

The site checks for changes every five minutes and again when visitors open/reload the page. Adding, editing, featuring, hiding, or reordering a project in the sheet requires no code change or GitHub redeployment.

## 3. Configure contact information

At the top of `script.js`, set the `CONFIG` values:

- `SHEET_CSV_URL`: published Projects-tab CSV URL.
- `APPS_SCRIPT_URL`: deployed Apps Script Web App URL ending in `/exec`.
- `COMPANY_NAME`: public studio name.
- `PHONE`, `WHATSAPP_NUMBER`, `EMAIL`: approved business contact details. WhatsApp number must include country code, digits only.
- `MAP_URL`: optional Google Maps place/directions URL.
- `YOUTUBE_URL` and `INSTAGRAM_URL`: studio social profiles.
- `AUTO_REPLY`: whether the form requests a visitor confirmation email (Apps Script also has a server-side switch).

Do not publish private contact details or sample testimonials without the client's approval. The page currently contains no fabricated client testimonials.

## 4. Deploy the Apps Script enquiry backend

1. In the same spreadsheet choose **Extensions → Apps Script**.
2. In `Code.gs`, replace `REPLACE_WITH_STUDIO_EMAIL` in `APP_CONFIG.DESIGNER_EMAIL` with the designer's email address.
3. Save. Run `setupSheets` once if you have not already, then complete any permission prompts.
4. Choose **Deploy → New deployment**.
5. Select **Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Deploy and authorize.
6. Copy the Web App URL ending in `/exec` to `CONFIG.APPS_SCRIPT_URL` in `script.js`.
7. Redeploy a **new version** of the Web App after every later Apps Script code change. The website itself does not need redeployment for spreadsheet row updates.

The form sends URL-encoded data with `fetch()` (a CORS-simple content type), includes browser and server validation, a hidden honeypot, and a minimum submission-time check. `doPost` appends the enquiry first, then sends at most one designer email and—if enabled and quota remains—one visitor auto-reply. It checks `MailApp.getRemainingDailyQuota()` before sending. If email quota is unavailable, the enquiry remains saved and the website still receives a success response. Apps Script deployment, Google account authorization, and browser network policy can affect cross-origin responses; test the deployed form from the published site.

Google's approximate daily-recipient quotas are around 100 for consumer Gmail and 1,500 for Workspace, but the live `getRemainingDailyQuota()` result is authoritative.

## 5. Optional client project-update emails

In the **Clients** tab, add one row per client with:

| Name | Email | Phone | Subscribed | Last Sent |
|---|---|---|---|---|
| Example Client | client@example.com | +911234567890 | Yes | |

Only rows with `Subscribed` = `Yes` are included. From Apps Script, run `sendProjectUpdate` with a project title and public project URL, for example:

```js
sendProjectUpdate("Courtyard House", "https://your-site.example/#portfolio");
```

The script checks quota before sends, sends only as many as remaining quota allows, updates `Last Sent`, logs each attempt in **Send Log**, and schedules a daily continuation for remaining recipients. It prevents starting a second campaign while a previous one is queued. Client emails contain a signed unsubscribe link; opting out marks `Subscribed` = `No`.

## 6. Run locally and publish on GitHub Pages

1. Keep `index.html`, `style.css`, and `script.js` in the same folder.
2. Run the page through VS Code Live Server or another local HTTP server; opening `file://` directly may block requests.
3. Create a GitHub repository and upload the three website files.
4. In GitHub open **Settings → Pages**.
5. Select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
6. Open the GitHub Pages URL provided by GitHub.
7. For a custom domain, add it under **Settings → Pages → Custom domain**, configure the DNS records GitHub shows at your domain provider, wait for DNS verification, and enable HTTPS.

## How to add a project (client guide)

1. Upload the project walkthrough video(s) to YouTube and make sure embedding is allowed. Copy each video URL.
2. Upload/host project photos at public, direct image URLs, or copy the public Instagram post URL. Instagram must allow embedding; its carousel controls display inside the project viewer.
3. Add one row per project to the **Projects** tab. Put all video URLs and photo/post URLs for that project in their respective cells, separated by commas. Save—the site's project viewer keeps that project's videos and photos together, and the portfolio updates automatically within about five minutes.

## Troubleshooting

- **Sample projects still show:** Check `SHEET_CSV_URL`, ensure it is a published CSV for the **Projects** tab, and wait up to five minutes.
- **Projects missing:** Check exact column headers, valid tier, and `Status` = `Show`; hidden rows are intentionally omitted.
- **Instagram Reel does not play inline:** An Instagram URL can show a preview but cannot guarantee in-page playback. Add the original MP4 video file to the website and enter its relative path in the `video` column, such as `assets/project-reel.mp4`.
- **Video not playing in modal:** Confirm the YouTube ID/link is correct and embedding is enabled in the video's YouTube settings. Browser codec support can also prevent playback; for reliable playback, add an MP4 encoded as H.264 video with AAC audio to the website and use its path in `video`.
- **Enquiry form says it is not connected:** Set `APPS_SCRIPT_URL` to the current deployed `/exec` URL, and set the studio email in `APP_CONFIG`.
- **Form request fails:** Confirm Web App access is **Anyone**, authorize Apps Script, redeploy after code changes, and test from the HTTP/HTTPS site rather than `file://`.
- **No enquiry email:** Check the **Enquiries** tab first; saved leads are retained even when mail quota is exhausted. Check Apps Script executions and the remaining daily quota.
- **Client update emails pause:** Remaining subscribed clients are queued for the daily continuation; check **Send Log** and ensure Apps Script triggers are authorized.

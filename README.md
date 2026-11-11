# 報修登記系統
用於提交報修需求並查看報修清單。

[報修欄位表（Excel）](文件/報修欄位表.xlsx)

[報修系統操作說明（Word）](文件/報修系統操作說明.docx)

[報修登記系統提案（PowerPoint）](文件/報修登記系統提案.pptx)

## 網頁前端

儲存庫根目錄的 `index.html`、`style.css`、`app.js`、`config.js` 為純靜態網頁，不需要建置或 npm 套件。Supabase JavaScript SDK v2 從 jsDelivr CDN 載入；`config.js` 僅包含公開專案網址與 publishable key。

本機預覽（需 Python 3）：

```sh
python -m http.server 8000
```

開啟 http://localhost:8000 。網站需要能連線至 jsDelivr 及設定的 Supabase 專案。

資料表欄位及 RLS 請參考 `supabase/schema.sql`。網站新增時只送出 `reporter_name`、`location`、`category`、`description`、`urgency`；`status`、`id`、`created_at` 由資料庫產生。讀取最近 20 筆並以 `created_at` 降冪排列，時間顯示為台北時間。此示範的清單公開，請使用虛構資料。

## GitHub Pages

在儲存庫 Settings → Pages 選擇 **Deploy from a branch**，來源設定為 **main / (root)**。首頁為 `index.html`，預期網址為 https://wonglung.github.io/godzilla/ 。若尚未啟用 Pages，需完成此設定才會上線。

## 驗證

- 語法檢查：`node --check app.js`、`node --check config.js`。
- 瀏覽器模擬 API 驗證：390px 手機與 1280px 桌面排版、空清單、新增欄位不含 status、成功後清空表單並刷新清單、資料庫時間顯示、文字內容防 HTML 注入、失敗保留輸入及清單重新整理。
- 畫面：[手機](docs/repair-mobile.png)、[桌面](docs/repair-desktop.png)；截圖資料為虛構的模擬 API 回應。
- 本次執行環境的網路代理拒絕 Supabase 網域（CONNECT 403），因此尚未驗證真實資料庫新增、讀取及 RLS。可連線後，請新增一筆虛構資料，確認產生時間且出現在清單；另確認公開金鑰不能更新、刪除資料。前端不提供更新或刪除操作。

## 清單緊急程度篩選

清單上方新增「全部、高、中、低」按鈕，預設選取「全部」。選取的按鈕以深綠底、白字及外框標示，並提供 `aria-pressed` 狀態。緊急程度為「高」的標籤使用紅字、淡紅底與紅色邊框。

篩選只處理網頁已讀取的最近 20 筆紀錄，不會額外查詢資料庫，也不代表所有歷史報修。沒有符合的紀錄時會顯示提示；重新整理清單或送出成功後仍保留目前篩選。本次未修改資料庫、欄位、RLS、`config.js` 或 `supabase/`。

手機確認方式：在這個 PR 分支啟動本機預覽，或待合併部署後開啟 GitHub Pages，滑到「最近報修」，依序點選「高、中、低、全部」，確認選取樣式、紀錄緊急程度及空結果提示；「高」的標籤應為紅色，四個按鈕應在同一排且不需水平捲動。可用虛構報修資料確認。PR 尚未合併時，正式 Pages 不會顯示這次變更。

本次以 Chromium 模擬 API 檢查手機與桌面篩選、切換不增加請求、空結果、載入失敗後切換仍保留錯誤提示，以及重新整理後保留篩選。畫面見 [手機篩選](docs/repair-filters-mobile.png)。

## PWA：安裝到主畫面與離線開啟

網站加入 `manifest.webmanifest`、`sw.js`、`pwa.js` 與 `icons/` 圖示，使用相對路徑支援 GitHub Pages 的 `/godzilla/` 子目錄。安裝後以獨立視窗開啟，仍使用原有報修表單與緊急程度篩選；資料庫、欄位與 RLS 未變更。

- **Android／桌面 Chrome、Edge**：開啟 https://wonglung.github.io/godzilla/ ，依瀏覽器提供的「安裝應用程式」操作；支援安裝提示時，頁面也會出現「安裝報修登記」按鈕。瀏覽器可能需要先使用網站才提供選項。
- **iPhone／iPad**：使用 Safari 開啟網站，點分享 →「加入主畫面」。安裝選項及名稱依瀏覽器／系統版本而異。
- **離線**：先在線上開啟網站，待 Service Worker 完成安裝後，可再次開啟已快取的頁面。首次從未開過網站時不能離線開啟。若 CDN SDK 曾成功快取，也會供離線頁面使用；未快取時仍可顯示表單與清楚的連線元件錯誤提示。
- **送出與清單**：離線時顯示提示並停用送出及重新整理。報修資料不寫入離線儲存、不快取 API 回應、不排隊補送；恢復網路後，已初始化的頁面會重讀清單，但不會自動送出表單。原先已顯示的紀錄只保留於當前頁面的記憶體，離線重開不會顯示舊清單。尚未送出的輸入只保留於目前頁面，離開或重新載入不保留；初始化失敗時請先保留內容，再於連線後重新載入。
- **安全連線**：PWA 需要 HTTPS 或 localhost；請使用本機 HTTP 伺服器預覽，不能直接以 `file://` 開啟。

快取僅包含網站靜態檔案、公開設定與可選的 CDN SDK，沒有報修人或問題內容。若修改任何快取檔案，需同步提高 `sw.js` 的 `CACHE_NAME` 版本（目前 v1）。新版本會等舊視窗全部關閉後生效；部署後請關閉所有此網站分頁及已安裝 App，再重新開啟並連線載入。清理舊快取只影響此 App 的 scope，不影響同網域其他專案。

驗證：雲端 Chromium 在 `/godzilla/` 子路徑測試 Service Worker scope、manifest 與靜態快取；實際 CDN SDK 配合模擬 API 驗證新增欄位仍不含 status、篩選不增加請求、API 不進快取。模擬斷網後確認首頁／目錄網址可重開、清單不持久保存、送出停用、恢復連線保留當頁輸入且不補送，以及缺少 SDK 快取時仍有離線頁面及錯誤提示。390px 手機排版無水平溢出。截圖：[手機 PWA](docs/pwa-mobile.png)、[離線狀態](docs/pwa-offline.png)；測試資料皆虛構。尚未實機驗證 Android／iOS 安裝，真實 Supabase 連線與 RLS 仍待驗證。

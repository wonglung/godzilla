# 報修登記系統
用於提交報修需求並查看報修清單。

[報修欄位表（Excel）](文件/報修欄位表.xlsx)

[報修系統操作說明（Word）](文件/報修系統操作說明.docx)

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

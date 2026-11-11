# 報修登記系統
用於提交報修需求並查看報修清單。

[報修欄位表（Excel）](文件/報修欄位表.xlsx)

## 網頁前端

首頁為根目錄 `index.html`，使用純 HTML/CSS/JavaScript 與 CDN 的 supabase-js v2。

1. 在 `config.js` 填入 Supabase 專案 HTTPS 網址及 `sb_publishable_` 開頭的公開金鑰；不得使用 secret 或 service_role 金鑰。
2. 資料庫管理者需另行審查並套用 `supabase/schema.sql`；前端不會執行建表 SQL。
3. 本機預覽：在儲存庫根目錄執行 `python3 -m http.server 8000`，瀏覽 `http://localhost:8000`，無需建置。
4. GitHub Pages 設定來源為 `main` 分支的 `/ (root)`；預期網址為 https://wonglung.github.io/godzilla/ 。

驗證時僅使用虛構資料：送出後確認成功訊息、表單重設、清單出現資料庫產生的時間，並確認最近 20 筆由新到舊。另確認缺漏設定、斷線與權限錯誤會顯示訊息；手機版無水平捲動。匿名角色應可新增及讀取，但不可修改或刪除；實際權限測試需另外在已設定的測試專案進行。清單為公開資料，請勿輸入個人或敏感資訊。

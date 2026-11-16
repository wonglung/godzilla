# 蠟筆小新劇場版片單（忍者＋武士系列）

獨立於報修登記系統的純靜態網頁，不需要建置、npm 套件或資料庫。

## 功能

- 依系列篩選：全部、忍者、武士
- 搜尋片名、日文原名或年份
- 勾選「已看過」並顯示進度；可隱藏已看過的電影（只存在本機瀏覽器 localStorage）

## 檔案

- `index.html`：頁面
- `movies.js`：片單資料（新增電影時修改這裡）
- `app.js`：篩選、搜尋、已看過邏輯
- `style.css`：樣式，支援深色模式與手機版

## 本機預覽（需 Python 3）

```sh
python -m http.server 8000
```

開啟 http://localhost:8000/shinchan-movies/ 。若啟用 GitHub Pages，網址為 https://wonglung.github.io/godzilla/shinchan-movies/ 。

## 驗證

- 語法檢查：`node --check shinchan-movies/app.js`、`node --check shinchan-movies/movies.js`
- 瀏覽器確認：切換忍者／武士篩選、搜尋、勾選已看過後重新整理仍保留。

片名與年份為整理資料，請以官方或串流平台資訊為準。

畫面：[手機](../docs/shinchan-mobile.png)、[桌面](../docs/shinchan-desktop.png)

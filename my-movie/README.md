# 我的原創劇場版：風見町劇場版 忍者與武士的千年約定

這是一部原創的忍者＋武士冒險劇場版企劃頁，角色、地點與劇情都是虛構的，不使用既有作品的角色。這個頁面是純靜態網頁，不需要建置。

## 內容

海報、故事大綱、5 位登場角色、三幕劇情、名場面預告、主題曲歌詞、片尾彩蛋。

## 修改成自己的版本

所有內容都在 `movie.js`，改文字就會更新頁面：

- `title`、`subtitle`、`tagline`：片名、副標題、宣傳標語
- `characters`：角色（`color` 是頭像底色）
- `acts`：三幕劇情；`scenes`：名場面
- `song`、`postCredits`：主題曲與片尾彩蛋

## 預覽與驗證

直接用瀏覽器開啟 `my-movie/index.html`，或在儲存庫根目錄執行 `python -m http.server 8000` 後開啟 http://localhost:8000/my-movie/ 。

- 語法檢查：`node --check my-movie/app.js`、`node --check my-movie/movie.js`
- 畫面：[手機](../docs/my-movie-mobile.png)、[桌面](../docs/my-movie-desktop.png)

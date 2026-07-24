# Hank 的行事曆

國考生專用的任務導向日程管理工具。單一自包含的 `index.html`，無任何外部相依，純前端。

## 功能

- **任務導向排程**：拖曳整段改期、拖右緣改跨天數，每日份量自動重算
- **日／週／月／季四段縮放**，可規劃約一年範圍的任務
- **預畫／執行雙方陣**：計畫 vs 實際達成
- **四軸難度**：重要性 × 精力消耗 × 時間消耗 → 難度
- **記憶存量儀表**：依 Ebbinghaus 指數遺忘模型 `R = e^(−t/S)` 估算殘留率
- **多目標 D-Day** 倒數與里程碑回推
- **考試凍結區**（段考週自動淡化非該科任務）
- **耗竭風險偵測、恢復日、生活額度、輸入／輸出精力配對**
- **本機自動存檔**（localStorage）＋ JSON 匯出／匯入
- **Google Drive 跨裝置同步**（選用，存於隱藏的 appDataFolder）

## 部署到 GitHub Pages（約 3 分鐘）

1. 在 GitHub 建一個新的 repository（例如 `hank-calendar`），設為 Public。
2. 把這個資料夾的 `index.html` 上傳進去（網頁介面拖曳上傳即可，或用 git push）。
3. repo → **Settings → Pages** → Source 選 `Deploy from a branch`，branch 選 `main` / 根目錄 `/ (root)`，Save。
4. 等 1–2 分鐘，網址會是 `https://你的帳號.github.io/hank-calendar/`。

> 資料存在你自己的瀏覽器，換裝置請用「資料」頁的匯出／匯入，或設定下方的 Google Drive 同步。

## 啟用 Google Drive 同步（選用，只需設定一次）

同步採 PKCE 公開用戶端，前端無密鑰、不會外洩 token。

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)，建立專案，啟用 **Google Drive API**。
2. **OAuth 同意畫面** → 使用者類型「外部」→ 發布狀態維持「測試中」→ 把自己的 Gmail 加入**測試使用者**（不必送審）。
3. **憑證 → 建立憑證 → OAuth 用戶端 ID → 網頁應用程式**：
   - 「已授權的 JavaScript 來源」填 `https://你的帳號.github.io`
4. 複製產生的 **Client ID**。
5. 打開網站 → **資料** 頁 → 貼上 Client ID → 按「儲存」→ 按「連接 Google Drive」→ 完成授權。

之後每次變動會自動上傳；換裝置時開啟同一網址、用同一 Google 帳號連接即可拉回。

## 注意

- Google 登入在 `file://` 或預覽環境會被瀏覽器擋下，**必須部署到真正的 https 網址（GitHub Pages）才會運作**。
- 記憶存量是**模型估計、非實際量測**——它只知道你多久沒複習，不知道你是否真的記得。
- 「兩台裝置同時離線編輯」採「較新時間戳獲勝」，理論上可能覆蓋較舊的一方；單人日常使用不受影響。

---

版本 v1.0.0-rc · 純前端 · 無追蹤 · 資料歸你所有

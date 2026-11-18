# 加樂與于文婚禮網站

繁體中文單頁婚禮節目單，包含迎賓、結婚禮拜、婚宴、六章音樂故事與合照時間。

## 本機預覽

在 VS Code 開啟專案資料夾，並在 PowerShell 終端機執行下列指令。Node.js 使用專案內的 LTS 版本，可放在 `.tools/node/`。

```powershell
.\.tools\node\node.exe scripts/check.mjs
.\.tools\node\node.exe scripts/preview.mjs
```

在瀏覽器開啟 [本機預覽](http://127.0.0.1:4173/)。修改後重新整理頁面，即可看到新內容。按 `Ctrl+C` 停止伺服器。要檢查 GitHub Pages 子路徑，可改用 `scripts/preview.mjs /wedding-website/` 啟動，再開啟 `http://127.0.0.1:4173/wedding-website/`。

## 修改內容與封面

日常更新以 `data/site.json` 和 `data/program.json` 為準。兩份婚禮 Markdown 提供製作規格與首次匯入的內容。

| 要改的內容 | Pages CMS | 本機檔案 |
|---|---|---|
| 開場、感謝文、場地或封面 | 網站基本資料 | `data/site.json` |
| 時間、流程說明或儀式介紹 | 婚禮流程 → 對應節目 | `data/program.json` |
| 表演者、表演者介紹、曲目、故事或照片 | 婚禮流程 → 對應演出 | `data/program.json` |

新增一場演出時，在「婚禮流程」新增項目，類型選「音樂演出」，填入唯一的節目識別碼、節目名稱、開始時間、音樂章名、表演者、曲目和故事。每首曲目各填一項，把演出拖到正確時段，網站會依順序排出章次。同一場有多位表演者時，可一起填在「表演者」欄。

在本機編輯照片時，把圖檔放在 `images/`。封面使用 `heroImage` 和 `heroImageAlt`，音樂故事使用 `image` 和 `imageAlt`。在表單裡可以直接透過照片欄選擇或上傳，再填入簡短的照片替代文字。

## 第一次連接 Pages CMS

1. 在 VS Code 的原始檔控制提交網站檔案，再將 `main` 推到目標 GitHub 儲存庫。儲存庫根目錄的 `.pages.yml` 定義兩份中文表單。
2. 前往 [Pages CMS](https://app.pagescms.org/)，用 GitHub 登入。依畫面安裝 Pages CMS GitHub App，只選這個婚禮網站的儲存庫。開啟該 repo 的 `main`，即可看到「網站基本資料」和「婚禮流程」。 [Pages CMS 快速入門](https://pagescms.org/docs/quick-start/)
3. 準備公開網站時，在目標儲存庫選 **Settings → Pages → Source → GitHub Actions**。再到 **Actions → Check and publish wedding website → Run workflow**，選 `main` 跑第一次發布。當 `deploy` 成功，從 Pages 設定或部署紀錄開啟正式網址。 [GitHub Pages 發布設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 每次更新

- **用 Pages CMS 改文案或照片**。開啟表單，修改後按儲存。Pages CMS 會將變更提交到 GitHub。若已啟用 Pages，等 Actions 的資料檢查與部署成功，再到正式網址看結果。下次用 VS Code 修改前，先從 GitHub Pull，把 CMS 的 commit 同步回本機。 [Pages CMS 編輯流程](https://pagescms.org/docs/)
- **用 VS Code 或 Codex 改版面，或想先本機預覽**。先 Pull 最新內容，改完執行 `scripts/check.mjs` 並查看本機預覽。確認後 commit 並 push。剛在本機新增文字與照片時，把兩者放在同一筆提交。
- **回到上一個可用版本**。在 Git 記錄找出需要撤銷的提交，以 `git revert <commit>` 建立一筆反向提交，再 push 到 `main`。等 Actions 驗證並部署後，確認正式網址。

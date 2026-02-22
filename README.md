# 日本旅行規劃 App

一個功能完整的日本旅行規劃應用，包含行程安排、記帳、待辦事項、航班資訊等功能。

## 🚀 部署到 GitHub Pages

### 步驟 1：創建 GitHub Repository

1. 登入你的 GitHub 帳號
2. 點擊右上角的 `+` → `New repository`
3. 輸入 Repository 名稱：`webapp-japan_test`
4. 選擇 `Public`（公開）
5. 點擊 `Create repository`

### 步驟 2：上傳代碼到 GitHub

在你的專案資料夾中打開 PowerShell，執行以下命令：

```powershell
# 初始化 Git（如果還沒有的話）
git init

# 添加所有檔案
git add .

# 提交
git commit -m "Initial commit"

# 設置遠端倉庫
git remote add origin https://github.com/ZacharyYuenWW/webapp-japan_test.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 步驟 3：啟用 GitHub Pages

1. 在你的 GitHub repository 頁面，點擊 `Settings`
2. 在左側選單找到 `Pages`
3. 在 `Build and deployment` 部分：
   - Source: 選擇 `GitHub Actions`
4. 保存設置

### 步驟 4：等待部署完成

1. 點擊 repository 上方的 `Actions` 標籤
2. 等待部署工作流程完成（綠色勾號）
3. 部署完成後，你的網站網址會是：
   ```
   https://zacharyyuenww.github.io/webapp-japan_test/
   ```

## ⚠️ 重要說明

### 關於數據同步

**目前版本的數據儲存方式：**
- 所有數據（行程、待辦、記帳）都儲存在**用戶瀏覽器的 localStorage** 中
- **不同用戶之間無法看到彼此的數據**
- 每個用戶只能看到自己設備上的數據
- 清除瀏覽器數據會導致資料遺失

### 如果需要數據同步功能

如果你想讓所有用戶看到相同的數據並即時同步，需要：

1. **使用後端數據庫服務**（推薦以下選項）：
   - Firebase Realtime Database（免費額度充足）
   - Supabase（開源替代方案）
   - MongoDB Atlas（免費層可用）

2. **修改代碼**以連接數據庫，替換 localStorage

這需要額外的開發工作。如果需要此功能，請告訴我，我可以幫你實現。

## 📱 功能特色

- ✅ 8天行程規劃
- ✅ 自動路線查詢（Google Maps）
- ✅ 多幣種記帳功能
- ✅ 待辦事項管理
- ✅ 航班資訊記錄
- ✅ 多旅程管理
- ✅ 匯率自動更新
- ✅ 回復上一步（最多20步）
- ✅ 旅程匯出/匯入（JSON）

## 🛠️ 本地開發

```powershell
# 安裝依賴
npm install

# 開發模式
npm run dev

# 構建生產版本
npm run build
```

## 📄 License

MIT

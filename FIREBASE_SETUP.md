# Firebase 設置指南

## 步驟 1：創建 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」
3. 輸入專案名稱：`webapp-japan-trip`
4. 可以關閉 Google Analytics（不需要）
5. 點擊「建立專案」

## 步驟 2：設置 Realtime Database

1. 在 Firebase Console 左側選單點擊「Realtime Database」
2. 點擊「建立資料庫」
3. 選擇資料庫位置：`asia-southeast1`（新加坡，離香港最近）
4. 安全性規則選擇「以測試模式啟動」
5. 點擊「啟用」

## 步驟 3：設置安全性規則

在 Realtime Database 頁面，點擊「規則」標籤，貼上以下規則：

```json
{
  "rules": {
    "trips": {
      ".read": true,
      ".write": true
    },
    "sharedData": {
      ".read": true,
      ".write": true
    }
  }
}
```

**⚠️ 注意：這是開放的規則，適合測試。正式上線前應該加入身份驗證。**

點擊「發布」。

## 步驟 4：取得 Firebase 配置

1. 在 Firebase Console，點擊左上角的專案設定（齒輪圖示）
2. 選擇「專案設定」
3. 往下滾動到「你的應用程式」區塊
4. 點擊「Web」圖示（</>）
5. 輸入應用程式名稱：`Japan Trip Planner`
6. **不要勾選** Firebase Hosting
7. 點擊「註冊應用程式」
8. 複製顯示的 `firebaseConfig` 配置

## 步驟 5：更新配置文件

將複製的配置貼到 `src/firebaseConfig.ts` 文件中，替換掉現有的配置：

```typescript
const firebaseConfig = {
  apiKey: "你的API密鑰",
  authDomain: "你的項目ID.firebaseapp.com",
  databaseURL: "https://你的項目ID-default-rtdb.firebaseio.com",
  projectId: "你的項目ID",
  storageBucket: "你的項目ID.appspot.com",
  messagingSenderId: "你的消息發送者ID",
  appId: "你的應用ID"
};
```

## 步驟 6：測試連接

完成以上步驟後：

1. 儲存所有檔案
2. 重新啟動開發伺服器：`npm run dev`
3. 打開瀏覽器測試應用
4. 在 Firebase Console 的 Realtime Database 中應該能看到資料開始同步

## 數據結構說明

應用會在 Firebase 中創建以下數據結構：

```
/
├── trips/
│   ├── trip-xxxxx/
│   │   ├── id
│   │   ├── name
│   │   ├── createdAt
│   │   ├── lastModified
│   │   └── data/
│   │       ├── schedule/
│   │       ├── checklist/
│   │       ├── expenses/
│   │       ├── persons/
│   │       ├── checklistUsers/
│   │       ├── flights/
│   │       ├── tripSettings/
│   │       ├── exchangeRate
│   │       └── scheduleHistory/
│   └── ...
└── sharedData/
    ├── currentTripId
    └── lastUpdate
```

## 安全性建議（可選）

如果你想限制只有特定用戶可以編輯，可以添加 Firebase Authentication：

1. 在 Firebase Console 啟用 Authentication
2. 選擇登入方式（例如：Email/密碼、Google）
3. 更新安全性規則，限制只有已登入用戶才能寫入

完成後，所有用戶都會看到即時同步的數據！

# Owner 登入與後台流程 V1

> 狀態：（草稿中）｜版本：V1｜建立於 2026-04-03

---

## 1. 文件目的

## 2. 登入流程

### 2.1 入口 URL（/owner/[storeSlug]/login）

### 2.2 PIN 輸入規則（4–8 位數字）

### 2.3 Supabase owner_auth 查詢邏輯

### 2.4 錯誤情境處理

- 查詢失敗
- 找不到此店家
- PIN 碼錯誤

### 2.5 登入成功行為（localStorage 寫入 + 導向）

## 3. 後台 Layout

### 3.1 Sidebar（桌機）

### 3.2 Mobile Bottom Nav（手機）

### 3.3 Login 頁 bypass（不渲染 layout）

## 4. 導覽項目定義

| 項目 | 路由 | 說明 |
|------|------|------|
| 營運總覽 | /owner/[storeSlug] | |
| POS 點餐 | /owner/[storeSlug]/pos | |
| 訂單管理 | /owner/[storeSlug]/orders | |
| 菜單管理 | /owner/[storeSlug]/menu | |
| 通知設定 | /owner/[storeSlug]/notify | 佔位，未建立 |

## 5. 登出行為

### 5.1 目前實作（導回 login 頁，不清除 localStorage）

### 5.2 已知問題（localStorage 未清除）

## 6. 後台 Auth 現況與限制

### 6.1 無 middleware 保護

### 6.2 繞過方式（手動設 localStorage）

### 6.3 stores.name 顯示（login 頁副標題）

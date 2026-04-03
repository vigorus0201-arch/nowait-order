# KDS 廚房顯示系統規格 V1

> 狀態：（草稿中）｜版本：V1｜建立於 2026-04-03

---

## 1. 文件目的

## 2. KDS 定位

### 2.1 獨立路由（/kitchen/[slug]）

### 2.2 與 Owner 後台的關係（完全獨立）

### 2.3 Auth 保護現況（無保護）

## 3. Store Existence Validation

### 3.1 stores 查詢（maybeSingle）

### 3.2 無效 slug 行為（全頁錯誤提示）

## 4. 訂單訂閱機制

### 4.1 Supabase Realtime Channel

### 4.2 postgres_changes 事件

### 4.3 store_slug 過濾（/kitchen/[slug]）vs 無過濾（/kitchen/）

## 5. 音效提醒

### 5.1 觸發條件

### 5.2 Web Audio API 實作

### 5.3 AudioContext blocked 處理

## 6. 訂單卡片規格

### 6.1 顯示資訊

### 6.2 URGENT 標示條件（超過 10 分鐘）

### 6.3 mode badge（桌號 / 外帶 / POS）

## 7. 狀態推進操作

### 7.1 按鈕對應狀態

### 7.2 樂觀更新機制

### 7.3 失敗回退（重新 loadOrders）

## 8. 批次清除

### 8.1 清除已完成訂單

## 9. 過濾 Tab

### 9.1 全部 / 新單 / 製作中 / 完成

## 10. 已知限制與未來規劃

### 10.1 bring_number 叫號（尚未實作）

### 10.2 KDS Auth 保護（待評估）

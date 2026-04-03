# NoWait Order — 訂單狀態流轉 V1

> 狀態：（草稿中）｜版本：V1｜建立於 2026-04-03

---

## 1. 文件目的

## 2. 訂單狀態定義

| 狀態值 | 中文說明 | 顯示顏色 |
|--------|---------|---------|
| pending | | |
| preparing | | |
| completed | | |
| cancelled | | |

## 3. 狀態流轉圖

```
pending → preparing → completed
    ↓          ↓
cancelled  cancelled
```

## 4. 狀態轉換規則

### 4.1 允許的轉換路徑

### 4.2 不允許的轉換（逆向）

## 5. 各端操作端說明

### 5.1 KDS（廚房端）

- 可執行操作
- 操作方式（Supabase 直接 update）

### 5.2 Owner Orders（後台訂單管理）

- 可執行操作
- 操作方式（polling + update）

### 5.3 POS

- 只能建立訂單（status: pending）
- 不能修改狀態

### 5.4 顧客端

- 無法操作狀態（唯讀，且目前無追蹤頁）

## 6. 雙軌操作說明（KDS 與 Orders 並存）

## 7. 狀態與顧客顯示的對應（計畫中）

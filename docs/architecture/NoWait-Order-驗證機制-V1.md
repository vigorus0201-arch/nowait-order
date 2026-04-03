# NoWait Order — 驗證機制 V1

> 狀態：（草稿中）｜版本：V1｜建立於 2026-04-03

---

## 1. 文件目的

## 2. Owner 驗證機制

### 2.1 PIN 登入流程

### 2.2 owner_auth 表查詢邏輯

### 2.3 localStorage 寫入內容

### 2.4 後台頁面保護方式（目前現況）

### 2.5 無 middleware 說明

## 3. 顧客端驗證

### 3.1 無驗證設計原則

### 3.2 localStorage 購物車資料清單

## 4. KDS 驗證

### 4.1 無 auth 保護（設計假設說明）

## 5. localStorage Key 完整清單

| Key | 內容 | 寫入位置 | 讀取位置 |
|-----|------|---------|---------|
| nowait_cart | | | |
| nowait_store | | | |
| nowait_store_slug | | | |
| nowait_checkout_draft | | | |
| nowait_order | | | |
| nowait_orders | | | |
| owner_authenticated | | | |
| owner_store_slug | | | |

## 6. 已知安全限制

### 6.1 手動竄改 localStorage 可繞過 owner 驗證

### 6.2 PIN 無過期機制

### 6.3 無 JWT / Supabase Auth

## 7. 未來演進方向（暫不實作）

# NoWait Order — 資料模型 V1

> 狀態：（草稿中）｜版本：V1｜建立於 2026-04-03

---

## 1. 文件目的

## 2. 資料表總覽

## 3. stores 表

### 3.1 欄位定義

### 3.2 Constraints

### 3.3 RLS Policy

## 4. orders 表

### 4.1 欄位定義

### 4.2 items_json 結構

### 4.3 RLS Policy

## 5. menu 表

### 5.1 欄位定義

### 5.2 available 欄位行為說明

## 6. categories 表

### 6.1 欄位定義

### 6.2 與 menu.category 的關聯方式（字串對應，非 FK）

## 7. owner_auth 表

### 7.1 欄位定義

### 7.2 PIN 驗證機制說明

## 8. 表間關聯說明

### 8.1 目前模型（slug 字串關聯）

### 8.2 已知問題與注意事項

- menu 表 vs menu_items 表（歷史遺留說明）
- categories duplicate key 警告
- store_slug 字串型關聯，尚未使用 store_id FK

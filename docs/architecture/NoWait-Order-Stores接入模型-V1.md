# NoWait Order — Stores 接入模型 V1

> 狀態：（草稿中）｜版本：V1｜建立於 2026-04-03

---

## 1. 文件目的

## 2. 目前模型說明（slug 字串模型）

### 2.1 設計原則

### 2.2 storeSlug 流向

## 3. stores 表建立背景

### 3.1 建立時間與動機

### 3.2 初始資料

## 4. 各頁面 stores 接入狀態

| 頁面 | 接入狀態 | 用途 | 有無 validation |
|------|---------|------|----------------|
| /s/[storeSlug] | | | |
| /kitchen/[slug] | | | |
| /owner/[storeSlug] | | | |
| /owner/[storeSlug]/login | | | |
| /owner/[storeSlug]/orders | | | |

## 5. Validation 行為說明

### 5.1 /s/[storeSlug] validation 邏輯

### 5.2 /kitchen/[slug] validation 邏輯

### 5.3 owner dashboard 暫不做 validation 的理由

## 6. operating_status 欄位（預留）

### 6.1 欄位定義

### 6.2 目前未使用說明

### 6.3 TODO：未來接入點位置

## 7. 演進邊界（目前不做的事）

- store_id FK migration
- 多店管理後台
- store_slug → store_id 全面改寫

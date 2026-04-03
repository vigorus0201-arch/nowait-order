# NoWait Order — 訂單資料結構 V1

> 狀態：（草稿中）｜版本：V1｜建立於 2026-04-03

---

## 1. 文件目的

## 2. orders 表欄位完整定義

| 欄位名稱 | 型別 | 說明 | 必填 |
|---------|------|------|------|
| id | uuid | | |
| order_code | text | | |
| store_slug | text | | |
| customer_name | text | | |
| customer_phone | text | | |
| items_json | jsonb | | |
| subtotal | numeric | | |
| total_amount | numeric | | |
| status | text | | |
| source | text | | |
| table_num | text | | |
| bring_number | text | | |
| note | text | | |
| created_at | timestamptz | | |

## 3. order_code 格式說明

### 3.1 格式：YYYYMMDD-XXXX

### 3.2 產生邏輯（lib/generateOrderCode.ts）

### 3.3 每日重置規則

## 4. items_json 結構

```json
[
  {
    "id": "",
    "name": "",
    "price": 0,
    "qty": 0
  }
]
```

## 5. source 欄位值定義

| 值 | 說明 |
|----|------|
| dinein | |
| pickup | |
| pos | |

## 6. bring_number 欄位說明

### 6.1 欄位存在狀態

### 6.2 目前未使用說明

### 6.3 計畫用途（叫號顯示）

## 7. 訂單寫入位置對照

| 來源 | 寫入頁面 | source 值 |
|------|---------|----------|
| 顧客自助點餐 | /checkout | dinein / pickup |
| POS 代客點單 | /owner/[storeSlug]/pos | pos |

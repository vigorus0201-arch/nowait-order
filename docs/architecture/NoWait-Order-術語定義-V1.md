# NoWait Order — 術語定義 V1

> 狀態：（草稿中）｜版本：V1｜建立於 2026-04-03｜最後更新：2026-04-03

本文件定義 nowait-order 專案跨文件統一使用的術語，
避免文件間術語混用造成歧義。

---

## 1. 訂單識別相關

### order_code
- **定義**：系統流水號，格式 `YYYYMMDD-0001`
- **用途**：人可讀的訂單識別碼，顯示於 KDS、訂單管理、成功頁
- **來源**：`lib/generateOrderCode.ts` 產生
- **注意**：每日從 0001 重新計數，按 store_slug 隔離

### bring_number
- **定義**：叫號序號，格式 `D001`（內用）/ `P001`（外帶）
- **用途**：店家廣播叫號，顧客進度表顯示
- **來源**：orders 表欄位（已存在，部分頁面已有 queueDisplayNo 雛形）
- **注意**：命名尚未統一，建議未來正式化為 `queue_number`（見下方）

### queue_number
- **定義**：叫號序號的**正式術語**，為 `bring_number` 的未來統一名稱
- **格式**：`D001`（內用 Dine-in）/ `P001`（外帶 Pickup）
- **現況**：部分實作以 `queueDisplayNo` 命名，尚未全面統一
- **目標**：所有叫號相關欄位、UI 文字、文件術語統一使用此詞

### order_number
- **定義**：**不使用此詞**，統一以 `order_code` 指稱訂單識別碼

---

## 2. 訂單狀態相關

### status
- **定義**：orders 表的狀態欄位
- **值域**：`pending` / `preparing` / `completed` / `cancelled`
- **操作端**：KDS（Realtime）、Orders 管理頁（polling）
- **注意**：`success/page.tsx` TypeScript interface 目前仍用 `done`，與 KDS 實際值 `completed` 不一致，待統一

### progress
- **定義**：**顧客端對 status 的呈現層**，非獨立欄位
- **說明**：例：進度條、狀態文字（製作中、已完成）
- **現況**：tracking 頁已有部分實作，但 progress UI 尚未統一規範，與主流程的串接尚未完成

---

## 3. 顧客追蹤相關

### track
- **定義**：顧客主動查詢訂單進度的功能頁面
- **現況**：`tracking/page.tsx` 已存在雛形（每 3 秒 polling），但尚未正式整合進主流程（success page 尚未導向此頁）
- **未完成**：success → tracking 串接、假資料移除、顧客入口明確化

### queue
- **定義**：叫號系統整體概念，包含 queue_number 產生、KDS 操作、tracking 頁顯示與廣播
- **現況**：核心元素已部分存在（KDS、queueDisplayNo 雛形），但整體系統尚未正式化、各環節尚未完整串接

---

## 4. 入口模式相關

### Remote（店外 / 平台進入）
- **定義**：顧客不在店內，透過連結或平台進入點餐
- **URL 特徵**：`/s/[storeSlug]`（無 `mode=instore`）
- **聯絡資料**：姓名 + 電話必填

### In-store（店內掃碼進入）
- **定義**：顧客在店內掃描 QR Code 進入點餐
- **URL 特徵**：`/s/[storeSlug]?mode=instore`
- **聯絡資料**：姓名 + 電話選填

### isInstore（程式碼變數）
- **定義**：`urlMode === 'instore'` 的 boolean flag
- **影響**：checkout 頁聯絡資料必填 / 選填邏輯

---

## 5. 店家系統模組相關

### Dashboard
- 指 `/owner/[storeSlug]`，今日統計與 QR Code

### POS
- 指 `/owner/[storeSlug]/pos`，店員代客點餐介面

### Orders（後台訂單管理）
- 指 `/owner/[storeSlug]/orders`，與 KDS 並行的訂單操作頁

### KDS（Kitchen Display System）
- 指 `/kitchen/[slug]`，廚房即時顯示系統
- 獨立路由，非 owner 後台的一部分

### 顧客進度表
- 顧客端查看叫號與進度的頁面（計畫中，尚未實作）

# NoWait Now — 專案總覽

> 最後更新：2026/3/23

---

## 專案資訊

| 項目 | 內容 |
|------|------|
| 專案名稱 | NoWait Now |
| 網域 | https://nowaitnow.com |
| 本地路徑 | `/Users/vigorus/nowait-order/nowait-order` |
| GitHub | https://github.com/vigorus0201-arch/nowait-order |
| Supabase | `fkosreeciupmipkmagah.supabase.co` |
| 目前版本 | v1.0（2026/3/22 完成） |

---

## 啟動指令

```bash
cd /Users/vigorus/nowait-order/nowait-order
npm run dev

# 另開終端機啟動 Claude Code
claude
```

### 測試網址（本地）

| 頁面 | 網址 |
|------|------|
| 顧客點餐 | http://localhost:3000/s/chen-beef-noodle |
| 到店模式 | http://localhost:3000/s/chen-beef-noodle?mode=instore |
| 廚房顯示 | http://localhost:3000/kitchen/chen-beef-noodle |
| 老闆後台 | http://localhost:3000/owner/chen-beef-noodle/login |
| 後台 PIN | 8888 |

---

## 系統現況

| 功能 | 狀態 |
|------|------|
| 顧客點餐頁 | ✅ 完成 |
| 老闆後台 | ✅ 完成 |
| 廚房顯示頁 | ✅ 完成 |
| POS 系統 | ✅ 完成 |
| 訂單管理 | ✅ 完成 |
| 菜單管理 | ✅ 完成 |
| 手機版 | ✅ 完成 |
| Vercel 部署 | ✅ 2026/3/23 完成 |
| nowaitnow.com 綁定 | ✅ 2026/3/23 完成 |
| 主題系統（lib/themes.ts） | ✅ Dark Premium + Fresh Green |
| Line OA | ✅ 2026/3/23 建立（@727vcikq） |
| Make.com | ✅ 2026/3/23 註冊完成 |
| 推廣者系統 | 🔄 規劃完成，待開發 |

---

## 開發規範

- 每次修改前先做 checkpoint commit
- 手機版容器使用 `position: fixed`
- 底部加 `paddingBottom: 80px`
- 不在父容器設 `overflow: hidden`
- 主題顏色統一從 `lib/themes.ts` 取值，不 hardcode
- ⚠️ 寫程式前必須先列出完整流程與功能規格，經過確認後才開始實作

### payments 開發注意事項
- method 是付款方式（promoter_cash / bank_transfer / cash）
- status 是付款狀態（pending_cash / pending_bank / confirmed / cancelled）
- 兩個欄位不能混用，查詢時要用正確的欄位
- ❌ 錯誤：if (payment.method === 'pending_cash')
- ✅ 正確：if (payment.status === 'pending_cash')

### 推廣者系統開發提示（給 Claude Code）
每次開始開發推廣者系統前，在提示裡加上：
注意：payment.method 是付款方式，payment.status 是付款狀態，兩個不能混用

---

## 主題系統

檔案位置：`lib/themes.ts`

| 主題 ID | 名稱 | 適用對象 |
|---------|------|---------|
| `dark` | Dark Premium | 主 demo、高價感 |
| `warm` | Fresh Green | 便當店、小吃店 |

未來新增：Coffee / Bakery / Street Food

Supabase stores 表欄位：`theme_id`（預設 `'dark'`）

---

## Supabase 資料表（現有）

| 資料表 | 說明 |
|--------|------|
| `menu` | 菜單品項 |
| `orders` | 訂單 |
| `owner_auth` | 店主 PIN 碼 |
| `categories` | 分類管理（含 sort_order） |

---

## 環境變數（Vercel）

```
NEXT_PUBLIC_SUPABASE_URL=https://fkosreeciupmipkmagah.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（Supabase Settings > API > anon public）
SUPABASE_SERVICE_ROLE_KEY=（Supabase Settings > API > service_role）
```

---

## 推廣者與店家系統 V1 規劃

### 架構決策
- 同一個 Next.js 專案，路由分層
- `(marketing)` 區：官網 + 推廣者頁面
- `(app)` 區：店家系統（現有）

### 路由結構

| 路徑 | 說明 | 區域 |
|------|------|------|
| `/` | 官網 landing | marketing |
| `/promoter/apply` | 推廣者申請頁 | marketing |
| `/promoter/onboarding` | 推廣者導覽頁 | marketing |
| `/promoter/dashboard` | 推廣者後台 | marketing |
| `/owner/xxx` | 店家後台 | app（現有） |
| `/s/xxx` | 顧客點餐頁 | app（現有） |
| `/kitchen/xxx` | 廚房顯示頁 | app（現有） |

### 推廣者申請完整流程

**Step 1 — 填寫申請表**
- 姓名
- 手機
- Email
- 推廣動機

**Step 2 — 強制閱讀導覽頁**
- 系統介紹（NoWait Now 是什麼）
- 話術範本（怎麼跟老闆說）
- Demo 流程（怎麼展示）
- 收費方式（店家要付多少）
- 推廣怎麼賺錢（分潤說明）
- ✅ 勾選「我已了解並同意推廣規範」才能繼續

**Step 3 — 線上簽約**
- 分潤比例
- 付款條件（每月結算）
- 不得亂報價
- 不得冒用品牌
- PDF + 勾選同意

**Step 4 — 取得推廣資格**
- 系統產生專屬推廣連結：`nowaitnow.com/signup?ref=ABC123`
- 店家透過此連結申請，自動綁定 promoter_id

**Step 5 — 身分資料（第一筆分潤時才收）**
- 身分證
- 銀行帳號

### 店家申請完整流程

**Step 1 — 推廣者帶入**
- 推廣者分享專屬連結給店家
- 店家填寫申請表，promoter_id 自動記錄

**Step 2 — 免費試用 7 天**
- 試用期間完整功能開放
- 試用到期提醒付費

**Step 3 — 付款（見付款方式說明）**

**Step 4 — 公司確認後開通正式使用權限**

**Step 5 — 使用滿 30 天無退款 → 發放分潤**

### 店家來源分流

| 來源 | promoter_id | 定價 | 分潤 |
|------|------------|------|------|
| 推廣者帶來 | 有 | 正常價格 | ✅ 有分潤 |
| 自然客（自己來） | null | 7折優惠 | ❌ 無分潤 |

### 付款方式說明

**1. promoter_cash（推廣者代收現金）**
```
店家 → 現金給推廣者
→ 推廣者在系統登記收款（status: pending_cash）
→ 48小時內繳回公司
→ 公司確認後開通
```
適用：推廣者帶來的店家

**2. bank_transfer（店家自己匯款）**
```
店家 → 公司銀行帳戶（匯款）
→ 店家上傳匯款截圖
→ 公司確認後開通
```
適用：推廣者帶來或自然客都可

**3. cash（直接現金給公司）**
```
店家 → 現金直接交給公司
→ 公司確認後開通
```
適用：自然客或公司親自收款

> ⚠️ 系統未確認收款前，不開通任何服務

### 金流原則

```
標準流程：
店家 → 公司帳戶 → 系統開通 → 30天後 → 推廣者分潤

現金（推廣者代收）：
店家 → 推廣者 → 48hr內繳回公司 → 公司確認 → 系統開通 → 30天後 → 推廣者分潤
```

> ❌ 錢不可以停在推廣者手上超過 48 小時

### 新增資料表規格

**promoters（推廣者）**
```
- id
- name（姓名）
- phone（手機）
- email
- ref_code（唯一推廣碼，系統自動產生）
- status（pending / approved）
- bank_account（第一筆分潤時填）
- id_verified（第一筆分潤時填，boolean）
- created_at
```

**payments（付款記錄）**
```
- id
- store_id
- promoter_id（nullable，自然客為空）
- amount（金額）
- method（付款方式）：
    - promoter_cash：店家付現給推廣者，推廣者 48hr 內繳回公司
    - bank_transfer：店家匯款至公司銀行帳戶，上傳匯款證明
    - cash：店家直接現金交給公司
- status（付款狀態）：
    - pending_cash：推廣者代收現金，公司尚未確認
    - pending_bank：店家已匯款，公司尚未確認
    - confirmed：公司已確認收款
    - cancelled：已取消
- proof_url（匯款截圖或現金照片）
- created_at
```

**commissions（分潤記錄）**
```
- id
- promoter_id
- store_id
- amount（分潤金額）
- status（分潤狀態）：
    - pending：等待中（未滿 30 天）
    - payable：可發放（滿 30 天無退款）
    - paid：已發放
- created_at
- paid_at（實際發放時間）
```

**stores 新增欄位**
```
- promoter_id（nullable，關聯推廣者）
- price_type（normal / discount）
```

### 開發順序
1. `promoters` table（Supabase 建立）
2. `/promoter/apply` 推廣者申請頁面
3. `ref_code` 機制（自動產生唯一推廣碼）
4. 店家申請頁（帶 ref 參數自動綁定）
5. 付款登記功能
6. 管理員後台（審核推廣者、確認付款、開通店家）
7. 分潤計算與發放

> ❌ 不要先做金流 UI 和推廣者 dashboard

---

## 使用工具完整記錄

### 開發與部署

**GitHub** — `github.com/vigorus0201-arch/nowait-order`
- 功能：程式碼版本控管、雲端備份
- 2026/3/22：建立專案，推送 v1.0，共 12 個 commits
- 2026/3/23：Vercel 部署時從此 repo 匯入

**Supabase** — `fkosreeciupmipkmagah.supabase.co`
- 功能：雲端資料庫
- 2026/3/22：建立所有資料表，設定 RLS 權限
- 2026/3/23：anon key 填入 Vercel 環境變數

**Vercel** — `vercel.com`
- 功能：Next.js 部署平台，GitHub 推送自動更新
- 方案：Pro Trial（14天免費）
- 試用開始：2026/3/23
- 試用到期：2026/4/6
- 到期後費用：$20/月
- 2026/3/23 15:40：GitHub 授權，匯入專案
- 2026/3/23 16:00：部署成功，系統正式上線
- 2026/3/23 16:09：綁定 nowaitnow.com，SSL 完成

### 網域與安全

**Cloudflare** — `cloudflare.com`（帳號：vigorus.0201@gmail.com）
- 功能：網域購買、DNS 管理、DDoS 防護
- 2026/3/18 22:30：與 Joba 在勝利早點，透過 ChatGPT 協助申請 nowaitnow.com
- 2026/3/23 16:07：新增 A record + CNAME，指向 Vercel

**DNS 記錄**
| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | @ | 76.76.21.21 | DNS only |
| CNAME | www | e8be52e43cfcc2f5.vercel-dns-017.com | DNS only |

### 通訊與推廣

**Line OA** — `manager.line.biz`
- 帳號名稱：NoWait Now
- 基本 ID：@727vcikq
- 業種：企業、組織・網路、軟體
- 方案：輕用量（免費，200則/月）
- 2026/3/23：建立完成

**Make.com** — `make.com`
- 帳號：vigorus.0201@gmail.com
- 方案：Free（1,000次/月）
- 建立日期：2026/3/23
- 重置日：2026/4/23
- 用途：自動化串接（Line OA + Supabase + Gmail）

### AI 工具

**Claude.ai + Claude Code** — 主力開發 AI
- 方案：Pro 年繳，US$200.00
- 購買日期：2026/3/21
- 自動續約：2027/3/21
- 付款：Visa 末四碼 0206
- 2026/3/22：完成所有頁面開發與手機版修復
- 2026/3/23：主題系統設計、Vercel 部署全流程、推廣者系統規劃

**ChatGPT** — 輔助 AI
- 2026/3/18：協助 Cloudflare 網域申請

**Google Gemini** — 輔助 AI
- 持續使用：協助分析 NoWait AI 組織架構，定義 8 個 AI 角色

**NotebookLM** — `notebooklm.google.com`
- 存放 NoWait Now V1.1 全方位營運戰略執行計劃書

### 辦公工具

**Microsoft 365** — `office.com`
- Excel 分潤計算、OneDrive 文件備份、Outlook 郵件
- 分潤計算模板待建立

---

## 待辦清單

### ✅ 已完成（2026/3/23）
- [x] Vercel 部署上線
- [x] nowaitnow.com 綁定 + SSL
- [x] README.md 建立推上 GitHub
- [x] Line OA 建立（@727vcikq）
- [x] Make.com 註冊完成
- [x] 推廣者系統 V1 規劃完成

### 🔴 本週立刻做
- [ ] 推廣者系統 V1 開發（照開發順序進行）
- [ ] 主題系統接進點餐頁（useTheme hook）
- [ ] 安全性：Cloudflare 2FA、Supabase RLS 確認、所有帳號雙重驗證

### 🟡 本週內完成
- [ ] Coffee / Street Food 主題設計
- [ ] Admin 後台（店家審核、付款確認、開通管理）
- [ ] 考慮購買 1Password（$3/月）

### 🟢 M1 一個月內
- [ ] nowaitnow.com 行銷官網（landing page）
- [ ] 推廣者導覽頁內容撰寫
- [ ] Line OA 自動回覆設定
- [ ] Make.com 串接 Supabase 新訂單通知
- [ ] Excel 分潤計算模板
- [ ] Logo 品牌系統套用

### 🔵 M2 以後
- [ ] AI 機器人分工體系（CEO / 業務 / 客服 / 財務 / 推廣 / GitHub AI）
- [ ] 各平台建置（Facebook / Instagram / TikTok / Product Hunt）
- [ ] 工具升級（Vercel Pro / Supabase Pro）

---

## 如何使用此文件

每次開新 Claude 對話，把這份 README.md 內容貼給 Claude，即可無縫繼續。

Claude Code 開啟時也可以直接讀取：
```bash
claude "請讀取 README.md 了解專案背景"
```

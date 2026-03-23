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
| Line OA | ❌ 待建立 |
| Make.com 自動化 | ❌ 待建立 |

---

## 開發規範

- 每次修改前先做 checkpoint commit
- 手機版容器使用 `position: fixed`
- 底部加 `paddingBottom: 80px`
- 不在父容器設 `overflow: hidden`
- 主題顏色統一從 `lib/themes.ts` 取值，不 hardcode

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

## Supabase 資料表

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
- 2026/3/23 15:40：GitHub 授權，匯入專案
- 2026/3/23 16:00：部署成功，系統正式上線
- 2026/3/23 16:09：綁定 nowaitnow.com，SSL 完成
- 方案：Pro Trial（14天免費）
- 試用開始：2026/3/23
- 試用到期：2026/4/6
- 到期後費用：$20/月
- 備註：商業用途需維持 Pro 方案

### 網域與安全

**Cloudflare** — `cloudflare.com`（帳號：vigorus.0201@gmail.com）
- 功能：網域購買、DNS 管理、DDoS 防護
- 2026/3/18 22:30：與 Joba 在勝利早點，透過 ChatGPT 協助申請 nowaitnow.com
- 2026/3/23 16:07：新增 A record（76.76.21.21）+ CNAME，指向 Vercel

**DNS 記錄**
| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | @ | 76.76.21.21 | DNS only |
| CNAME | www | e8be52e43cfcc2f5.vercel-dns-017.com | DNS only |

### AI 工具

**Claude.ai + Claude Code** — 主力開發 AI
- 2026/3/22：完成所有頁面開發與手機版修復
- 2026/3/23：主題系統設計、Vercel 部署全流程協助

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

### 🔴 本週立刻做

- [ ] Line OA 建立（account.line.biz）→ 建立「NoWait Now」官方帳號
- [ ] Make.com 註冊（make.com）→ 自動化基礎

### 🟡 本週內完成

- [ ] 主題系統接進點餐頁（useTheme hook）
- [ ] Coffee / Street Food 主題設計
- [ ] 安全性：Cloudflare 2FA、Supabase RLS 確認、所有帳號雙重驗證
- [ ] 考慮購買 1Password（$3/月）

### 🟢 M1 一個月內

- [ ] nowaitnow.com 行銷官網
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

每次開新 Claude 對話，把這份 README.md 內容貼給 Claude，
即可無縫繼續，不需要重新說明背景。

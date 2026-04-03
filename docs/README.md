NoWait Order — 文件總索引（V1）

一、文件定位
本文件為 NoWait Order 文件系統入口（Single Source of Truth）。
用途：
* 定義整體文件架構
* 指引閱讀順序
* 控制開發流程（Docs → Spec → Code）
* 避免系統邏輯混亂

二、文件結構總覽
docs/
├── README.md
├── project/
├── architecture/
├── flows/
└── admin/

三、閱讀順序（必須遵守）
任何開發或修改前，請依序閱讀：
Step 1（最高優先）
1. README.md（本文件）
Step 2（系統核心）
1. architecture/NoWait-Order-系統架構-V1.md
2. architecture/NoWait-Order-資料模型-V1.md
3. architecture/NoWait-Order-術語定義-V1.md
Step 3（產品邏輯）
1. architecture/NoWait-Order-顧客身份與入口模型-V1.md
2. flows/顧客入口與點餐情境流程-V1.md
3. flows/結帳與訂單成立流程-V1.md
Step 4（營運核心）
1. flows/店家主控系統功能分層-V1.md
2. flows/廚房接單與叫號流程-V1.md
Step 5（延伸）
1. flows/顧客進度表與叫號系統-V1.md
2. admin/*
3. project/*

四、文件分類與用途

📁 project/
商業與產品戰略層（非技術）
文件    用途    優先
主控策略計畫書    產品定位、商業模式    P1
📁 architecture/
系統定義層（不可隨意更改）
文件    用途    優先
系統架構    路由、模組關係    P0
資料模型    DB 結構、關聯    P0
驗證機制    owner_auth、PIN、localStorage    P0
Stores接入模型    stores 表與系統關係    P0
顧客身份與入口模型    店內 / 店外 / 平台進入邏輯    P0
訂單狀態流轉    status 狀態圖    P0
訂單資料結構    orders 表細節    P0
術語定義    order_code / queue / progress 等    P0
📁 flows/
行為與流程（用戶與系統互動）
文件    用途    優先
顧客入口與點餐情境流程    店內 / 店外 / 平台流程    P0
結帳與訂單成立流程    checkout + orders 寫入    P0
店家主控系統功能分層    Dashboard / POS / Orders / KDS    P0
廚房接單與叫號流程    KDS 狀態與操作    P1
顧客進度表與叫號系統    顧客查看 queue 邏輯    P1
Owner登入與後台流程    PIN 登入與後台    P1
📁 admin/
規格文件（Spec，不是流程）
文件    用途    優先
Owner-後台總覽規格    後台模組規格    P1
Owner-訂單管理規格    Orders UI / 操作    P1
KDS-廚房顯示系統規格    廚房系統（Realtime / 音效）    P1
五、P0 / P1 定義
🔴 P0（必讀）
影響整個系統邏輯：
* architecture/*
* flows（核心三份）
* README
👉 未讀不得改 code

🟡 P1（延伸）
功能優化 / 補充：
* admin/*
* project/*
* tracking / KDS 細節

六、核心設計原則（非常重要）
1️⃣ 顧客不是看訂單，而是看叫號
orders → KDS → queue → 顧客

2️⃣ queue 是系統，不是欄位（核心邏輯已驗證原型，待正式化整合）
包含：
* queue_number（D001 / P001）
* KDS
* tracking
* progress
注意：tracking 頁與 queue_number 寫入尚未正式整合進主流程

3️⃣ status ≠ progress
層級    用途
status    系統狀態（DB）
progress    顧客顯示（UI）
4️⃣ storeSlug 為核心識別（現階段）
* 所有流程以 storeSlug 為主
* 暫不全面轉 store_id

5️⃣ 文件優先於程式
順序：
Docs → Spec → Code

七、開發規則（強制）
禁止事項
* ❌ 未讀 docs 直接改 code
* ❌ 自行改資料模型
* ❌ 重寫既有流程
* ❌ 修改核心術語（order_code / queue / status）

必須遵守
每次任務必須：
1. 盤點現況
2. 對照 docs
3. 提出最小修改方案
4. 再動 code

八、目前系統狀態（2026）
已完成
* 點餐流程
* checkout
* orders
* KDS
* Owner 後台
* POS
未完成（重要）
* tracking 正式化
* queue_number 寫入統一
* progress UI
* stores 完整整合

九、當前目標
👉 完成第一家店真實營運
在此之前：
所有功能都只是驗證

NoWait Order 文件系統 V1

# Antigravity × Matt Pocock Engineering Skills 實戰：agy-doctor

[![CI](https://img.shields.io/badge/tests-17%20passed-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)]()
[![Vitest](https://img.shields.io/badge/runner-Vitest-yellow.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

本專案是 **Google Antigravity CLI** 搭配 **Matt Pocock AI 軟體工程技能體系** 的端到端實戰示範靶場。

我們透過完整的 AI Staff Engineer 方法論（從需求探索、領域建模、規格制定、工單拆解到 TDD 測試驅動開發），從零打造出了一款專為 Antigravity 生態設計的開源診斷 CLI 工具：`agy-doctor`。

---

## 🩺 成果展示：agy-doctor CLI

`agy-doctor` 是一款專案就緒與健康檢查工具（Agent-Readiness Checker），能一鍵掃描任何專案是否具備與 AI Agent 高效協作的必要設定。

### 快速開始

```bash
# 診斷當前專案
node bin/agy-doctor.js

# 診斷指定專案路徑
node bin/agy-doctor.js /path/to/project

# 輸出機器可讀 JSON 格式（適合 Agent 或 CI/CD 消費）
node bin/agy-doctor.js --json

# 嚴格模式（若存在任何 Warning 或 Fail 即以非零狀態碼退出）
node bin/agy-doctor.js --strict
```

### 診斷維度與規則清單

| 維度 (Dimension) | 規則 ID | 檢查內容 | 預期修復建議 (Remediation) |
| :--- | :--- | :--- | :--- |
| **Rule** | `rule-agent-doc` | 根目錄是否存在 `AGENTS.md` 或 `CLAUDE.md` | 提供範例結構指引 |
| **Rule** | `rule-agent-skills` | 是否包含 `## Agent skills` 設定區塊 | 提示執行 `/setup-matt-pocock-skills` |
| **Domain** | `domain-glossary` | 根目錄是否存在 `GLOSSARY.md` | 提示建立領域詞彙表，避免術語漂移 |
| **Domain** | `domain-adr` | `docs/adr/` 是否記錄重大架構決策 | 提示記錄關鍵架構權衡 |
| **Workflow** | `workflow-git-remote` | 是否已關聯 Git Remote Origin | 提示執行 `git remote add origin` |
| **Workflow** | `workflow-gh-auth` | GitHub CLI (`gh`) 是否已登入認證 | 提示執行 `gh auth login` |
| **Workflow** | `workflow-triage-labels` | 是否具備 5 個標準分流標籤 | 自動產出對應的 `gh label create` 指令 |

---

## 🥋 Matt Pocock AI 軟體工程生命週期實戰

本專案嚴格貫徹了 Matt Pocock 的工程技能管線：

```
[Idea / 需求]
    │
    ▼
1. /grilling ──► 決策樹收斂、邊界條件壓力測試（Round 1 & Round 2）
    │
    ▼
2. /domain-modeling ──► 建立 GLOSSARY.md 與 ADR-0001（深模組無副作用架構）
    │
    ▼
3. /to-spec ──► 最高測試縫隙定義（Testing Seams）與規格發布（Issue #1）
    │
    ▼
4. /to-tickets ──► 垂直示蹤彈切片拆解與 GitHub 原生 Blocked-by 鏈結（#2 ~ #6）
    │
    ▼
5. /tdd ──► 紅燈 ➜ 綠燈 ➜ 重構循環，17 項測試全數通過，循序推移前沿
    │
    ▼
[生產就緒的 agy-doctor CLI 工具]
```

### 專案結構

```
matt-with-tonny/
├── AGENTS.md                  # Agent 協作規範與技能索引
├── GLOSSARY.md                # 領域模型詞彙表
├── docs/
│   ├── adr/
│   │   └── 0001-pure-context-rule-engine.md # ADR 決策：純上下文與無副作用規則引擎
│   └── agents/
│       ├── issue-tracker.md   # GitHub Issues 追蹤規範
│       ├── triage-labels.md   # 5 個標準分流角色對應
│       └── domain.md          # 領域文件讀取協議
├── bin/
│   └── agy-doctor.js          # CLI 執行檔入口
├── src/
│   ├── index.ts               # 診斷核心引擎與最高測試縫隙 runDiagnosis
│   ├── types.ts               # 純領域資料型別定義
│   ├── collector.ts           # 實體環境採集器（無副作用 ProjectContext 產生器）
│   ├── cli.ts                 # CLI 參數解析與執行流程
│   ├── rules/                 # 純規則集（100% 可單元測試）
│   │   ├── rule-readiness.ts
│   │   ├── domain-readiness.ts
│   │   └── workflow-readiness.ts
│   └── reporters/             # 彩色終端與 JSON 報表器
└── tests/                     # 17 項單元測試與端到端測試
```

---

## 🧪 執行測試

```bash
# 執行所有單元與整合測試
npm test

# 監聽模式
npm run test:watch

# 建置 TypeScript
npm run build
```

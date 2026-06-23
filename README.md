# B2B Outbound Agent

基于 LangGraph 的 B2B 外贸获客 Agent 全栈系统，面向中小外贸企业的真实 outbound 场景。

输入一个目标公司域名，系统自动完成：公司调研 → ICP 分类 → 联系人挖掘与邮箱验证 → 个性化邮件草稿生成 → 意向评分 → 销售交接报告。所有外部 API（Apollo、Findymail、LLM）均有 mock/启发式降级，无 key 也可完整跑通。

## 产品定位

当前是一个**单目标公司 enrichment + outreach MVP**：输入一个目标公司域名，系统围绕该公司完成研究、分类、联系人挖掘、邮件生成和销售交接。

面向中小外贸企业真实上线时，产品目标是升级为 **AI outbound copilot**：

```text
Seller Profile + ICP Definition + Market Filters
    └─► Prospect Company Discovery
            └─► Company Fit Scoring
                    └─► Persona Recommendation
                            └─► Contact Sourcing (Apollo)
                                    └─► Email Verification (Findymail)
                                            └─► Outreach Draft Generation (LLM)
                                                    └─► Human Review Gate
                                                            └─► Export / Send
```

## 当前已实现能力

- Campaign / Account / Run 完整数据模型与 CRUD API
- 10 步单账户 workflow 端到端跑通（含降级全链路）
- Apollo.io 公司搜索 + 联系人搜索（需要 People Search 权限，无权限自动降级并记录原因）
- Findymail 邮箱补全 + 验证（Bearer Token，mock 联系人自动跳过验证）
- DeepSeek / OpenAI / Anthropic LLM 可切换，无 key 启发式降级
- 前端账户列表页（intent 色标、ICP 标签、一键触发 workflow）+ Run 详情步骤页


## 技术栈

| 层次 | 技术 |
|------|------|
| Workflow 引擎 | LangGraph `StateGraph` |
| 后端 API | FastAPI + SQLAlchemy 2.0 + Alembic |
| 数据库 | PostgreSQL 16 + Redis 7 |
| 前端 | React 19 + TypeScript + Ant Design v5 + Vite |
| 容器化 | Docker Compose |

## Workflow 节点（10 步全链路）

```
account_intake
    └─► company_research
            └─► icp_classification
                    └─► contact_persona_recommendation
                                └─► contact_sourcing
                                        └─► email_verification
                                                └─► outreach_strategy
                                                        └─► quality_judge
                                                                └─► intent_scoring
                                                                        └─► sales_handoff
```

| # | 节点 | 说明 | 降级策略 |
|---|------|------|---------|
| 1 | `account_intake` | 账户信息写入 state | — |
| 2 | `company_research` | LLM 公司画像生成 | 无 LLM key → 通用摘要模板 |
| 3 | `icp_classification` | LLM JSON 分类（行业/规模/画像） | 无 key → 关键词启发式 |
| 4 | `contact_persona_recommendation` | 按 ICP 推荐目标职位 persona | — |
| 5 | `contact_sourcing` | Apollo.io People Search API | 无权限 → mock 联系人，降级原因记录在 step output |
| 6 | `email_verification` | Findymail 验证真实邮箱；mock 联系人跳过验证直接标 `mock` | 无 key → 启发式格式校验 |
| 7 | `outreach_strategy` | LLM 个性化冷邮件 subject/body/follow-up | 无 key → 固定模板 |
| 8 | `quality_judge` | 启发式规则评估邮件质量（0–100 分） | — |
| 9 | `intent_scoring` | ICP 置信度 × 验证联系人数 → hot/warm/cold | — |
| 10 | `sales_handoff` | 生成结构化销售交接摘要 | — |


## 环境变量

复制 `.env` 并填写你自己的 key：

```env
# LLM — 选一个提供商，推荐 DeepSeek（兼容 OpenAI SDK，成本低）
LLM_PROVIDER=deepseek           # anthropic / openai / deepseek
DEEPSEEK_API_KEY=               # https://platform.deepseek.com/api_keys
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

OPENAI_API_KEY=                 # 可选，LLM_PROVIDER=openai 时生效
ANTHROPIC_API_KEY=              # 可选，LLM_PROVIDER=anthropic 时生效

# 联系人挖掘
APOLLO_API_KEY=                 # https://app.apollo.io/#/settings/integrations/api
                                # 需要开通 People Search 权限（Basic 套餐以上）

# 邮箱验证与补全
FINDYMAIL_API_KEY=              # https://findymail.com/

# 网页搜索上下文（可选）
TAVILY_API_KEY=                 # https://app.tavily.com/
```

所有 key 均为可选，缺失时系统自动降级：
- 无 LLM key → 启发式分类 + 固定邮件模板
- 无 Apollo key / 无 People Search 权限 → mock 联系人（降级原因写入 run step output）
- 无 Findymail key → 启发式邮箱格式校验

## 数据模型

### 当前模型

| 实体 | 说明 |
|------|------|
| `accounts` | 当前表示单个目标公司/潜在线索公司 |
| `agent_runs` | 每次 workflow 执行记录 |
| `agent_run_steps` | 10 个节点的输入输出 JSON 日志 |
| `contacts` | 挖掘到的联系人（含验证状态） |
| `outreach_sequences` | 生成的邮件序列（含质量分） |

### 商用版本建议模型

为了真正给中小外贸企业上线使用，建议逐步演进为：

| 实体 | 建议作用 |
|------|----------|
| `workspaces` | 企业/团队隔离，多租户基础 |
| `campaigns` | 一次获客任务，保存卖方公司画像、ICP、地区、行业、关键词 |
| `prospect_accounts` | 从 Apollo / 搜索渠道发现的潜在客户公司 |
| `contacts` | 每个潜客公司的联系人 |
| `outreach_sequences` | 给联系人生成的邮件草稿 / 发送记录 |
| `review_queue` | 人工审核状态（drafted / reviewed / approved / rejected / sent） |

当前代码中的 `accounts` 在后续可以自然演进成 `prospect_accounts`。

## 目录结构

```text
├── backend/
│   ├── alembic/versions/          # 4 条迁移（0001-0004）
│   └── app/
│       ├── agents/
│       │   ├── graph/
│       │   │   ├── builder.py     # LangGraph StateGraph 组装
│       │   │   ├── state.py       # WorkflowState TypedDict
│       │   │   └── nodes/         # 10 个节点文件
│       │   └── services/          # 各节点业务逻辑 + WorkflowRunner
│       ├── api/routes/            # accounts / agent_runs / contacts
│       └── db/
│           ├── models/            # Account / AgentRun / AgentRunStep / Contact / OutreachSequence
│           ├── repositories/      # AccountRepository / AgentRunRepository
│           └── schemas/           # Pydantic v2 读写 schema
├── frontend/
│   └── src/
│       ├── api/client.ts          # 类型化 fetch 封装
│       ├── types.ts               # TypeScript 接口
│       ├── pages/
│       │   ├── AccountListPage.tsx  # 账户列表 + 触发 workflow + 意向看板
│       │   └── RunDetailPage.tsx    # Run 步骤详情 + 输出 JSON
│       └── App.tsx                # React Router + Ant Design Layout
├── infra/                         # Postgres init SQL
├── docs/                          # 设计文档
├── mock_data/                     # 测试数据
└── docker-compose.yml
```

## 数据库表

| 表 | 说明 |
|----|------|
| `accounts` | 目标公司，含 ICP、意向分、销售交接摘要 |
| `agent_runs` | 每次 workflow 执行记录 |
| `agent_run_steps` | 10 个节点的输入输出 JSON 日志 |
| `contacts` | 挖掘到的联系人（含验证状态） |
| `outreach_sequences` | 生成的邮件序列（含质量分） |

## API 路由（当前实现）

```
GET    /api/health
GET    /api/accounts
POST   /api/accounts
GET    /api/accounts/{id}
POST   /api/accounts/{id}/run          # 触发 workflow
GET    /api/accounts/{id}/runs         # 该账户的历史 run
GET    /api/accounts/{id}/contacts
GET    /api/accounts/{id}/outreach
GET    /api/runs
GET    /api/runs/{id}                  # 含 steps 详情
```

## 快速启动

### 前置条件

- Docker + Docker Compose

### 启动全部服务

```bash
docker compose up --build
```

首次启动会自动执行 Alembic 迁移（`alembic upgrade head`）。

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5173 |
| 后端 API | http://localhost:8000 |
| 健康检查 | http://localhost:8000/api/health |
| API 文档 | http://localhost:8000/docs |

### 本地开发（不用 Docker）

```bash
# 后端
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
```

前端 `/api` 请求通过 Vite proxy 转发到 `http://backend:8000`（Docker 内）或自行修改 `vite.config.ts` 指向 `http://localhost:8000`。

## 使用流程（当前 MVP）

1. 打开 `http://localhost:5173`，页面展示潜在线索公司列表
2. 通过 API 先创建一个测试账户（当前仍以 `account` 为入口），或直接对已有账户点击 **Run workflow**
3. Workflow 同步执行，围绕单个目标公司完成调研、ICP 分类、联系人挖掘、邮件草稿生成、意向评分和销售交接
4. 详情页展示 10 个节点的执行状态和输出 JSON
5. 列表页展示每个线索公司的 intent 标签和 sales handoff 摘要

## 商用版本目标流程

1. 创建 `Campaign`，填写卖方公司画像、目标 ICP、行业/地区/关键词/公司规模等条件
2. 系统从 Apollo、搜索渠道和后续更多数据源中批量发现潜在客户公司
3. 对潜客公司做匹配评分，筛出高优先级 prospect accounts
4. 为高分公司挖掘联系人并生成个性化邮件草稿
5. 进入人工审核队列，人工决定 `approved / rejected / export / send`
6. 审核通过后导出到 CRM，或直接通过邮件服务商发送并追踪状态

## 快速创建测试账户

```bash
curl -X POST http://localhost:8000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Acme Auto Parts", "domain": "acmeauto.com", "source": "manual"}'
```

## 实现阶段

| Phase | 内容 |
|-------|------|
| Phase 1 | 项目骨架、Docker Compose、FastAPI health endpoint |
| Phase 2 | SQLAlchemy 模型、Alembic 迁移、Account / Campaign CRUD API |
| Phase 3 | LangGraph StateGraph、company_research、icp_classification 节点、AgentRun 持久化 |
| Phase 4 | persona_recommendation、contact_sourcing、email_verification、outreach_strategy、quality_judge 节点；contacts / outreach_sequences 表 |
| Phase 5 | intent_scoring、sales_handoff 节点；前端 React Router + AccountListPage + RunDetailPage；typed API client |
| Phase 6 | 真实 LLM（DeepSeek/OpenAI/Anthropic）、Apollo.io 联系人 API、Findymail 邮箱补全与验证；所有节点 mock → 实现，无 key 自动降级；contact_sourcing_meta 记录降级原因；email verification 对 mock 联系人智能跳过 |

> Phase 1–6 是”单账户线索 enrichment + outreach”MVP；从 Phase 7 开始，系统将演进为”卖方画像驱动的批量潜客发现与人工审核 outbound 平台”。

## 后续规划

### Phase 7 — Prospect Discovery + Fit Scoring

从“单个目标公司处理”升级为“批量潜客发现”：

- 新增 `campaigns` 入口，保存卖方公司画像、目标 ICP、市场筛选条件
- 接入 Apollo Organization Search / Search API，先发现潜在客户公司，而不是直接输入单个公司
- 新增 `prospect discovery` 和 `fit scoring` 节点，对潜客公司做批量匹配评分
- `accounts` 演进为 prospect pool，支持按 fit score 排序和筛选

---

### Phase 8 — Human Review Queue + Frontend Expansion

围绕人工审核机制补齐前端和状态流：

- 新增 Campaign 创建页
- 新增 Prospect 公司池列表页（筛选、搜索、批量操作）
- 新增 Review Queue 页面，支持 `drafted / reviewed / approved / rejected`
- 账户创建不再主要依赖 curl，前端补齐完整 CRUD 和审核操作

---

### Phase 9 — Email Sending + CRM Export

让审核通过的结果真正进入业务动作：

- 集成 SendGrid 或 Mailgun 发送 `outreach_sequences`
- 支持导出 CSV / HubSpot / Pipedrive / Salesforce
- `outreach_sequences` 增加 `sent_at`、`opened_at`、`replied_at`、`status`
- Webhook 回写打开、点击、回复事件，用于后续 scoring 和复投

---

### Phase 10 — Production Readiness

面向中小外贸企业真实上线的工程化能力：

- 多租户：`workspace / team / member` 数据隔离
- 认证授权：JWT / RBAC
- 异步任务：Celery + Redis，支持批量任务、重试、失败恢复
- 可观测性：Prometheus / Grafana / Sentry
- 配额与计费：按 campaign、联系人数、发送量计费
- 合规与审计：人工审核日志、发送审计、数据隐私与退订机制

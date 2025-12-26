# OpenBrain 数据库期末实践项目开发规格说明书

项目名称：OpenBrain (校园知识索引平台)
开发周期：1-2 周 (晚间开发)
核心架构：SvelteKit (App) + OpenGauss (DB) + LLM API (AI Copilot)
设计哲学：
1. 轻量化：数据库不存储任何实体文件（PDF/Doc），仅存储资源链接（URL）
2. 智能化：引入 AI 辅助录入，用户上传临时文件，AI 生成高质量摘要存入数据库，以此利用 OpenGauss 强大的全文检索功能
3. 数据驱动：充分展示数据库高级特性（JSONB、GIN 索引、触发器、执行计划）

---

## 1. 数据库设计 (Database Design)

本部分设计包含 6 张表。请在 OpenGauss (`gsql` 或 DBeaver) 中按顺序执行

### 1.1 表结构定义

```sql
-- 1. 用户表 (Users) - 基础鉴权
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(64) NOT NULL,       -- 存放 SHA256 哈希值
    student_id    VARCHAR(20),                -- 学号
    role          VARCHAR(10) DEFAULT 'user', -- 'admin' / 'user'
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 课程/分类表 (Courses) - 维度数据
CREATE TABLE courses (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) NOT NULL, -- 例: CS101
    name        VARCHAR(100) NOT NULL,
    teacher     VARCHAR(50),
    department  VARCHAR(50)
);
-- 预制数据
INSERT INTO courses (code, name, teacher, department) VALUES 
('CS001', '数据库系统原理', '王老师', '计算机学院'),
('MATH01', '高等数学(上)', '李老师', '理学院'),
('ENG101', '大学英语', '张老师', '外语学院');

-- 3. 资源主表 (Resources) - 核心业务
-- 策略：只存链接，文件内容的精髓通过 content_detail (摘要) 体现
CREATE TABLE resources (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    course_id       INT NOT NULL REFERENCES courses(id),
    
    title           VARCHAR(200) NOT NULL,
    
    -- 【核心搜索字段】由用户手写或 AI 基于文件生成
    content_detail  TEXT NOT NULL,         
    
    -- 【资源定位】
    source_type     VARCHAR(20) DEFAULT 'link', -- 扩展预留
    resource_url    TEXT NOT NULL,              -- 实际的网盘/Github/网页链接
    
    -- 【元数据 (JSONB)】
    -- 存放: { "has_ai_summary": true, "file_type": "pdf", "pages": 20, "domain": "pan.baidu.com" }
    meta_info       JSONB DEFAULT '{}'::jsonb, 
    
    -- 【OpenGauss 全文检索向量】
    tsv_content     TSVECTOR,
    
    view_count      INT DEFAULT 0,
    download_count  INT DEFAULT 0,  -- 点击链接跳转次数
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 标签关联表 (Resource_Tags) - 多对多分类
CREATE TABLE resource_tags (
    resource_id BIGINT REFERENCES resources(id) ON DELETE CASCADE,
    tag_name    VARCHAR(30) NOT NULL,
    PRIMARY KEY (resource_id, tag_name)
);

-- 5. 评论表 (Comments) - 用户互动
CREATE TABLE comments (
    id          BIGSERIAL PRIMARY KEY,
    resource_id BIGINT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL,
    rating      INT CHECK (rating >= 1 AND rating <= 5),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 行为日志表 (Action_Logs) - 审计与统计
CREATE TABLE action_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id),  -- 可为空（游客）
    action_type VARCHAR(20) NOT NULL,         -- 'SEARCH', 'CLICK_LINK', 'AI_GENERATE'
    target_id   BIGINT,                       -- 关联 resources.id
    payload     TEXT,                         -- 记录搜索词 或 AI生成时的文件名
    ip_addr     INET,                         -- OpenGauss 特有 IP 类型
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 高级数据库对象 (自动化与性能)

A. 智能权重触发器
- 逻辑：当资源插入/更新时，自动更新 `tsv_content`。且给予 `title` A级权重(最高)，`content_detail` B级权重(其次)，确保搜标题比搜内容排在更前

```sql
CREATE OR REPLACE FUNCTION resource_tsv_trigger() RETURNS trigger AS $$
BEGIN
  -- 使用 coalesce 防止 NULL 报错
  -- 简单起见使用 english 配置，若环境支持中文分词插件可改为 'zh_cn'
  new.tsv_content := 
      setweight(to_tsvector('english', coalesce(new.title,'')), 'A') || 
      setweight(to_tsvector('english', coalesce(new.content_detail,'')), 'B');
  RETURN new;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON resources FOR EACH ROW EXECUTE PROCEDURE resource_tsv_trigger();
```

B. 性能优化索引

```sql
-- GIN 索引：核心查分点，大幅提升文本搜索速度
CREATE INDEX idx_resources_tsv ON resources USING GIN(tsv_content);

-- GIN 索引：加速对 meta_info 的 JSON 键值对查询
CREATE INDEX idx_resources_meta ON resources USING GIN(meta_info);
```

---

## 2. 页面与路由设计 (SvelteKit)

采用服务端渲染 (SSR) 模式，利用 Form Actions 处理数据提交

### 2.1 目录结构 (`src/routes/`)

| 路径                | 页面功能 | 关键数据/逻辑                                                                             |
| :------------------ | :------- | :---------------------------------------------------------------------------------------- |
| `/`                 | 首页     | Load: 聚合统计(Top 5热度) <br> UI: 居中大搜索框                                           |
| `/login`            | 登录     | Action: 查库比对 Hash -> 设置 Cookie                                                      |
| `/register`         | 注册     | Action: SHA256 Hash -> `INSERT users`                                                     |
| `/search`           | 搜索结果 | Load: `SELECT ... WHERE @@ to_tsquery(...)`<br> UI: 列表展示 + 关键词高亮 (`ts_headline`) |
| `/upload`           | 发布资源 | UI: 包含“AI一键总结”按钮的复杂表单 <br> Action: `INSERT resources` + 写入 `meta_info`     |
| `/resource/[id]`    | 详情页   | Load: 资源详情 + 评论列表 <br> Action: 提交评论 (`INSERT comments`)                       |
| `/my`               | 个人中心 | Load: 使用 CTE 查询“我贡献的资源”及“获赞统计”                                             |
| `/api/ai-summarize` | AI 接口  | POST: 接收 FormFile -> 提取文本 -> 调用 LLM -> 返回纯文本摘要                             |

### 2.2 核心交互逻辑详解：上传页 (`/upload`)

此页面是项目亮点的集中展示区

1. 用户操作区域：
    - 常规输入：课程下拉框、标题输入框、资源链接输入框 (URL)
    - 描述区域 (Smart Area)：
        - 提供一个 `textarea` 供手写
        - 上方提供 `[📂 上传文档 (txt/md/pdf)]` 按钮
2. 前端逻辑：
    - 用户点击上传文件 -> JS 通过 `fetch('/api/ai-summarize')` 发送文件
    - 收到后端返回的 JSON `{"summary": "..."}`
    - JS 自动将摘要填入 `textarea`
    - 用户可手动微调摘要
3. 提交逻辑 (Server Action)：
    - 只接收 Form 中的 `title`, `url`, `content_detail` (无论它是手写还是AI生成的)
    - 不接收文件本身
    - 构建 `meta_info` JSON 对象，标记 `{ "has_ai_summary": true, "ai_model": "deepseek-v3" }`
    - 执行 SQL `INSERT`

---

## 3. 待实现功能清单 (Feature List)

按答辩逻辑分为三个阶段

### P0: 基础骨架 (The Backbone)
- [ ] DB 连接: 配置 `src/lib/db.js` 连接 OpenGauss
- [ ] 用户系统: 注册与登录 (SHA256 加密)，Cookie 鉴权 (Hooks)
- [ ] 基础上传: 能录入标题、URL、手动填写描述，并成功存入数据库
- [ ] 触发器验证: 观察上传后，`tsv_content` 字段是否有数据生成

### P1: 核心亮点 (The Core & AI)
- [ ] AI 接口开发: 实现 `/api/ai-summarize`，对接大模型 (DeepSeek/OpenAI)，解析上传的 .txt/.md 文件
- [ ] 智能填单: 前端实现“上传 -> 等待 -> 自动回填描述框”的交互
- [ ] 全文检索:
    - 使用 `websearch_to_tsquery` 或 `plainto_tsquery` 处理用户输入
    - 搜索 SQL：`WHERE tsv_content @@ query`
    - 排序 SQL：`ORDER BY ts_rank(...) DESC`
- [ ] 高亮显示: 使用 `ts_headline()` 函数让搜索结果页的摘要关键词变红/加粗

### P2: 完善与数据分析 (Polish & Analytics)
- [ ] 点击统计: 在详情页点击“跳转资源链接”时，触发 API 让 `download_count + 1`，并插入一条 `action_logs` 记录
- [ ] 个人中心看板:
    - 使用 CTE (Common Table Expressions) 查询当前用户的总贡献数和总被阅数
    - SQL 示例：
        ```sql
        WITH user_res AS (SELECT id, view_count FROM resources WHERE user_id = $1)
        SELECT count(*) as cnt, sum(view_count) as views FROM user_res;
        ```
- [ ] 首页热搜: `SELECT payload, count(*) FROM action_logs WHERE action_type='SEARCH' GROUP BY payload ORDER BY count DESC LIMIT 5`

---

## 4. 关键 SQL 片段备忘

A. 搜索并高亮 (最复杂的查询)

```javascript
// SvelteKit Load Function
const queryText = url.searchParams.get('q');
const results = await sql`
    SELECT 
        id, title, view_count, resource_url, created_at,
        -- 高亮摘要，StartSel/StopSel 定义高亮标签
        ts_headline('english', content_detail, 
            to_tsquery('english', ${queryText}), 
            'StartSel = <mark>, StopSel = </mark>, MaxWords=35, MinWords=15'
        ) as snippet
    FROM resources
    WHERE tsv_content @@ to_tsquery('english', ${queryText})
    ORDER BY ts_rank(tsv_content, to_tsquery('english', ${queryText})) DESC
    LIMIT 20;
`;
```

B. 记录日志 (Fire-and-forget)

```javascript
// 用户点击“AI 生成”时记录
await sql`
    INSERT INTO action_logs (user_id, action_type, payload, ip_addr)
    VALUES (${userId}, 'AI_GENERATE', ${fileName}, ${clientIp}::inet)
`;
```

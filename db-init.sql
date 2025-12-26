-- OpenBrain 数据库初始化脚本
-- 使用说明: 在 OpenGauss 数据库中按顺序执行此脚本

-- 1. 用户表 (Users) - 基础鉴权
CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(64) NOT NULL,       -- 存放 SHA256 哈希值
    student_id    VARCHAR(20),                -- 学号
    role          VARCHAR(10) DEFAULT 'user', -- 'admin' / 'user'
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 课程/分类表 (Courses) - 维度数据
CREATE TABLE IF NOT EXISTS courses (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) NOT NULL, -- 例: CS101
    name        VARCHAR(100) NOT NULL,
    teacher     VARCHAR(50),
    department  VARCHAR(50)
);

-- 预制数据
INSERT INTO courses (code, name, teacher, department)
VALUES
    ('CS001', '数据库系统原理', '王老师', '计算机学院'),
    ('MATH01', '高等数学(上)', '李老师', '理学院'),
    ('ENG101', '大学英语', '张老师', '外语学院');

-- 3. 资源主表 (Resources) - 核心业务
-- 策略：只存链接，文件内容的精髓通过 content_detail (摘要) 体现
CREATE TABLE IF NOT EXISTS resources (
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
CREATE TABLE IF NOT EXISTS resource_tags (
    resource_id BIGINT REFERENCES resources(id) ON DELETE CASCADE,
    tag_name    VARCHAR(30) NOT NULL,
    PRIMARY KEY (resource_id, tag_name)
);

-- 5. 评论表 (Comments) - 用户互动
CREATE TABLE IF NOT EXISTS comments (
    id          BIGSERIAL PRIMARY KEY,
    resource_id BIGINT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL,
    rating      INT CHECK (rating >= 1 AND rating <= 5),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 用户会话表 (User_Sessions) - 会话管理
CREATE TABLE IF NOT EXISTS user_sessions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id  VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 行为日志表 (Action_Logs) - 审计与统计
CREATE TABLE IF NOT EXISTS action_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id),  -- 可为空（游客）
    action_type VARCHAR(20) NOT NULL,         -- 'SEARCH', 'CLICK_LINK', 'AI_GENERATE'
    target_id   BIGINT,                       -- 关联 resources.id
    payload     TEXT,                         -- 记录搜索词 或 AI生成时的文件名
    ip_addr     INET,                         -- OpenGauss 特有 IP 类型
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 高级数据库对象 (自动化与性能)
-- ============================================

-- A. 智能权重触发器
-- 逻辑：当资源插入/更新时，自动更新 tsv_content
-- 给予 title A级权重(最高)，content_detail B级权重(其次)
CREATE OR REPLACE FUNCTION resource_tsv_trigger() RETURNS trigger AS $$
BEGIN
  new.tsv_content :=
      setweight(to_tsvector('english', coalesce(new.title,'')), 'A') ||
      setweight(to_tsvector('english', coalesce(new.content_detail,'')), 'B');
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate ON resources;
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON resources FOR EACH ROW EXECUTE PROCEDURE resource_tsv_trigger();

-- B. 性能优化索引

-- GIN 索引：核心查分点，大幅提升文本搜索速度
CREATE INDEX IF NOT EXISTS idx_resources_tsv ON resources USING GIN(tsv_content);

-- GIN 索引：加速对 meta_info 的 JSON 键值对查询
CREATE INDEX IF NOT EXISTS idx_resources_meta ON resources USING GIN(meta_info);

-- 普通索引：加速常用查询
CREATE INDEX IF NOT EXISTS idx_resources_course ON resources(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_user ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_created ON resources(created_at DESC);

-- ============================================
-- 示例数据 (可选)
-- ============================================

-- 插入测试用户
INSERT INTO users (username, password_hash, student_id, role)
VALUES ('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '2024001', 'admin');

-- 插入测试资源
INSERT INTO resources (user_id, course_id, title, content_detail, resource_url, meta_info, view_count, download_count)
VALUES
    (1, 1, '数据库系统原理 - 期末复习笔记',
     '本资源包含数据库系统原理的期末复习重点，包括关系代数、SQL优化、事务处理等内容。适合期末复习使用。',
     'https://example.com/db-notes',
     '{"has_ai_summary": true, "file_type": "pdf", "pages": 20}'::jsonb,
     156, 89),
    (1, 2, '高等数学上册 - 习题详解',
     '高等数学上册各章节习题详细解答，包含极限、导数、积分等核心知识点的例题讲解。',
     'https://example.com/math-exercises',
     '{"has_ai_summary": true, "file_type": "pdf", "pages": 45}'::jsonb,
     203, 124),
    (1, 3, '大学英语 - 四级词汇整理',
     '大学英语四级核心词汇整理，按字母顺序排列，包含例句和用法说明。',
     'https://example.com/english-vocab',
     '{"has_ai_summary": false, "file_type": "docx", "pages": 15}'::jsonb,
     89, 45);

-- 插入测试搜索日志
INSERT INTO action_logs (user_id, action_type, payload, ip_addr)
VALUES
    (1, 'SEARCH', '数据库 期末复习', '127.0.0.1'::inet),
    (1, 'SEARCH', '高等数学 习题', '127.0.0.1'::inet),
    (1, 'SEARCH', '英语 四级 词汇', '127.0.0.1'::inet),
    (1, 'SEARCH', '数据库 SQL 优化', '127.0.0.1'::inet),
    (1, 'SEARCH', '高等数学', '127.0.0.1'::inet);

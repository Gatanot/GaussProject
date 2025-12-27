import { Pool } from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';
import { env } from '$env/dynamic/private';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 配置优先使用环境变量，保留合理的默认值以方便本地开发
// 使用 SvelteKit 的服务端 env 模块读取私有环境变量，确保这些敏感值不会被打包到客户端
const pool = new Pool({
    host: env.DB_HOST ?? '127.0.0.1',
    port: Number(env.DB_PORT ?? 5432),
    user: env.DB_USER ?? 'gaussdb',
    password: env.DB_PASSWORD ?? '0316Pro?',
    database: env.DB_DATABASE ?? 'postgres',
    max: Number(env.DB_MAX_CLIENTS ?? 20),
    idleTimeoutMillis: Number(env.DB_IDLE_TIMEOUT_MS ?? 30000),
    connectionTimeoutMillis: Number(env.DB_CONNECTION_TIMEOUT_MS ?? 2000),
});

// 监听错误事件（防止连接池因后台错误导致程序崩溃）
pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    // 保持与原实现一致：在严重错误时退出进程
    process.exit(-1);
});

// 目标 schema（可通过环境变量 DB_SCHEMA 配置），默认使用 public
const TARGET_SCHEMA = env.DB_SCHEMA ?? 'gaussdb';
export const SCHEMA = TARGET_SCHEMA;

// 在每个连接建立时设置默认 search_path，避免非目标 schema 导致的未找到表问题
// 注意：如果你使用自定义 schema，可根据需要调整此设置
// @ts-ignore pg 的 connect 事件存在于运行时
pool.on('connect', (client: any) => {
    client.query(`SET search_path TO ${TARGET_SCHEMA}`).catch((e: any) => {
        console.warn('设置 search_path 失败（非致命）:', e?.message ?? e);
    });
});

// 导出一个带类型的 query 函数和 pool 实例，方便在代码中直接使用
export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    return pool.query<T>(text, params);
}

// 测试数据库连接
export async function testConnection(): Promise<{ success: boolean; message: string; version?: string }> {
    try {
        const result = await pool.query('SELECT version()');
        return {
            success: true,
            message: '数据库连接成功！',
            version: result.rows[0].version
        };
    } catch (error) {
        console.error('Database connection error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : '未知错误'
        };
    }
}

// 检查数据库表是否存在（跨 schema 检查 + 回退实际 SELECT 测试）
async function checkTablesExist(): Promise<boolean> {
    try {
        // 记录当前 schema 与 search_path，便于定位问题
        const sp = await pool.query(`SHOW search_path`);
        const cs = await pool.query(`SELECT current_schema() AS schema`);
        console.log('当前 search_path:', sp.rows?.[0]?.search_path);
        console.log('当前 schema:', cs.rows?.[0]?.schema);

                // 仅检查目标 schema 下的核心表是否存在
                const result = await pool.query(
                    `SELECT 
                        EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = 'users') AS has_users,
                        EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = 'courses') AS has_courses,
                        EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = 'resources') AS has_resources,
                        EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = 'user_sessions') AS has_user_sessions`,
                    [TARGET_SCHEMA]
                );

                const row = (result.rows && result.rows[0])
                    ? result.rows[0] as any
                    : { has_users: false, has_courses: false, has_resources: false, has_user_sessions: false };
                let ok = !!(row.has_users && row.has_courses && row.has_resources && row.has_user_sessions);
                console.log('核心表存在性（pg_tables）:', row, '初判结果:', ok);

                // 回退：直接执行 SELECT 判断是否可用（利用当前 search_path）
                if (!ok) {
                        const flags = { users: false, courses: false, resources: false, user_sessions: false };
                        try { await pool.query('SELECT 1 FROM users LIMIT 1'); flags.users = true; } catch {}
                        try { await pool.query('SELECT 1 FROM courses LIMIT 1'); flags.courses = true; } catch {}
                        try { await pool.query('SELECT 1 FROM resources LIMIT 1'); flags.resources = true; } catch {}
                        try { await pool.query('SELECT 1 FROM user_sessions LIMIT 1'); flags.user_sessions = true; } catch {}
                        ok = flags.users && flags.courses && flags.resources && flags.user_sessions;
                        console.log('核心表存在性（SELECT 回退）:', flags, '终判结果:', ok);
                }

                return ok;
    } catch (error) {
        console.error('Error checking tables:', error);
        return false;
    }
}

// 读取并执行 db-init.sql
async function executeInitScript(): Promise<void> {
    try {
        // 读取 SQL 文件
        const projectRoot = process.cwd();
        const sqlFilePath = join(projectRoot, 'db-init.sql');
        const sqlContent = readFileSync(sqlFilePath, 'utf-8');

        console.log('正在初始化数据库...');

        // 分割 SQL 语句（考虑 $$ 包裹的函数/触发器体，避免错误切分）
        const statements: string[] = [];
        let currentStatement = '';
        let inDollarBlock = false;

        const lines = sqlContent.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();

            // 跳过注释和空行（但仍要保留 dollar 块内的行）
            if (!inDollarBlock && (trimmed.startsWith('--') || trimmed === '')) {
                continue;
            }

            currentStatement += line + '\n';

            // 进入/退出 $$ 块
            if (line.includes('$$')) {
                inDollarBlock = !inDollarBlock;
            }

            // 仅在非 $$ 块末尾的分号才切分；若刚关闭 $$ 块且行以分号结尾，也切分
            if (!inDollarBlock && trimmed.endsWith(';')) {
                statements.push(currentStatement.trim());
                currentStatement = '';
            }
        }

        // 添加最后一条语句（防御性）
        if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
        }

        // 执行每条语句
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                try {
                    await pool.query(statement);
                    console.log(`执行成功 (${i + 1}/${statements.length})`);
                } catch (err: any) {
                    // 某些语句失败是可以接受的（如已存在的表、重复键）
                    const errorMsg = err.message || '';
                    if (
                        errorMsg.includes('already exists') ||
                        errorMsg.includes('duplicate key') ||
                        errorMsg.includes('duplicate') ||
                        errorMsg.includes('unique constraint') ||
                        errorMsg.includes('relation')
                    ) {
                        console.log(`跳过 (${i + 1}/${statements.length}): ${errorMsg.substring(0, 50)}`);
                    } else {
                        console.error(`执行失败 (${i + 1}/${statements.length}):`, err.message);
                        throw err;
                    }
                }
            }
        }

        console.log('数据库初始化完成');
    } catch (error) {
        console.error('数据库初始化失败', error);
        throw error;
    }
}

// 兜底：确保三张核心表存在于目标 schema（即使初始化脚本失败也可建立最小可运行集）
async function ensureCoreTables(): Promise<void> {
    const statements = [
        `CREATE SCHEMA IF NOT EXISTS ${TARGET_SCHEMA};`,
        `CREATE TABLE IF NOT EXISTS ${TARGET_SCHEMA}.users (
            id            BIGSERIAL PRIMARY KEY,
            username      VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(64) NOT NULL,
            student_id    VARCHAR(20),
            role          VARCHAR(10) DEFAULT 'user',
            created_at    TIMESTAMPTZ DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS ${TARGET_SCHEMA}.user_sessions (
            id           BIGSERIAL PRIMARY KEY,
            user_id      BIGINT NOT NULL REFERENCES ${TARGET_SCHEMA}.users(id) ON DELETE CASCADE,
            session_id   VARCHAR(128) NOT NULL UNIQUE,
            created_at   TIMESTAMPTZ DEFAULT NOW(),
            expires_at   TIMESTAMPTZ NOT NULL
        );`,
        `CREATE TABLE IF NOT EXISTS ${TARGET_SCHEMA}.courses (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(100) NOT NULL,
            teacher     VARCHAR(50),
            department  VARCHAR(50)
        );`,
        `CREATE TABLE IF NOT EXISTS ${TARGET_SCHEMA}.resources (
            id              BIGSERIAL PRIMARY KEY,
            user_id         BIGINT NOT NULL REFERENCES ${TARGET_SCHEMA}.users(id),
            course_id       INT NOT NULL REFERENCES ${TARGET_SCHEMA}.courses(id),
            title           VARCHAR(200) NOT NULL,
            content_detail  TEXT NOT NULL,
            source_type     VARCHAR(20) DEFAULT 'link',
            resource_url    TEXT NOT NULL,
            meta_info       JSONB DEFAULT '{}'::jsonb,
            tsv_content     TSVECTOR,
            view_count      INT DEFAULT 0,
            download_count  INT DEFAULT 0,
            created_at      TIMESTAMPTZ DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS ${TARGET_SCHEMA}.resource_tags (
            resource_id BIGINT REFERENCES ${TARGET_SCHEMA}.resources(id) ON DELETE CASCADE,
            tag_name    VARCHAR(30) NOT NULL,
            PRIMARY KEY (resource_id, tag_name)
        );`,
        `CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON ${TARGET_SCHEMA}.user_sessions(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON ${TARGET_SCHEMA}.user_sessions(expires_at);`
    ];

    for (let i = 0; i < statements.length; i++) {
        try {
            await pool.query(statements[i]);
        } catch (e: any) {
            console.warn('ensureCoreTables 失败:', e?.message ?? e);
        }
    }
}

// 初始化数据库（如果需要）
let initPromise: Promise<void> | null = null;
let initialized = false; // 标记本进程已完成一次性初始化检查

export async function initializeDatabase(): Promise<void> {
    // 若已完成初始化检查，则直接返回，避免每次请求重复验证
    if (initialized) {
        return;
    }

    // 如果已经在初始化中，返回相同的 Promise
    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            const tablesExist = await checkTablesExist();

            if (tablesExist) {
                console.log('数据库表已存在，跳过初始化');
            } else {
                console.log('数据库表不存在，开始自动初始化...');
                await executeInitScript();
                // 兜底：确保核心表存在
                await ensureCoreTables();
            }

            // 运行轻量级迁移：移除 courses.code 列（如存在）
            try {
                const colRes = await pool.query(
                    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='code'`
                );
                if (colRes.rowCount && colRes.rowCount > 0) {
                    console.log('检测到 courses.code 列，执行迁移删除该列');
                    await pool.query('ALTER TABLE courses DROP COLUMN code');
                    console.log('已删除 courses.code 列');
                }
            } catch (e) {
                console.error('迁移 courses.code 失败', e);
            }

            // 最终确认一次核心表是否可用
            const finalOk = await checkTablesExist();
            if (!finalOk) {
                console.warn('初始化后仍未检测到核心表，请检查数据库连接配置与权限');
            } else {
                console.log('核心表检测通过，初始化完成');
            }

            // 标记为已初始化，以避免后续请求重复执行初始化检查
            initialized = true;
        } catch (error) {
            console.error('数据库初始化检查失败:', error);
            // 不抛出错误，允许应用继续运行
        } finally {
            initPromise = null;
        }
    })();

    return initPromise;
}

export { pool };
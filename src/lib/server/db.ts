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

// 检查数据库表是否存在
async function checkTablesExist(): Promise<boolean> {
    try {
        // 检查 users 表是否存在（这是核心表，如果它存在说明数据库已初始化）
        const result = await pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'users'
            );
        `);
        return result.rows[0].exists;
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

// 初始化数据库（如果需要）
let initPromise: Promise<void> | null = null;

export async function initializeDatabase(): Promise<void> {
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
            }
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
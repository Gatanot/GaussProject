import { Pool } from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';

// 配置优先使用环境变量，保留合理的默认值以方便本地开发
const pool = new Pool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'gaussdb',
    password: process.env.DB_PASSWORD ?? '0316Pro?',
    database: process.env.DB_DATABASE ?? 'postgres',
    max: Number(process.env.DB_MAX_CLIENTS ?? 20),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS ?? 2000),
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

export { pool };
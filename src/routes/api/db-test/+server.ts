import { dev } from '$app/environment';
import type { RequestHandler } from '@sveltejs/kit';
import { query } from '$lib/server/db';

export const POST: RequestHandler = async () => {
    if (!dev) {
        return new Response(JSON.stringify({ success: false, error: 'DB 测试仅允许在开发模式运行' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const steps: Array<any> = [];
    const table = `test_table_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    try {
        await query('BEGIN');

        // 1. 创建临时测试表（使用唯一表名以避免冲突）
        await query(`CREATE TABLE ${table} (id SERIAL PRIMARY KEY, name TEXT)`);
        steps.push({ op: 'create_table', table });

        // 2. 插入一条记录
        const insertRes = await query(`INSERT INTO ${table} (name) VALUES ($1) RETURNING id, name`, ['Alice']);
        steps.push({ op: 'insert', row: insertRes.rows[0] });

        // 3. 查询所有记录
        const selectRes = await query(`SELECT * FROM ${table}`);
        steps.push({ op: 'select_all', rows: selectRes.rows });

        // 4. 更新记录
        const id = insertRes.rows[0].id;
        await query(`UPDATE ${table} SET name = $1 WHERE id = $2`, ['Bob', id]);
        steps.push({ op: 'update', id, newName: 'Bob' });

        const selectAfterUpdate = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        steps.push({ op: 'select_after_update', rows: selectAfterUpdate.rows });

        // 5. 删除记录
        await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        steps.push({ op: 'delete', id });

        // 6. 删除表
        await query(`DROP TABLE IF EXISTS ${table}`);
        steps.push({ op: 'drop_table', table });

        await query('COMMIT');

        return new Response(JSON.stringify({ success: true, steps }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        try {
            await query('ROLLBACK');
        } catch (e) {
            // ignore
        }

        try {
            await query(`DROP TABLE IF EXISTS ${table}`);
        } catch (e) {
            // ignore
        }

        return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err), steps }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

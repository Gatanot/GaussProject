import type { PageServerLoad, Actions } from './$types';
import { query, SCHEMA } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
        return { resource: null };
    }

    const res = await query(
        `SELECT r.*, c.name AS course_name, u.username AS author_name
         FROM ${SCHEMA}.resources r
         JOIN ${SCHEMA}.courses c ON r.course_id = c.id
         JOIN ${SCHEMA}.users u ON r.user_id = u.id
         WHERE r.id = $1`,
        [id]
    );

    if (res.rows.length === 0) {
        return { resource: null };
    }

    // 增加一次查看计数（错误不影响页面展示）
    try {
        await query(`UPDATE ${SCHEMA}.resources SET view_count = view_count + 1 WHERE id = $1`, [id]);
    } catch (e) {
        console.error('更新查看次数失败', e);
    }

    return { resource: res.rows[0] };
};

export const actions: Actions = {
    download: async ({ params, locals, getClientAddress }) => {
        const id = Number(params.id);
        if (!Number.isFinite(id)) {
            return { success: false };
        }

        const res = await query<{ resource_url: string }>(
            `UPDATE ${SCHEMA}.resources SET download_count = download_count + 1 WHERE id = $1
             RETURNING resource_url`,
            [id]
        );

        if (res.rows.length === 0) {
            return { success: false };
        }

        const url = res.rows[0].resource_url;

        // 记录点击行为日志
        try {
            const userId = locals.user?.id ?? null;
            const ip = getClientAddress();
            await query(
                `INSERT INTO ${SCHEMA}.action_logs (user_id, action_type, target_id, payload, ip_addr)
                 VALUES ($1, 'CLICK_LINK', $2, $3, $4::inet)`,
                [userId, id, url, ip]
            );
        } catch (e) {
            console.error('记录点击日志失败', e);
        }

        throw redirect(302, url);
    }
};

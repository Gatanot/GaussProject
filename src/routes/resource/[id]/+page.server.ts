import type { PageServerLoad, Actions } from './$types';
import { query, SCHEMA } from '$lib/server/db';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
        return { resource: null, comments: [] };
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
        return { resource: null, comments: [] };
    }

    // 增加一次查看计数（错误不影响页面展示）
    try {
        await query(`UPDATE ${SCHEMA}.resources SET view_count = view_count + 1 WHERE id = $1`, [id]);
    } catch (e) {
        console.error('更新查看次数失败', e);
    }

    const comments = await query(
        `SELECT c.id, c.content, c.rating, c.created_at, u.username
         FROM ${SCHEMA}.comments c
         JOIN ${SCHEMA}.users u ON c.user_id = u.id
         WHERE c.resource_id = $1
         ORDER BY c.created_at DESC`,
        [id]
    );

    return { resource: res.rows[0], comments: comments.rows };
};

export const actions: Actions = {
    comment: async ({ request, params, locals }) => {
        if (!locals.user) {
            return fail(401, {
                success: false,
                message: '请先登录后发表评论'
            });
        }

        const id = Number(params.id);
        if (!Number.isFinite(id)) {
            return fail(400, {
                success: false,
                message: '资源参数不正确'
            });
        }

        const formData = await request.formData();
        const content = String(formData.get('content') ?? '').trim();

        if (!content) {
            return fail(400, {
                success: false,
                message: '请输入评论内容',
                content
            });
        }

        if (content.length > 500) {
            return fail(400, {
                success: false,
                message: '评论内容请控制在 500 字以内',
                content
            });
        }

        const existing = await query(`SELECT id FROM ${SCHEMA}.resources WHERE id = $1`, [id]);
        if (existing.rows.length === 0) {
            return fail(404, {
                success: false,
                message: '资源不存在，无法发表评论'
            });
        }

        await query(
            `INSERT INTO ${SCHEMA}.comments (resource_id, user_id, content)
             VALUES ($1, $2, $3)`,
            [id, locals.user.id, content]
        );

        return {
            success: true,
            message: '评论已发布'
        };
    },
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

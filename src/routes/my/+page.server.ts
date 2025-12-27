import type { PageServerLoad, Actions } from './$types';
import { query, SCHEMA } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
    // 未登录用户重定向到登录页
    if (!locals.user) {
        throw redirect(302, '/login?redirect=/my');
    }

    const userId = locals.user.id;

    try {
        // 使用 CTE (Common Table Expressions) 查询用户统计数据
        // 这是 PLAN.md 中要求展示的数据库高级特性
        const statsResult = await query<{
            resource_count: string;
            total_views: string;
            total_downloads: string;
        }>(
            `WITH user_resources AS (
                SELECT id, view_count, download_count 
                FROM ${SCHEMA}.resources 
                WHERE user_id = $1
            )
            SELECT 
                COUNT(*) AS resource_count,
                COALESCE(SUM(view_count), 0) AS total_views,
                COALESCE(SUM(download_count), 0) AS total_downloads
            FROM user_resources`,
            [userId]
        );

        // 获取用户贡献的资源列表（带课程信息）
        const resourcesResult = await query<{
            id: number;
            title: string;
            content_detail: string;
            resource_url: string;
            view_count: number;
            download_count: number;
            created_at: string;
            course_name: string;
            course_teacher: string;
            meta_info: Record<string, any>;
        }>(
            `SELECT 
                r.id,
                r.title,
                r.content_detail,
                r.resource_url,
                r.view_count,
                r.download_count,
                r.created_at,
                r.meta_info,
                c.name AS course_name,
                c.teacher AS course_teacher
            FROM ${SCHEMA}.resources r
            JOIN ${SCHEMA}.courses c ON r.course_id = c.id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC`,
            [userId]
        );

        // 获取用户资源的标签
        const tagsResult = await query<{
            resource_id: number;
            tag_name: string;
        }>(
            `SELECT rt.resource_id, rt.tag_name
            FROM ${SCHEMA}.resource_tags rt
            JOIN ${SCHEMA}.resources r ON rt.resource_id = r.id
            WHERE r.user_id = $1`,
            [userId]
        );

        // 将标签按资源 ID 分组
        const tagsByResource = new Map<number, string[]>();
        for (const tag of tagsResult.rows) {
            const tags = tagsByResource.get(tag.resource_id) ?? [];
            tags.push(tag.tag_name);
            tagsByResource.set(tag.resource_id, tags);
        }

        // 合并资源与标签
        const resources = resourcesResult.rows.map((r) => ({
            ...r,
            tags: tagsByResource.get(r.id) ?? []
        }));

        // 获取用户最近的行为日志（可选展示）
        const recentActionsResult = await query<{
            action_type: string;
            target_id: number;
            payload: string;
            created_at: string;
        }>(
            `SELECT action_type, target_id, payload, created_at
            FROM ${SCHEMA}.action_logs
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 10`,
            [userId]
        );

        const stats = statsResult.rows[0];

        return {
            user: locals.user,
            stats: {
                resourceCount: Number(stats.resource_count),
                totalViews: Number(stats.total_views),
                totalDownloads: Number(stats.total_downloads)
            },
            resources,
            recentActions: recentActionsResult.rows
        };
    } catch (error) {
        console.error('加载个人中心数据失败:', error);
        return {
            user: locals.user,
            stats: {
                resourceCount: 0,
                totalViews: 0,
                totalDownloads: 0
            },
            resources: [],
            recentActions: [],
            error: '加载数据时出现错误，请稍后重试'
        };
    }
};

export const actions: Actions = {
    // 登出
    logout: async ({ cookies }) => {
        const sessionId = cookies.get('session');
        if (sessionId) {
            await deleteSession(sessionId);
            cookies.delete('session', { path: '/' });
        }
        throw redirect(302, '/login');
    },

    // 删除资源
    deleteResource: async ({ request, locals }) => {
        if (!locals.user) {
            return { success: false, message: '请先登录' };
        }

        const formData = await request.formData();
        const resourceId = Number(formData.get('resourceId'));

        if (!Number.isFinite(resourceId)) {
            return { success: false, message: '无效的资源 ID' };
        }

        try {
            // 验证资源属于当前用户
            const checkResult = await query<{ user_id: number }>(
                `SELECT user_id FROM ${SCHEMA}.resources WHERE id = $1`,
                [resourceId]
            );

            if (checkResult.rows.length === 0) {
                return { success: false, message: '资源不存在' };
            }

            if (checkResult.rows[0].user_id !== locals.user.id) {
                return { success: false, message: '无权删除此资源' };
            }

            // 删除资源（标签会通过 ON DELETE CASCADE 自动删除）
            await query(`DELETE FROM ${SCHEMA}.resources WHERE id = $1`, [resourceId]);

            return { success: true, message: '资源已删除' };
        } catch (error) {
            console.error('删除资源失败:', error);
            return { success: false, message: '删除失败，请稍后重试' };
        }
    }
};

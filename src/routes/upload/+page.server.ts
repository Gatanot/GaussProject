import type { Actions } from './$types';
import { query, SCHEMA } from '$lib/server/db';

export const actions: Actions = {
    default: async ({ request, locals }) => {
        const formData = await request.formData();
        const title = String(formData.get('title') ?? '').trim();
        const resource_url = String(formData.get('resource_url') ?? '').trim();
        const content_detail = String(formData.get('content_detail') ?? '').trim();
        const course_name = String(formData.get('course_name') ?? '').trim();
        const course_teacher = String(formData.get('course_teacher') ?? '').trim();
        const course_department = String(formData.get('course_department') ?? '').trim();
        const rawTags = String(formData.get('tags') ?? '').trim();

        if (!title || !resource_url || !content_detail || !course_name) {
            return {
                success: false,
                message: '请填写完整的标题、课程名称、链接与描述'
            };
        }

        // 简单 URL 验证
        try {
            const u = new URL(resource_url);
            if (!u.protocol.startsWith('http')) throw new Error('bad');
        } catch {
            return { success: false, message: '资源链接格式不正确' };
        }

        // 临时使用当前登录用户，否则使用示例用户 1（db-init.sql 已插入）
        const user_id = locals.user?.id ?? 1;

        try {
            // 确认或创建课程
            const existing = await query<{ id: number }>(
                `SELECT id FROM ${SCHEMA}.courses WHERE name = $1 AND COALESCE(teacher,'') = COALESCE($2,'') AND COALESCE(department,'') = COALESCE($3,'') LIMIT 1`,
                [course_name, course_teacher || null, course_department || null]
            );
            let course_id: number;
            if (existing.rows.length > 0) {
                course_id = existing.rows[0].id;
            } else {
                const inserted = await query<{ id: number }>(
                    `INSERT INTO ${SCHEMA}.courses (name, teacher, department) VALUES ($1, $2, $3) RETURNING id`,
                    [course_name, course_teacher || null, course_department || null]
                );
                course_id = inserted.rows[0].id;
            }

            const meta_info = { has_ai_summary: false };
            const res = await query<{ id: number }>(
                `INSERT INTO ${SCHEMA}.resources (user_id, course_id, title, content_detail, resource_url, meta_info)
                 VALUES ($1, $2, $3, $4, $5, $6::jsonb)
                 RETURNING id`,
                [user_id, course_id, title, content_detail, resource_url, JSON.stringify(meta_info)]
            );

            const resourceId = res.rows[0].id;

            // 处理标签：按中文/英文逗号与换行分割，去重与裁剪至 30 字
            const tagList = Array.from(
                new Set(
                    rawTags
                        .split(/[，,\n]/)
                        .map((t) => t.trim())
                        .filter((t) => t.length > 0)
                        .map((t) => (t.length > 30 ? t.slice(0, 30) : t))
                )
            );

            if (tagList.length > 0) {
                try {
                    await query(
                        `INSERT INTO ${SCHEMA}.resource_tags (resource_id, tag_name)
                         SELECT $1, tag
                         FROM unnest($2::text[]) AS t(tag)
                         WHERE NOT EXISTS (
                           SELECT 1 FROM ${SCHEMA}.resource_tags rt
                           WHERE rt.resource_id = $1 AND rt.tag_name = tag
                         )`,
                        [resourceId, tagList]
                    );
                } catch (e) {
                    console.error('插入标签失败:', e);
                }
            }

            return {
                success: true,
                message: '资源已提交',
                resourceId
            };
        } catch (error) {
            console.error('插入资源失败:', error);
            return {
                success: false,
                message: '提交失败，请稍后重试'
            };
        }
    }
};

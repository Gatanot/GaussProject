import type { PageServerLoad } from './$types';
import { query, SCHEMA } from '$lib/server/db';

// 简单的 Levenshtein 距离算法（用于拼写纠错）
function levenshtein(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

export const load: PageServerLoad = async ({ url, locals, getClientAddress }) => {
    const q = url.searchParams.get('q')?.trim() ?? '';

    if (!q) {
        return {
            query: '',
            results: [],
            total: 0,
            suggestion: null
        };
    }

    try {
        let results: any[] = [];
        let suggestion = null;

        // 1. 主搜索：全文检索 + LIKE 模糊搜索合并（解决中文分词问题）
        const searchResult = await query(
            `SELECT 
                r.id,
                r.title,
                r.view_count,
                r.download_count,
                r.resource_url,
                r.created_at,
                c.name AS course_name,
                c.teacher AS course_teacher,
                u.username AS author_name,
                -- 摘要：优先尝试高亮，若无匹配则截取
                CASE 
                    WHEN r.tsv_content @@ plainto_tsquery('english', $1) THEN
                        ts_headline('english', r.content_detail, 
                            plainto_tsquery('english', $1), 
                            'StartSel = <mark>, StopSel = </mark>, MaxWords=35, MinWords=15')
                    ELSE
                        substring(r.content_detail from 1 for 120) || '...'
                END AS snippet,
                -- 排序权重：全文匹配优先，LIKE 匹配次之
                CASE 
                    WHEN r.tsv_content @@ plainto_tsquery('english', $1) THEN
                        ts_rank(r.tsv_content, plainto_tsquery('english', $1)) + 1.0
                    ELSE
                        0.5
                END AS rank
            FROM ${SCHEMA}.resources r
            JOIN ${SCHEMA}.courses c ON r.course_id = c.id
            JOIN ${SCHEMA}.users u ON r.user_id = u.id
            WHERE r.tsv_content @@ plainto_tsquery('english', $1)
               OR r.title ILIKE $2 
               OR r.content_detail ILIKE $2
            ORDER BY rank DESC, r.view_count DESC
            LIMIT 20`,
            [q, `%${q}%`]
        );
        results = searchResult.rows;

        // 2. 如果完全无结果，尝试拼写纠错推荐 (Did you mean?)
        if (results.length === 0) {
            // 获取 Top 50 热门搜索词
            const hotTerms = await query(
                `SELECT payload FROM ${SCHEMA}.action_logs 
                 WHERE action_type = 'SEARCH' AND payload IS NOT NULL AND length(payload) > 1
                 GROUP BY payload 
                 ORDER BY count(*) DESC 
                 LIMIT 50`
            );

            let bestDist = Infinity;
            let bestTerm = null;

            for (const row of hotTerms.rows) {
                const term = row.payload;
                if (term === q) continue; // 跳过完全一样的

                const dist = levenshtein(q, term);
                // 阈值：编辑距离 <= 2，且距离小于较长词的一半（防止短词误判）
                if (dist <= 2 && dist < Math.max(q.length, term.length) / 2 + 1) {
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestTerm = term;
                    }
                }
            }
            suggestion = bestTerm;
        }

        // 记录搜索行为 (Fire-and-forget)
        const userId = locals.user?.id ?? null;
        const ip = getClientAddress();
        query(
            `INSERT INTO ${SCHEMA}.action_logs (user_id, action_type, payload, ip_addr)
             VALUES ($1, 'SEARCH', $2, $3::inet)`,
            [userId, q, ip]
        ).catch((e) => console.error('记录搜索日志失败:', e));

        return {
            query: q,
            results,
            total: results.length,
            suggestion
        };
    } catch (error) {
        console.error('搜索查询失败:', error);
        return {
            query: q,
            results: [],
            total: 0,
            error: '搜索出错，请稍后重试',
            suggestion: null
        };
    }
};

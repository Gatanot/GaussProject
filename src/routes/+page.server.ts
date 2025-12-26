import { query, SCHEMA } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// 获取 Top 5 热门资源 (按浏览量和下载量综合排序)
		const hotResourcesResult = await query(`
			SELECT
				r.id,
				r.title,
				r.content_detail,
				r.view_count,
				r.download_count,
				r.created_at,
				c.name as course_name,
				u.username as author_name
			FROM ${SCHEMA}.resources r
			JOIN ${SCHEMA}.courses c ON r.course_id = c.id
			JOIN ${SCHEMA}.users u ON r.user_id = u.id
			ORDER BY (r.view_count * 0.7 + r.download_count * 0.3) DESC
			LIMIT 5
		`);

		// 获取热搜关键词 (Top 5)
		const hotSearchesResult = await query(`
			SELECT
				payload,
				count(*) as search_count
			FROM ${SCHEMA}.action_logs
			WHERE action_type = 'SEARCH'
				AND payload IS NOT NULL
				AND payload != ''
			GROUP BY payload
			ORDER BY search_count DESC
			LIMIT 5
		`);

		return {
			hotResources: hotResourcesResult.rows,
			hotSearches: hotSearchesResult.rows
		};
	} catch (error) {
		console.error('Error loading home page data:', error);
		// 返回空数组，不影响页面显示
		return {
			hotResources: [],
			hotSearches: []
		};
	}
};
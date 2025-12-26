import type { Handle } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/db';

/**
 * SvelteKit 服务端钩子
 * 在每个请求处理前执行，这里用于确保数据库已初始化
 */
export const handle: Handle = async ({ event, resolve }) => {
	// 在第一个请求时触发数据库初始化检查
	// 使用 Promise 确保只初始化一次
	await initializeDatabase();

	// 继续处理请求
	return resolve(event);
};

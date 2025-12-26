import type { Handle } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/db';
import { getUserBySession } from '$lib/server/auth';

/**
 * SvelteKit 服务端钩子
 * 在每个请求处理前执行，这里用于确保数据库已初始化，并处理用户会话
 */
export const handle: Handle = async ({ event, resolve }) => {
	// 在第一个请求时触发数据库初始化检查
	await initializeDatabase();

	// 从 cookie 中获取 session ID
	const sessionCookie = event.cookies.get('session');

	// 如果存在 session，则获取用户信息
	if (sessionCookie) {
		const user = await getUserBySession(sessionCookie);
		if (user) {
			event.locals.user = user;
		} else {
			// session 无效或过期，清除 cookie
			event.cookies.delete('session', { path: '/' });
		}
	}

	// 继续处理请求
	return resolve(event);
};

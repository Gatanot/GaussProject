import { redirect, fail } from '@sveltejs/kit';
import { verifyUser, generateSessionToken, createSession } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// 如果用户已登录，重定向到首页或指定页面
	if (locals.user) {
		const redirectTo = url.searchParams.get('redirect') ?? '/';
		throw redirect(302, redirectTo);
	}

	return {
		redirectTo: url.searchParams.get('redirect') ?? '/'
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();
		const password = formData.get('password')?.toString();
		const redirectTo = url.searchParams.get('redirect') ?? '/';

		// 表单验证
		if (!username || !password) {
			return fail(400, {
				error: '请输入用户名和密码',
				username: username || ''
			});
		}

		// 验证用户凭据
		const user = await verifyUser(username, password);

		if (!user) {
			return fail(401, {
				error: '用户名或密码错误',
				username
			});
		}

		// 创建会话并设置 cookie
		const sessionToken = generateSessionToken();
		await createSession(user.id, sessionToken);

		cookies.set('session', sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 7 // 7 天
		});

		// 登录成功，重定向到首页或指定页面
		throw redirect(302, redirectTo);
	}
};

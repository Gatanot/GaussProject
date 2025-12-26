import { redirect, fail } from '@sveltejs/kit';
import { createUser } from '$lib/server/auth';
import { generateSessionToken, createSession } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// 如果用户已登录，重定向到首页
	if (locals.user) {
		throw redirect(302, '/');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();
		const password = formData.get('password')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();
		const studentId = formData.get('studentId')?.toString();

		// 表单验证
		if (!username || username.length < 3) {
			return fail(400, {
				error: '用户名至少需要 3 个字符',
				username: username || '',
				studentId: studentId || ''
			});
		}

		if (!password || password.length < 6) {
			return fail(400, {
				error: '密码至少需要 6 个字符',
				username,
				studentId: studentId || ''
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				error: '两次输入的密码不一致',
				username,
				studentId: studentId || ''
			});
		}

		// 创建用户
		const result = await createUser(username, password, studentId);

		if (!result.success || !result.user) {
			return fail(400, {
				error: result.message,
				username,
				studentId: studentId || ''
			});
		}

		// 创建会话并设置 cookie
		const sessionToken = generateSessionToken();
		await createSession(result.user.id, sessionToken);

		cookies.set('session', sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 7 // 7 天
		});

		// 注册成功，重定向到首页
		throw redirect(302, '/');
	}
};

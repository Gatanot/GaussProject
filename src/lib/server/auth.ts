import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { query } from './db';

/**
 * 用户类型定义
 */
export interface User {
	id: number;
	username: string;
	student_id?: string;
	role: string;
}

/**
 * 使用 SHA256 对密码进行哈希
 */
export function hashPassword(password: string): string {
	return createHash('sha256').update(password).digest('hex');
}

/**
 * 生成随机会话令牌
 */
export function generateSessionToken(): string {
	return randomBytes(32).toString('hex');
}

/**
 * 验证用户凭据
 */
export async function verifyUser(
	username: string,
	password: string
): Promise<User | null> {
	const passwordHash = hashPassword(password);
	const result = await query<User>(
		'SELECT id, username, student_id, role FROM users WHERE username = $1 AND password_hash = $2',
		[username, passwordHash]
	);

	if (result.rows.length === 0) {
		return null;
	}

	return result.rows[0];
}

/**
 * 创建新用户
 */
export async function createUser(
	username: string,
	password: string,
	student_id?: string
): Promise<{ success: boolean; message: string; user?: User }> {
	// 检查用户名是否已存在
	const existingUser = await query('SELECT id FROM users WHERE username = $1', [username]);
	if (existingUser.rows.length > 0) {
		return { success: false, message: '用户名已存在' };
	}

	const passwordHash = hashPassword(password);

	try {
		const result = await query<User>(
			`INSERT INTO users (username, password_hash, student_id)
			 VALUES ($1, $2, $3)
			 RETURNING id, username, student_id, role`,
			[username, passwordHash, student_id || null]
		);

		return {
			success: true,
			message: '注册成功',
			user: result.rows[0]
		};
	} catch (error) {
		console.error('创建用户失败:', error);
		return { success: false, message: '注册失败，请稍后重试' };
	}
}

/**
 * 根据 session ID 获取用户信息
 */
export async function getUserBySession(sessionId: string): Promise<User | null> {
	const result = await query<User>(
		`SELECT u.id, u.username, u.student_id, u.role
		 FROM users u
		 INNER JOIN user_sessions us ON u.id = us.user_id
		 WHERE us.session_id = $1
		 AND us.expires_at > NOW()`,
		[sessionId]
	);

	if (result.rows.length === 0) {
		return null;
	}

	return result.rows[0];
}

/**
 * 创建会话记录
 */
export async function createSession(userId: number, sessionId: string): Promise<void> {
	// 设置会话过期时间为 7 天
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7);

	await query(
		`INSERT INTO user_sessions (user_id, session_id, expires_at)
		 VALUES ($1, $2, $3)`,
		[userId, sessionId, expiresAt]
	);
}

/**
 * 删除会话（登出）
 */
export async function deleteSession(sessionId: string): Promise<void> {
	await query('DELETE FROM user_sessions WHERE session_id = $1', [sessionId]);
}

/**
 * 清理过期会话
 */
export async function cleanupExpiredSessions(): Promise<void> {
	await query('DELETE FROM user_sessions WHERE expires_at <= NOW()');
}

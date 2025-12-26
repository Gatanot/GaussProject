<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<div class="auth-container">
	<div class="auth-card card">
		<div class="auth-header">
			<h1>注册账号</h1>
			<p>加入 OpenBrain，开启知识探索之旅</p>
		</div>

		<form method="POST" use:enhance class="auth-form">
			{#if form?.error}
				<div class="alert alert-error">
					{form.error}
				</div>
			{/if}

			<div class="form-group">
				<label for="username">用户名</label>
				<input
					type="text"
					id="username"
					name="username"
					required
					minlength="3"
					placeholder="请输入用户名"
					value={form?.username ?? ''}
					class="input"
				/>
				<span class="form-hint">至少 3 个字符</span>
			</div>

			<div class="form-group">
				<label for="studentId">学号（可选）</label>
				<input
					type="text"
					id="studentId"
					name="studentId"
					placeholder="请输入学号"
					value={form?.studentId ?? ''}
					class="input"
				/>
			</div>

			<div class="form-group">
				<label for="password">密码</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					minlength="6"
					placeholder="请输入密码"
					class="input"
				/>
				<span class="form-hint">至少 6 个字符</span>
			</div>

			<div class="form-group">
				<label for="confirmPassword">确认密码</label>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					required
					minlength="6"
					placeholder="请再次输入密码"
					class="input"
				/>
			</div>

			<button type="submit" class="btn btn-primary btn-block">注册</button>
		</form>

		<div class="auth-footer">
			<p>
				已有账号？
				<a href="/login" class="link">立即登录</a>
			</p>
		</div>
	</div>
</div>

<style>
	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: var(--c-bg);
	}

	.auth-card {
		width: 100%;
		max-width: 420px;
		padding: 2.5rem;
		background: var(--c-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--c-border);
		box-shadow: var(--shadow-md);
	}

	.auth-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.auth-header h1 {
		font-size: 1.8rem;
		margin: 0 0 0.5rem;
		color: var(--c-primary);
		font-family: var(--font-serif);
		letter-spacing: -0.3px;
	}

	.auth-header p {
		margin: 0;
		color: var(--c-text-sub);
		font-size: 0.95rem;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.form-group label {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--c-primary);
	}

	.input {
		padding: 0.75rem 1rem;
		border: 1px solid var(--c-border);
		border-radius: var(--radius-md);
		font-size: 1rem;
		background: var(--c-bg);
		color: var(--c-text-main);
		font-family: var(--font-sans);
		transition: var(--transition);
	}

	.input:focus {
		outline: none;
		border-color: var(--c-primary);
		box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
	}

	.input::placeholder {
		color: var(--c-text-sub);
	}

	.form-hint {
		font-size: 0.85rem;
		color: var(--c-text-sub);
	}

	.alert {
		padding: 0.85rem 1rem;
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		border: 1px solid transparent;
	}

	.alert-error {
		background: rgba(231, 76, 60, 0.08);
		border-color: rgba(231, 76, 60, 0.3);
		color: #e74c3c;
	}

	.btn {
		padding: 0.85rem 1.5rem;
		border: none;
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: var(--transition);
		font-family: var(--font-sans);
	}

	.btn-primary {
		background: var(--c-primary);
		color: white;
	}

	.btn-primary:hover {
		background: #2c3e50;
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}

	.btn-block {
		width: 100%;
	}

	.auth-footer {
		margin-top: 1.5rem;
		text-align: center;
		font-size: 0.9rem;
		color: var(--c-text-sub);
	}

	.link {
		color: var(--c-accent);
		text-decoration: none;
		font-weight: 600;
		padding: 0.2rem 0.4rem;
		border-radius: var(--radius-sm);
		transition: var(--transition);
	}

	.link:hover {
		background: rgba(230, 126, 34, 0.1);
	}
</style>

<script lang="ts">
	 type User = {
	 	id: number;
	 	username: string;
	 	role: string;
	 	student_id?: string;
	 } | null;

	 let {
	 	user = null,
	 	chatOpen = false,
	 	toggleChat
	 }: { user: User; chatOpen?: boolean; toggleChat?: () => void } = $props();

	 const handleToggleChat = () => {
	 	if (typeof toggleChat === 'function') {
	 		toggleChat();
	 	}
	 };
</script>

<header class="global-header">
	<div class="container header-inner">
		<a href="/" class="logo">OpenBrain</a>
		<nav class="nav-links">
			<a href="/" class="nav-link">首页</a>
			<button class="nav-link nav-link-btn" type="button" onclick={handleToggleChat}>
				客服
			</button>
			<a href="/search" class="nav-link">搜索</a>
			<a href="/upload" class="nav-link">上传资源</a>
			{#if user}
				<a href="/my" class="header-btn btn-user">
					<span class="user-icon">👤</span>
					<span>{user.username}</span>
				</a>
			{:else}
				<a href="/login" class="header-btn btn-login">登录</a>
			{/if}
		</nav>
	</div>
</header>

<style>
	.global-header {
		background: rgba(255, 255, 255, 0.85);
		border-bottom: 1px solid var(--c-border);
		padding: 0;
		height: var(--header-height);
		position: sticky;
		top: 0;
		z-index: 100;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
	}

	.logo {
		font-family: var(--font-serif);
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--c-primary);
		letter-spacing: -0.5px;
	}

	.logo:hover {
		color: var(--c-primary-hover);
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-link {
		color: var(--c-text-sub);
		font-size: 0.9rem;
		padding: 0.5rem 0.85rem;
		border-radius: var(--radius-sm);
		transition: var(--transition);
		border: none;
		background: transparent;
		cursor: pointer;
	}

	.nav-link:hover {
		color: var(--c-primary);
		background: rgba(44, 62, 80, 0.05);
	}

	.nav-link-btn {
		border: 1px solid var(--c-border);
		background: rgba(44, 62, 80, 0.03);
	}

	.nav-link-btn:hover {
		background: rgba(44, 62, 80, 0.08);
		color: var(--c-primary);
		border-color: var(--c-primary);
	}

	/* 通用 Header 按钮基础样式 */
	.header-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-sm);
		font-weight: 500;
		font-size: 0.9rem;
		cursor: pointer;
		transition: var(--transition);
		border: 1px solid transparent;
		gap: 0.4rem;
	}

	/* 登录按钮 - 主按钮样式 */
	.btn-login {
		background-color: var(--c-primary);
		color: white;
	}

	.btn-login:hover {
		background-color: var(--c-primary-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	/* 用户按钮 - 次要按钮样式 */
	.btn-user {
		background: rgba(44, 62, 80, 0.06);
		color: var(--c-primary);
		border: 1px solid var(--c-border);
	}

	.btn-user:hover {
		background: rgba(44, 62, 80, 0.1);
		border-color: var(--c-primary);
		transform: translateY(-1px);
	}

	.user-icon {
		font-size: 0.85rem;
	}

	/* 响应式 */
	@media (max-width: 768px) {
		.global-header {
			height: auto;
			padding: 0.75rem 0;
		}

		.header-inner {
			flex-direction: column;
			gap: 0.75rem;
		}

		.nav-links {
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.35rem;
		}

		.nav-link {
			padding: 0.4rem 0.65rem;
			font-size: 0.85rem;
		}

		.header-btn {
			padding: 0.4rem 0.85rem;
			font-size: 0.85rem;
		}
	}
</style>

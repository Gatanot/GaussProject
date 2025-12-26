<script lang="ts">
	type User = {
		id: number;
		username: string;
		role: string;
		student_id?: string;
	} | null;

	let { user = null }: { user: User } = $props();
</script>

<header class="global-header">
	<div class="container header-inner">
		<a href="/" class="logo">OpenBrain</a>
		<nav class="nav-links">
			<a href="/" class="nav-link">首页</a>
			<a href="/search" class="nav-link">搜索</a>
			<a href="/upload" class="nav-link">上传资源</a>
			{#if user}
				<a href="/my" class="nav-link nav-user">👤 {user.username}</a>
			{:else}
				<a href="/login" class="btn btn-ghost">登录</a>
				<a href="/register" class="btn btn-primary">注册</a>
			{/if}
		</nav>
	</div>
</header>

<style>
	.global-header {
		background: var(--c-surface);
		border-bottom: 1px solid var(--c-border);
		padding: 1rem 0;
		position: sticky;
		top: 0;
		z-index: 100;
		backdrop-filter: blur(10px);
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--c-primary);
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.nav-link {
		color: var(--c-text-sub);
		font-size: 0.95rem;
		transition: var(--transition);
	}

	.nav-link:hover {
		color: var(--c-primary);
	}

	.nav-user {
		color: var(--c-primary);
		font-weight: 600;
		padding: 0.5rem 1rem;
		background: rgba(44, 62, 80, 0.05);
		border-radius: var(--radius-sm);
	}

	/* 响应式 */
	@media (max-width: 768px) {
		.header-inner {
			flex-direction: column;
			gap: 1rem;
		}

		.nav-links {
			flex-wrap: wrap;
			justify-content: center;
		}
	}
</style>

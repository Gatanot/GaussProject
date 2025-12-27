<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form: ActionData;

	// 格式化日期
	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// 格式化操作类型
	function formatActionType(type: string): string {
		const map: Record<string, string> = {
			SEARCH: '搜索',
			CLICK_LINK: '访问链接',
			AI_GENERATE: 'AI 生成'
		};
		return map[type] ?? type;
	}

	// 截断文本
	function truncate(text: string, maxLength: number = 80): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength) + '...';
	}

	// 确认删除
	let deletingId: number | null = null;
	function confirmDelete(id: number) {
		deletingId = id;
	}
	function cancelDelete() {
		deletingId = null;
	}
</script>

<svelte:head>
	<title>个人中心 - OpenBrain</title>
</svelte:head>

<div class="my-shell">
	<main class="my-main container">
		<!-- 页面标题 -->
		<div class="page-header">
			<div class="page-header-top">
				<h1>个人中心</h1>
				<form method="POST" action="?/logout" use:enhance>
					<button type="submit" class="btn btn-outline btn-logout">🚪 退出登录</button>
				</form>
			</div>
			<p class="page-subtitle">欢迎回来，{data.user?.username}！</p>
		</div>

		<!-- 错误/成功提示 -->
		{#if data.error}
			<div class="alert alert-error">{data.error}</div>
		{/if}
		{#if form?.message}
			<div class="alert {form.success ? 'alert-success' : 'alert-error'}">
				{form.message}
			</div>
		{/if}

		<!-- 统计卡片区 -->
		<section class="stats-section">
			<h2 class="section-title">📊 贡献统计</h2>
			<div class="stats-grid">
				<div class="stat-card card">
					<div class="stat-icon">📚</div>
					<div class="stat-body">
						<p class="stat-value">{data.stats?.resourceCount ?? 0}</p>
						<p class="stat-label">贡献资源数</p>
					</div>
				</div>
				<div class="stat-card card">
					<div class="stat-icon">👀</div>
					<div class="stat-body">
						<p class="stat-value">{data.stats?.totalViews ?? 0}</p>
						<p class="stat-label">总被阅数</p>
					</div>
				</div>
				<div class="stat-card card">
					<div class="stat-icon">⬇️</div>
					<div class="stat-body">
						<p class="stat-value">{data.stats?.totalDownloads ?? 0}</p>
						<p class="stat-label">总下载次数</p>
					</div>
				</div>
			</div>
		</section>

		<!-- 我的资源列表 -->
		<section class="resources-section">
			<div class="section-header">
				<h2 class="section-title">📁 我贡献的资源</h2>
				<a href="/upload" class="btn btn-primary">+ 上传新资源</a>
			</div>

			{#if data.resources && data.resources.length > 0}
				<div class="resources-list">
					{#each data.resources as resource}
						<article class="resource-item card">
							<div class="resource-header">
								<div class="resource-meta">
									<span class="course-badge">{resource.course_name}</span>
									{#if resource.meta_info?.has_ai_summary}
										<span class="badge badge-green">AI 摘要</span>
									{/if}
								</div>
								<div class="resource-stats-mini">
									<span>👀 {resource.view_count}</span>
									<span>⬇️ {resource.download_count}</span>
								</div>
							</div>

							<a href="/resource/{resource.id}" class="resource-title-link">
								<h3 class="resource-title">{resource.title}</h3>
							</a>

							<p class="resource-excerpt">{truncate(resource.content_detail)}</p>

							{#if resource.tags && resource.tags.length > 0}
								<div class="resource-tags">
									{#each resource.tags as tag}
										<span class="tag">{tag}</span>
									{/each}
								</div>
							{/if}

							<div class="resource-footer">
								<span class="date">发布于 {formatDate(resource.created_at)}</span>
								<div class="resource-actions">
									<a href="/resource/{resource.id}" class="btn btn-ghost">查看</a>
									{#if deletingId === resource.id}
										<form method="POST" action="?/deleteResource" use:enhance>
											<input type="hidden" name="resourceId" value={resource.id} />
											<button type="submit" class="btn btn-danger">确认删除</button>
											<button type="button" class="btn btn-ghost" on:click={cancelDelete}>取消</button>
										</form>
									{:else}
										<button class="btn btn-outline" on:click={() => confirmDelete(resource.id)}>删除</button>
									{/if}
								</div>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<div class="empty-state card">
					<div class="empty-icon">📭</div>
					<h3>还没有贡献任何资源</h3>
					<p>分享你的学习资料，帮助更多同学！</p>
					<a href="/upload" class="btn btn-primary">上传第一个资源</a>
				</div>
			{/if}
		</section>

		<!-- 最近活动 -->
		{#if data.recentActions && data.recentActions.length > 0}
			<section class="activity-section">
				<h2 class="section-title">🕐 最近活动</h2>
				<div class="activity-list card">
					{#each data.recentActions as action}
						<div class="activity-item">
							<span class="activity-type">{formatActionType(action.action_type)}</span>
							{#if action.payload}
								<span class="activity-payload">"{truncate(action.payload, 30)}"</span>
							{/if}
							<span class="activity-time">{formatDate(action.created_at)}</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</main>

	<!-- 底部 -->
	<footer class="my-footer">
		<div class="container">
			<p>OpenBrain · 校园知识索引平台 · 基于 OpenGauss 全文检索</p>
		</div>
	</footer>
</div>

<style>
	/* 页面外壳 */
	.my-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--c-bg);
	}

	/* 主内容区 */
	.my-main {
		flex: 1;
		padding: 2rem 0 4rem;
	}

	/* 页面标题 */
	.page-header {
		margin-bottom: 2rem;
	}

	.page-header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.page-header h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.btn-logout {
		color: var(--c-text-sub);
		border-color: var(--c-border);
	}

	.btn-logout:hover {
		color: #DC2626;
		border-color: #DC2626;
		background: rgba(220, 38, 38, 0.05);
	}

	.page-subtitle {
		color: var(--c-text-sub);
		font-size: 1.05rem;
	}

	/* 提示消息 */
	.alert {
		padding: 1rem 1.5rem;
		border-radius: var(--radius-md);
		margin-bottom: 1.5rem;
		font-weight: 500;
	}

	.alert-error {
		background: #FEE2E2;
		color: #991B1B;
		border: 1px solid #FECACA;
	}

	.alert-success {
		background: #D1FAE5;
		color: #065F46;
		border: 1px solid #A7F3D0;
	}

	/* 统计区 */
	.stats-section {
		margin-bottom: 3rem;
	}

	.section-title {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
	}

	.stat-card:hover {
		transform: translateY(-2px);
	}

	.stat-icon {
		font-size: 2rem;
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(44, 62, 80, 0.05);
		border-radius: var(--radius-md);
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--c-primary);
		font-family: var(--font-serif);
		line-height: 1.2;
	}

	.stat-label {
		color: var(--c-text-sub);
		font-size: 0.9rem;
	}

	/* 资源列表 */
	.resources-section {
		margin-bottom: 3rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.resources-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.resource-item {
		padding: 1.5rem;
	}

	.resource-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.resource-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.course-badge {
		background: var(--c-primary);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.resource-stats-mini {
		display: flex;
		gap: 1rem;
		font-size: 0.85rem;
		color: var(--c-text-sub);
	}

	.resource-title-link {
		text-decoration: none;
	}

	.resource-title {
		font-size: 1.125rem;
		color: var(--c-primary);
		margin-bottom: 0.5rem;
		transition: var(--transition);
	}

	.resource-title:hover {
		color: var(--c-accent);
	}

	.resource-excerpt {
		color: var(--c-text-sub);
		font-size: 0.95rem;
		line-height: 1.6;
		margin-bottom: 0.75rem;
	}

	.resource-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.tag {
		background: #F3F4F6;
		color: var(--c-text-sub);
		padding: 0.2rem 0.6rem;
		border-radius: 9999px;
		font-size: 0.75rem;
	}

	.resource-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid var(--c-border);
	}

	.date {
		color: var(--c-text-sub);
		font-size: 0.85rem;
	}

	.resource-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.resource-actions form {
		display: flex;
		gap: 0.5rem;
	}

	/* 按钮样式扩展 */
	.btn-danger {
		background: var(--c-danger);
		color: white;
		border: none;
	}

	.btn-danger:hover {
		background: #DC2626;
	}

	/* 空状态 */
	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: var(--c-text-sub);
		margin-bottom: 1.5rem;
	}

	/* 活动记录 */
	.activity-section {
		margin-bottom: 2rem;
	}

	.activity-list {
		padding: 1rem 1.5rem;
	}

	.activity-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--c-border);
	}

	.activity-item:last-child {
		border-bottom: none;
	}

	.activity-type {
		background: rgba(44, 62, 80, 0.1);
		color: var(--c-primary);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		font-weight: 600;
		min-width: 70px;
		text-align: center;
	}

	.activity-payload {
		flex: 1;
		color: var(--c-text-main);
		font-size: 0.9rem;
	}

	.activity-time {
		color: var(--c-text-sub);
		font-size: 0.8rem;
	}

	/* 底部 */
	.my-footer {
		background: var(--c-surface);
		border-top: 1px solid var(--c-border);
		padding: 2rem 0;
		text-align: center;
		color: var(--c-text-sub);
		font-size: 0.9rem;
	}

	/* 响应式 */
	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.resource-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.resource-footer {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.section-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
</style>

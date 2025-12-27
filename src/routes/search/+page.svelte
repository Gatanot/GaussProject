<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	let searchQuery = data.query || '';

	function performSearch() {
		if (searchQuery.trim()) {
			window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			performSearch();
		}
	}

	// 格式化日期
	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{data.query ? `"${data.query}" 的搜索结果` : '搜索'} - OpenBrain</title>
</svelte:head>

<div class="search-shell">
	<!-- 顶部搜索区 -->
	<div class="search-header">
		<div class="container">
			<div class="search-bar-wrap">
				<div class="search-input-group">
					<input
						type="text"
						bind:value={searchQuery}
						on:keypress={handleKeyPress}
						placeholder="搜索课程资料、笔记、题库..."
						class="search-input-main"
					/>
				</div>
				<button on:click={performSearch} class="btn btn-primary">搜索</button>
			</div>
		</div>
	</div>

	<!-- 搜索结果区 -->
	<main class="search-main container">
		{#if data.error}
			<div class="error-banner">
				<p>{data.error}</p>
			</div>
		{/if}

		{#if data.query}
			<div class="results-summary">
				<p class="results-count">
					找到 <strong>{data.total}</strong> 条关于 "<strong>{data.query}</strong>" 的结果
				</p>
			</div>

			{#if data.results && data.results.length > 0}
				<div class="results-list">
					{#each data.results as result}
						<article class="result-card card">
							<div class="result-meta">
								<span class="course-badge">{result.course_name}</span>
								{#if result.course_teacher}
									<span class="teacher-info">{result.course_teacher}</span>
								{/if}
								<span class="stats">
									{result.view_count} 次查看 · {result.download_count} 次下载
								</span>
							</div>

							<a href="/resource/{result.id}" class="result-title-link">
								<h2 class="result-title">{result.title}</h2>
							</a>

							<!-- 使用 @html 渲染高亮的摘要 -->
							<p class="result-snippet">{@html result.snippet}</p>

							<div class="result-footer">
								<span class="author">
									<span class="author-icon">👤</span>
									{result.author_name}
								</span>
								<span class="date">{formatDate(result.created_at)}</span>
								<a href="/resource/{result.id}" class="view-link">
									查看详情 →
								</a>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<div class="no-results">
					<div class="no-results-icon">🔍</div>
					<h3>未找到相关资源</h3>
					
					{#if data.suggestion}
						<div class="suggestion-box">
							<p>你是不是想找：<a href="/search?q={encodeURIComponent(data.suggestion)}" class="suggestion-link">{data.suggestion}</a> ?</p>
						</div>
					{:else}
						<p>尝试使用不同的关键词，或者浏览热门资源</p>
					{/if}

					<div class="suggestions">
						<p>建议：</p>
						<ul>
							<li>检查关键词拼写是否正确</li>
							<li>尝试使用更通用的词汇</li>
							<li>使用课程名称或教师名称搜索</li>
						</ul>
					</div>
					<a href="/" class="btn btn-primary">返回首页</a>
				</div>
			{/if}
		{:else}
			<!-- 空查询状态 -->
			<div class="empty-search">
				<div class="empty-icon">📚</div>
				<h3>输入关键词开始搜索</h3>
				<p>支持搜索课程名称、资源标题、内容关键词</p>
			</div>
		{/if}
	</main>

	<!-- 底部 -->
	<footer class="search-footer">
		<div class="container">
			<p>OpenBrain · 校园知识索引平台 · 基于 OpenGauss 全文检索</p>
		</div>
	</footer>
</div>

<style>
	.search-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--c-bg);
	}

	/* 顶部搜索区 */
	.search-header {
		background: var(--c-surface);
		border-bottom: 1px solid var(--c-border);
		padding: 1rem 0;
	}

	.search-header .container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.search-bar-wrap {
		width: 100%;
		display: flex;
		gap: 0.75rem;
		max-width: 700px;
	}

	.search-input-group {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		font-size: 1rem;
		opacity: 0.5;
		pointer-events: none;
	}

	.search-input-main {
		flex: 1;
		padding: 0.75rem 1rem 0.75rem 2.75rem;
		border: 1px solid var(--c-border);
		border-radius: var(--radius-md);
		font-size: 0.95rem;
		transition: var(--transition);
	}

	.search-input-main:focus {
		outline: none;
		border-color: var(--c-primary);
		box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
	}

	/* 搜索主体 */
	.search-main {
		flex: 1;
		padding: 2rem 1.5rem;
	}

	.results-summary {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--c-border);
	}

	.results-count {
		color: var(--c-text-sub);
		font-size: 0.95rem;
	}

	.results-count strong {
		color: var(--c-primary);
	}

	/* 搜索结果卡片 */
	.results-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.result-card {
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		transition: var(--transition);
	}

	.result-card:hover {
		box-shadow: var(--shadow-hover);
		transform: translateY(-2px);
	}

	.result-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}

	.course-badge {
		display: inline-flex;
		padding: 0.25rem 0.65rem;
		background: rgba(44, 62, 80, 0.08);
		color: var(--c-primary);
		border-radius: var(--radius-sm);
		font-size: 0.82rem;
		font-weight: 600;
	}

	.teacher-info {
		font-size: 0.85rem;
		color: var(--c-text-sub);
	}

	.stats {
		font-size: 0.82rem;
		color: var(--c-text-sub);
		margin-left: auto;
	}

	.result-title-link {
		text-decoration: none;
	}

	.result-title {
		font-family: var(--font-serif);
		font-size: 1.25rem;
		color: var(--c-primary);
		margin: 0 0 0.6rem;
		line-height: 1.4;
		transition: var(--transition);
	}

	.result-title-link:hover .result-title {
		color: var(--c-accent);
	}

	.result-snippet {
		color: var(--c-text-main);
		font-size: 0.95rem;
		line-height: 1.65;
		margin-bottom: 1rem;
	}

	/* 高亮标记样式 */
	.result-snippet :global(mark) {
		background: rgba(230, 126, 34, 0.25);
		color: var(--c-accent);
		padding: 0.1rem 0.25rem;
		border-radius: 2px;
		font-weight: 600;
	}

	.result-footer {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.85rem;
		color: var(--c-text-sub);
	}

	.author {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.author-icon {
		font-size: 0.9rem;
	}

	.view-link {
		margin-left: auto;
		color: var(--c-primary);
		font-weight: 500;
		transition: var(--transition);
	}

	.view-link:hover {
		color: var(--c-accent);
	}

	/* 无结果 / 空状态 */
	.no-results,
	.empty-search {
		text-align: center;
		padding: 4rem 2rem;
	}

	.no-results-icon,
	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.no-results h3,
	.empty-search h3 {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		color: var(--c-primary);
		margin-bottom: 0.5rem;
	}

	.no-results p,
	.empty-search p {
		color: var(--c-text-sub);
		margin-bottom: 1.5rem;
	}

	.suggestion-box {
		margin-bottom: 1.5rem;
		font-size: 1.1rem;
		color: var(--c-text-main);
	}

	.suggestion-link {
		color: var(--c-accent);
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.suggestion-link:hover {
		color: var(--c-primary);
	}

	.suggestions {
		text-align: left;
		display: inline-block;
		background: var(--c-surface);
		padding: 1rem 1.5rem;
		border-radius: var(--radius-md);
		margin-bottom: 1.5rem;
		border: 1px solid var(--c-border);
	}

	.suggestions p {
		font-weight: 600;
		color: var(--c-text-main);
		margin-bottom: 0.5rem;
	}

	.suggestions ul {
		color: var(--c-text-sub);
		padding-left: 1.2rem;
		margin: 0;
	}

	.suggestions li {
		margin-bottom: 0.3rem;
	}

	/* 错误提示 */
	.error-banner {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: var(--c-danger);
		padding: 1rem;
		border-radius: var(--radius-md);
		margin-bottom: 1.5rem;
	}

	/* 底部 */
	.search-footer {
		background: var(--c-surface);
		border-top: 1px solid var(--c-border);
		padding: 1.5rem 0;
		text-align: center;
	}

	.search-footer p {
		color: var(--c-text-sub);
		font-size: 0.85rem;
	}

	/* 按钮基础与主样式 */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.6rem 1.2rem;
		border-radius: var(--radius-md);
		font-weight: 500;
		font-size: 0.95rem;
		cursor: pointer;
		transition: var(--transition);
		border: 1px solid var(--c-border);
		background-color: var(--c-bg);
		color: var(--c-text-main);
	}

	.btn:hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.btn-primary {
		background-color: var(--c-primary);
		border-color: var(--c-primary);
		color: #fff;
	}

	.btn-primary:hover {
		background-color: var(--c-primary-hover);
	}

	/* 响应式 */
	@media (max-width: 768px) {
		.search-header .container {
			flex-direction: column;
			gap: 1rem;
		}

		.search-bar-wrap {
			width: 100%;
			max-width: none;
		}

		.result-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.stats {
			margin-left: 0;
		}

		.result-footer {
			flex-wrap: wrap;
		}

		.view-link {
			margin-left: 0;
			width: 100%;
			margin-top: 0.5rem;
		}
	}
</style>

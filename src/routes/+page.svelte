<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	let searchQuery = '';

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
</script>

<div class="home-shell">
	<section class="hero">
		<div class="container hero-inner">
			<div class="hero-copy">
				<div class="eyebrow">未来的数字图书馆 · OpenBrain</div>
				<h1>找到想学的，快且准。</h1>
				<p class="lead">基于 OpenGauss 的校园知识索引，聚合课程资料、笔记与题库，让内容成为主角。</p>

				<div class="hero-panels">
					<div class="search-panel card">
						<div class="panel-head">
							<div>
								<p class="panel-label">全局搜索</p>
								<p class="panel-hint">支持课程名 / 资源标题 / 关键词</p>
							</div>
							<span class="pill">极速检索</span>
						</div>
						<div class="search-box">
							<input
								type="text"
								bind:value={searchQuery}
								on:keypress={handleKeyPress}
								placeholder="试试 “数据库实验报告”"
								class="search-input"
							/>
							<button on:click={performSearch} class="search-button btn btn-primary">
								<span>搜索</span>
							</button>
						</div>

						{#if data.hotSearches && data.hotSearches.length > 0}
							<div class="hot-searches">
								<span class="hot-label">热门</span>
								{#each data.hotSearches as search, index}
									<button
										class="hot-tag"
										on:click={() => (searchQuery = search.payload)}
									>
										{index + 1}. {search.payload}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<div class="hero-meta">
						<div class="meta-card">
							<p class="meta-label">热门资源</p>
							<p class="meta-value">{data.hotResources?.length ?? 0}</p>
							<p class="meta-hint">实时更新的课程资料</p>
						</div>
						<div class="meta-card">
							<p class="meta-label">搜索热词</p>
							<p class="meta-value">{data.hotSearches?.length ?? 0}</p>
							<p class="meta-hint">同学们正在找什么</p>
						</div>
						<div class="meta-card">
							<p class="meta-label">AI 摘要</p>
							<p class="meta-value">精准</p>
							<p class="meta-hint">关键句提炼，快速预览</p>
						</div>
					</div>
				</div>
			</div>
			<div class="hero-aside card">
				<p class="aside-title">为什么是 OpenBrain？</p>
				<ul>
					<li><span class="dot" aria-hidden="true"></span>纸张感排版 + 衬线标题，阅读轻松。</li>
					<li><span class="dot" aria-hidden="true"></span>聚焦内容本身，无霓虹、无噪点。</li>
					<li><span class="dot" aria-hidden="true"></span>全局关键词联想，先搜到，再深入。</li>
				</ul>
			</div>
		</div>
	</section>

	{#if data.hotResources && data.hotResources.length > 0}
		<section class="hot-resources container">
			<div class="section-header">
				<div>
					<p class="eyebrow">精选</p>
					<h2>热门资源</h2>
					<p class="section-hint">被反复查看与下载的课程资料</p>
				</div>
				<a href="/search" class="view-all">查看全部 →</a>
			</div>

			<div class="resources-grid">
				{#each data.hotResources as resource}
					<a href="/resource/{resource.id}" class="resource-card card">
						<div class="resource-header">
							<span class="course-tag">{resource.course_name}</span>
							<span class="resource-stats">{resource.view_count} 次查看 · {resource.download_count} 次下载</span>
						</div>
						<h3 class="resource-title">{resource.title}</h3>
						<p class="resource-excerpt">{resource.content_detail}</p>
						<div class="resource-footer">
							<span class="author">{resource.author_name}</span>
							<span class="course-name">{resource.course_name}</span>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<section class="features container">
		<div class="section-header center">
			<p class="eyebrow">效率 x 深度</p>
			<h2>平台特色</h2>
			<p class="section-hint">把时间留给思考，而不是翻找文件</p>
		</div>
		<div class="features-grid">
			<div class="feature-card card">
				<div class="feature-icon">全文检索</div>
				<div class="feature-body">
					<h3>智能全文检索</h3>
					<p>依托 OpenGauss 索引，返回高精度片段并高亮关键句。</p>
				</div>
			</div>
			<div class="feature-card card">
				<div class="feature-icon">AI 摘要</div>
				<div class="feature-body">
					<h3>语义级摘要</h3>
					<p>自动提炼文档要点，阅读前先确认是否匹配需求。</p>
				</div>
			</div>
			<div class="feature-card card">
				<div class="feature-icon">多来源</div>
				<div class="feature-body">
					<h3>轻量链接</h3>
					<p>存储资源链接而非大文件，兼容网盘、GitHub、校内盘。</p>
				</div>
			</div>
			<div class="feature-card card">
				<div class="feature-icon">趋势</div>
				<div class="feature-body">
					<h3>热度追踪</h3>
					<p>洞察同学们在搜什么、看什么，快速聚焦高质量内容。</p>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.home-shell {
		background: var(--c-bg);
		min-height: 100vh;
		padding-bottom: 4rem;
	}

	.hero {
		background: var(--c-surface);
		border-bottom: 1px solid var(--c-border);
		padding: 4.5rem 0 3.5rem;
	}

	.hero-inner {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
		align-items: start;
	}

	.hero-copy h1 {
		font-size: 2.6rem;
		margin: 0.35rem 0 0.5rem;
		letter-spacing: -0.8px;
	}

	.lead {
		font-size: 1.05rem;
		color: var(--c-text-sub);
		max-width: 680px;
		margin-bottom: 1.75rem;
	}

	.eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.8rem;
		font-size: 0.85rem;
		color: var(--c-primary);
		background: rgba(44, 62, 80, 0.06);
		border-radius: var(--radius-sm);
		font-weight: 700;
		letter-spacing: 0.3px;
	}

	.hero-panels {
		display: grid;
		grid-template-columns: 1.6fr 1fr;
		gap: 1rem;
	}

	.search-panel {
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
	}

	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.9rem;
	}

	.panel-label {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--c-primary);
	}

	.panel-hint {
		font-size: 0.9rem;
		color: var(--c-text-sub);
		margin-top: 0.2rem;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--c-accent);
		background: rgba(230, 126, 34, 0.12);
	}

	.search-box {
		display: flex;
		gap: 0.75rem;
		padding: 0.6rem;
		border: 1px solid var(--c-border);
		border-radius: var(--radius-lg);
		background: var(--c-surface);
	}

	.search-input {
		flex: 1;
		border: none;
		outline: none;
		padding: 0.85rem 1rem;
		font-size: 1rem;
		background: transparent;
		color: var(--c-text-main);
		font-family: var(--font-sans);
	}

	.search-input::placeholder {
		color: var(--c-text-sub);
	}

	.search-button {
		padding: 0.85rem 1.6rem;
		font-size: 1rem;
	}

	.hot-searches {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		align-items: center;
		margin-top: 0.75rem;
	}

	.hot-label {
		font-weight: 700;
		color: var(--c-primary);
	}

	.hot-tag {
		border: 1px solid var(--c-border);
		background: rgba(44, 62, 80, 0.02);
		color: var(--c-text-sub);
		padding: 0.4rem 0.9rem;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: var(--transition);
	}

	.hot-tag:hover {
		border-color: var(--c-primary);
		color: var(--c-primary);
		transform: translateY(-1px);
	}

	.hero-meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
	}

	.meta-card {
		background: rgba(44, 62, 80, 0.04);
		border: 1px solid var(--c-border);
		border-radius: var(--radius-md);
		padding: 0.9rem 1rem;
	}

	.meta-label {
		font-size: 0.85rem;
		color: var(--c-text-sub);
		margin: 0 0 0.35rem;
		font-weight: 600;
	}

	.meta-value {
		font-size: 1.35rem;
		margin: 0;
		color: var(--c-primary);
		font-family: var(--font-serif);
		font-weight: 700;
		letter-spacing: -0.2px;
	}

	.meta-hint {
		margin: 0.2rem 0 0;
		font-size: 0.9rem;
		color: var(--c-text-sub);
	}

	.hero-aside {
		background: var(--c-bg);
		border-radius: var(--radius-lg);
		border: 1px solid var(--c-border);
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
	}

	.aside-title {
		margin: 0 0 0.8rem;
		font-weight: 700;
		color: var(--c-primary);
	}

	.hero-aside ul {
		list-style: none;
		display: grid;
		gap: 0.6rem;
		color: var(--c-text-sub);
		font-size: 0.95rem;
	}

	.dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--c-accent);
		margin-right: 0.45rem;
		transform: translateY(-1px);
	}

	.hot-resources,
	.features {
		margin-top: 3.5rem;
	}

	.section-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.section-header.center {
		flex-direction: column;
		text-align: center;
		align-items: center;
		gap: 0.35rem;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.9rem;
		color: var(--c-primary);
	}

	.section-hint {
		margin: 0;
		color: var(--c-text-sub);
		font-size: 0.95rem;
	}

	.view-all {
		color: var(--c-accent);
		font-weight: 700;
		font-size: 0.95rem;
		padding: 0.45rem 0.75rem;
		border-radius: var(--radius-sm);
		transition: var(--transition);
	}

	.view-all:hover {
		background: rgba(230, 126, 34, 0.1);
		transform: translateY(-1px);
	}

	.resources-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	.resource-card {
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.resource-card:hover {
		border-color: var(--c-primary);
		box-shadow: var(--shadow-hover);
	}

	.resource-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		font-size: 0.9rem;
	}

	.course-tag {
		background: rgba(44, 62, 80, 0.06);
		color: var(--c-primary);
		padding: 0.25rem 0.7rem;
		border-radius: var(--radius-sm);
		font-weight: 700;
		border: 1px solid var(--c-border);
	}

	.resource-stats {
		color: var(--c-text-sub);
		white-space: nowrap;
	}

	.resource-title {
		font-size: 1.2rem;
		margin: 0;
		line-height: 1.35;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.resource-excerpt {
		margin: 0;
		color: var(--c-text-sub);
		line-height: 1.6;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.resource-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0.75rem;
		border-top: 1px solid var(--c-border);
		font-size: 0.92rem;
	}

	.author {
		color: var(--c-text-sub);
	}

	.course-name {
		color: var(--c-accent);
		font-weight: 700;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.25rem;
	}

	.feature-card {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1rem;
		align-items: start;
	}

	.feature-icon {
		width: 52px;
		height: 52px;
		background: rgba(44, 62, 80, 0.08);
		border-radius: var(--radius-md);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--c-primary);
		font-weight: 700;
		font-size: 0.9rem;
		border: 1px solid var(--c-border);
	}

	.feature-body h3 {
		margin: 0 0 0.35rem;
		font-size: 1.15rem;
	}

	.feature-body p {
		margin: 0;
		color: var(--c-text-sub);
		line-height: 1.6;
		font-size: 0.95rem;
	}

	@media (max-width: 1024px) {
		.hero-inner {
			grid-template-columns: 1fr;
		}

		.hero-panels {
			grid-template-columns: 1fr;
		}

		.hero-aside {
			order: -1;
		}
	}

	@media (max-width: 720px) {
		.hero-copy h1 {
			font-size: 2.1rem;
		}

		.search-box {
			flex-direction: column;
		}

		.search-button {
			width: 100%;
		}

		.resources-grid {
			grid-template-columns: 1fr;
		}

		.section-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>

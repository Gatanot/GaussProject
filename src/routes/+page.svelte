<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	let searchQuery = '';
	let showHotResources = false;

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

	function toggleHotResources() {
		showHotResources = !showHotResources;
	}

	function closeHotResources() {
		showHotResources = false;
	}
</script>

<div class="home-shell">
	<section class="hero">
		<div class="container">
			<!-- 顶部标题区：居中展示品牌与核心文案 -->
			<div class="hero-header">
				<span class="brand-tag">未来的数字图书馆 · OpenBrain</span>
				<h1>找到想学的，快且准。</h1>
				<p class="lead">基于 OpenGauss 的校园知识索引，聚合课程资料、笔记与题库，让内容成为主角。</p>
			</div>

			<!-- 搜索区：核心交互 -->
			<div class="search-section">
				<div class="search-wrapper">
					<div class="search-box-main">
						<input
							type="text"
							bind:value={searchQuery}
							on:keypress={handleKeyPress}
							placeholder="搜索课程名、资源标题或关键词..."
							class="search-input-main"
						/>
						<button on:click={performSearch} class="search-btn btn btn-primary">
							<span>搜索</span>
						</button>
					</div>
					{#if data.hotSearches && data.hotSearches.length > 0}
						<div class="hot-keywords">
							<span class="hot-label">热搜</span>
							{#each data.hotSearches as search, index}
								<button
									class="keyword-chip"
									on:click={() => (searchQuery = search.payload)}
								>
									{search.payload}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- 统计与特点区：横向排列 -->
			<div class="hero-stats-row">
				<button class="stat-item stat-clickable" on:click={toggleHotResources}>
					<span class="stat-value">{data.hotResources?.length ?? 0}</span>
					<span class="stat-label">热门资源</span>
				</button>
				<div class="stat-divider"></div>
				<div class="stat-item">
					<span class="stat-value">{data.hotSearches?.length ?? 0}</span>
					<span class="stat-label">搜索热词</span>
				</div>
				<div class="stat-divider"></div>
				<a href="/upload" class="stat-item">
					<span class="stat-value">AI</span>
					<span class="stat-label">智能摘要</span>
				</a>
			</div>

			<!-- 特点卡片区 -->
			<div class="features-row">
				<div class="feature-chip">
					<span class="feature-dot"></span>
					<span>纸张感排版，阅读轻松</span>
				</div>
				<div class="feature-chip">
					<span class="feature-dot"></span>
					<span>聚焦内容，无多余干扰</span>
				</div>
				<div class="feature-chip">
					<span class="feature-dot"></span>
					<span>全局联想，精准定位</span>
				</div>
			</div>
		</div>
	</section>

	<!-- 热门资源弹窗 -->
	{#if showHotResources && data.hotResources && data.hotResources.length > 0}
		<div class="modal-overlay" on:click={closeHotResources} on:keydown={(e) => e.key === 'Escape' && closeHotResources()} role="button" tabindex="0" aria-label="关闭弹窗">
			<div class="modal-card" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
				<div class="modal-header">
					<div class="modal-title-group">
						<span class="section-badge">精选</span>
						<h2 id="modal-title">热门资源</h2>
					</div>
					<button class="modal-close" on:click={closeHotResources} aria-label="关闭">×</button>
				</div>
				<p class="modal-desc">被反复查看与下载的课程资料</p>
				<div class="modal-resources-list">
					{#each data.hotResources as resource}
						<a href="/resource/{resource.id}" class="modal-resource-item">
							<div class="resource-meta">
								<span class="tag-course">{resource.course_name}</span>
								<span class="meta-stats">
									<span class="stat">{resource.view_count} 阅读</span>
									<span class="stat-sep">·</span>
									<span class="stat">{resource.download_count} 下载</span>
								</span>
							</div>
							<h3 class="resource-name">{resource.title}</h3>
							<p class="resource-summary">{resource.content_detail}</p>
							<div class="resource-author">
								<span class="author-name">{resource.author_name}</span>
							</div>
						</a>
					{/each}
				</div>
				<div class="modal-footer">
					<a href="/search" class="link-more">查看全部资源 →</a>
				</div>
			</div>
		</div>
	{/if}

	<section class="section-features">
		<div class="container">
			<div class="section-head center">
				<span class="section-badge">效率 × 深度</span>
				<h2>平台特色</h2>
				<p class="section-desc">把时间留给思考，而不是翻找文件</p>
			</div>

			<div class="features-list">
				<div class="feature-item card">
					<div class="feature-badge">检索</div>
					<div class="feature-content">
						<h3>智能全文检索</h3>
						<p>依托 OpenGauss 索引，返回高精度片段并高亮关键句。</p>
					</div>
				</div>
				<div class="feature-item card">
					<div class="feature-badge">AI</div>
					<div class="feature-content">
						<h3>语义级摘要</h3>
						<p>自动提炼文档要点，阅读前先确认是否匹配需求。</p>
					</div>
				</div>
				<div class="feature-item card">
					<div class="feature-badge">链接</div>
					<div class="feature-content">
						<h3>轻量多来源</h3>
						<p>存储资源链接而非大文件，兼容网盘、GitHub、校内盘。</p>
					</div>
				</div>
				<div class="feature-item card">
					<div class="feature-badge">趋势</div>
					<div class="feature-content">
						<h3>热度追踪</h3>
						<p>洞察同学们在搜什么、看什么，快速聚焦高质量内容。</p>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	/* ========== Hero 区域 - 现代居中布局 ========== */
	.home-shell {
		background: var(--c-bg);
		min-height: 100vh;
		padding-bottom: 4rem;
	}

	.hero {
    background: var(--c-surface);
    border-bottom: 1px solid var(--c-border);
    
    /* --- 新增/修改的代码开始 --- */
    min-height: 90vh;        /* 1. 强制最小高度为视口高度（占满一屏） */
    display: flex;            /* 2. 启用 Flex 布局 */
    flex-direction: column;   /* 3. 设置主轴为垂直方向 */
    justify-content: center;  /* 4. 让内容在垂直方向居中 */
    padding: 0;               /* 5. 清除原有的上下内边距，完全交由 Flex 居中 */
    /* --- 新增/修改的代码结束 --- */
}

	/* 标题区：居中排列 */
	.hero-header {
		text-align: center;
		max-width: 640px;
		margin: 0 auto 2rem;
	}

	.brand-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 1rem;
		font-size: 0.85rem;
		color: var(--c-primary);
		background: rgba(44, 62, 80, 0.06);
		border-radius: var(--radius-sm);
		font-weight: 700;
		letter-spacing: 0.3px;
		margin-bottom: 0.75rem;
	}

	.hero-header h1 {
		font-size: 2.5rem;
		margin: 0.5rem 0;
		letter-spacing: -0.5px;
		color: var(--c-primary);
	}

	.lead {
		font-size: 1.05rem;
		color: var(--c-text-sub);
		margin: 0;
		line-height: 1.7;
	}

	/* 搜索区：居中展示 */
	.search-section {
		max-width: 680px;
		margin: 0 auto 2rem;
	}

	.search-wrapper {
		background: var(--c-surface);
		border: 1px solid var(--c-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		box-shadow: var(--shadow-md);
	}

	.search-box-main {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.search-input-main {
		flex: 1;
		border: 1px solid var(--c-border);
		border-radius: var(--radius-md);
		padding: 0.85rem 1.15rem;
		font-size: 1rem;
		background: var(--c-bg);
		color: var(--c-text-main);
		font-family: var(--font-sans);
		outline: none;
		transition: var(--transition);
	}

	.search-input-main:focus {
		border-color: var(--c-primary);
		box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.08);
	}

	.search-input-main::placeholder {
		color: var(--c-text-sub);
	}

	.search-btn {
		padding: 0.85rem 1.75rem;
		font-size: 1rem;
		white-space: nowrap;
	}

	/* 热搜关键词 */
	.hot-keywords {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--c-border);
	}

	.hot-label {
		font-weight: 700;
		color: var(--c-primary);
		font-size: 0.875rem;
		margin-right: 0.25rem;
	}

	.keyword-chip {
		border: 1px solid var(--c-border);
		background: var(--c-bg);
		color: var(--c-text-sub);
		padding: 0.35rem 0.85rem;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: var(--transition);
		font-size: 0.875rem;
	}

	.keyword-chip:hover {
		border-color: var(--c-primary);
		color: var(--c-primary);
		background: rgba(44, 62, 80, 0.04);
	}

	/* 统计数据横排 */
	.hero-stats-row {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 2rem;
		margin-bottom: 1.5rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		text-decoration: none;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--c-primary);
		font-family: var(--font-serif);
	}

	.stat-label {
		font-size: 0.85rem;
		color: var(--c-text-sub);
	}

	/* 可点击的统计项 */
	.stat-clickable {
		cursor: pointer;
		padding: 0;
		border: none;
		background: transparent;
		border-radius: var(--radius-md);
		transition: var(--transition);
	}

	.stat-clickable:hover {
		opacity: 0.7;
	}

	.stat-divider {
		width: 1px;
		height: 2.5rem;
		background: var(--c-border);
	}

	/* 特点横排 */
	.features-row {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.feature-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--c-bg);
		border: 1px solid var(--c-border);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: var(--c-text-sub);
		transition: var(--transition);
	}

	.feature-chip:hover {
		border-color: var(--c-primary);
		color: var(--c-text-main);
	}

	.feature-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--c-accent);
	}

	/* ========== 热门资源弹窗 ========== */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-card {
		background: var(--c-surface);
		border: 1px solid var(--c-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		max-width: 800px;
		width: 100%;
		max-height: 85vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.25s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem 0.5rem;
	}

	.modal-title-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--c-primary);
		font-family: var(--font-serif);
	}

	.modal-close {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--c-text-sub);
		font-size: 1.5rem;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: var(--transition);
	}

	.modal-close:hover {
		background: rgba(44, 62, 80, 0.06);
		color: var(--c-primary);
	}

	.modal-desc {
		padding: 0 1.5rem 1rem;
		margin: 0;
		color: var(--c-text-sub);
		font-size: 0.9rem;
	}

	.modal-resources-list {
		flex: 1;
		overflow-y: auto;
		padding: 0 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-resource-item {
		text-decoration: none;
		color: inherit;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border: 1px solid var(--c-border);
		border-radius: var(--radius-md);
		background: var(--c-bg);
		transition: var(--transition);
	}

	.modal-resource-item:hover {
		border-color: var(--c-primary);
		box-shadow: var(--shadow-md);
	}

	.modal-resource-item .resource-name {
		font-size: 1rem;
	}

	.modal-resource-item .resource-summary {
		font-size: 0.85rem;
		line-clamp: 2;
		-webkit-line-clamp: 2;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--c-border);
		text-align: center;
	}

	.section-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.5rem;
		margin-bottom: 1.5rem;
	}

	.section-head.center {
		flex-direction: column;
		text-align: center;
		gap: 0.5rem;
	}

	.section-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.3rem 0.75rem;
		font-size: 0.8rem;
		color: var(--c-accent);
		background: rgba(230, 126, 34, 0.1);
		border-radius: var(--radius-sm);
		font-weight: 700;
		letter-spacing: 0.3px;
	}

	.section-head h2 {
		margin: 0;
		font-size: 1.75rem;
		color: var(--c-primary);
		font-family: var(--font-serif);
	}

	.section-desc {
		margin: 0;
		color: var(--c-text-sub);
		font-size: 0.95rem;
		flex: 1;
	}

	.link-more {
		color: var(--c-accent);
		font-weight: 600;
		font-size: 0.9rem;
		padding: 0.4rem 0.75rem;
		border-radius: var(--radius-sm);
		transition: var(--transition);
		margin-left: auto;
	}

	.link-more:hover {
		background: rgba(230, 126, 34, 0.1);
	}

	.resource-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.tag-course {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.6rem;
		font-size: 0.8rem;
		color: var(--c-primary);
		background: rgba(44, 62, 80, 0.06);
		border: 1px solid var(--c-border);
		border-radius: var(--radius-sm);
		font-weight: 600;
	}

	.meta-stats {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: var(--c-text-sub);
	}

	.stat-sep {
		color: var(--c-border);
	}

	.resource-name {
		font-size: 1.1rem;
		margin: 0;
		line-height: 1.4;
		color: var(--c-primary);
		font-family: var(--font-serif);
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.resource-summary {
		margin: 0;
		color: var(--c-text-sub);
		font-size: 0.9rem;
		line-height: 1.6;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.resource-author {
		display: flex;
		align-items: center;
		padding-top: 0.65rem;
		border-top: 1px solid var(--c-border);
		margin-top: auto;
	}

	.author-name {
		font-size: 0.85rem;
		color: var(--c-text-sub);
	}

	/* ========== 平台特色区域 ========== */
	.section-features {
		padding: 3rem 0 4rem;
		background: var(--c-surface);
		border-top: 1px solid var(--c-border);
	}

	.features-list {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
	}

	.feature-item {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.25rem;
		border-radius: var(--radius-md);
	}

	.feature-item:hover {
		border-color: var(--c-primary);
		box-shadow: var(--shadow-md);
	}

	.feature-badge {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(44, 62, 80, 0.06);
		border: 1px solid var(--c-border);
		border-radius: var(--radius-md);
		color: var(--c-primary);
		font-weight: 700;
		font-size: 0.85rem;
	}

	.feature-content h3 {
		margin: 0 0 0.35rem;
		font-size: 1.05rem;
		color: var(--c-primary);
		font-family: var(--font-serif);
	}

	.feature-content p {
		margin: 0;
		color: var(--c-text-sub);
		font-size: 0.9rem;
		line-height: 1.55;
	}

	/* ========== 响应式布局 ========== */
	@media (max-width: 768px) {
		.hero-header h1 {
			font-size: 2rem;
		}

		.search-box-main {
			flex-direction: column;
		}

		.search-btn {
			width: 100%;
		}

		.hero-stats-row {
			gap: 1.25rem;
		}

		.stat-value {
			font-size: 1.25rem;
		}

		.features-row {
			gap: 0.5rem;
		}

		.feature-chip {
			font-size: 0.8rem;
			padding: 0.4rem 0.75rem;
		}

		.features-list {
			grid-template-columns: 1fr;
		}

		.section-head {
			flex-direction: column;
			align-items: flex-start;
		}

		.section-head.center {
			align-items: center;
		}

		.link-more {
			margin-left: 0;
		}

		.modal-card {
			max-height: 90vh;
		}
	}

	@media (max-width: 480px) {
		.hero {
			padding: 2rem 0 1.5rem;
		}

		.hero-stats-row {
			flex-wrap: wrap;
			gap: 1rem;
		}

		.stat-divider {
			display: none;
		}

		.stat-item {
			min-width: 80px;
		}

		.stat-clickable {
			padding: 0.35rem 0.5rem;
		}

		.section-features {
			padding: 2rem 0;
		}

		.feature-item {
			flex-direction: column;
			gap: 0.75rem;
		}

		.feature-badge {
			width: 40px;
			height: 40px;
			font-size: 0.75rem;
		}

		.modal-overlay {
			padding: 1rem;
		}

		.modal-header {
			padding: 1rem 1rem 0.5rem;
		}

		.modal-header h2 {
			font-size: 1.25rem;
		}

		.modal-desc {
			padding: 0 1rem 0.75rem;
		}

		.modal-resources-list {
			padding: 0 1rem;
		}

		.modal-footer {
			padding: 0.75rem 1rem;
		}
	}
</style>

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

<div class="home-container">
	<!-- Hero Section: 大搜索框 -->
	<section class="hero-section">
		<div class="hero-content">
			<h1 class="site-title">OpenBrain</h1>
			<p class="site-subtitle">校园知识索引平台 - 让学习资源触手可及</p>

			<div class="search-box">
				<input
					type="text"
					bind:value={searchQuery}
					on:keypress={handleKeyPress}
					placeholder="搜索课程资源、笔记、习题..."
					class="search-input"
					autofocus
				/>
				<button on:click={performSearch} class="search-button">
					<span>搜索</span>
				</button>
			</div>

			{#if data.hotSearches && data.hotSearches.length > 0}
				<div class="hot-searches">
					<span class="hot-label">🔥 热门搜索：</span>
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
	</section>

	<!-- 热门资源 Section -->
	{#if data.hotResources && data.hotResources.length > 0}
		<section class="hot-resources-section">
			<div class="section-header">
				<h2>📚 热门资源</h2>
				<a href="/search" class="view-all">查看全部 →</a>
			</div>

			<div class="resources-grid">
				{#each data.hotResources as resource}
					<a href="/resource/{resource.id}" class="resource-card">
						<div class="resource-header">
							<span class="course-tag">{resource.course_code}</span>
							<span class="resource-stats">
								👁 {resource.view_count} · ⬇ {resource.download_count}
							</span>
						</div>
						<h3 class="resource-title">{resource.title}</h3>
						<p class="resource-excerpt">{resource.content_detail}</p>
						<div class="resource-footer">
							<span class="author">👤 {resource.author_name}</span>
							<span class="course-name">{resource.course_name}</span>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- 功能介绍 Section -->
	<section class="features-section">
		<h2>✨ 平台特色</h2>
		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">🔍</div>
				<h3>智能全文检索</h3>
				<p>基于 OpenGauss 全文索引，快速定位所需学习资源</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🤖</div>
				<h3>AI 辅助摘要</h3>
				<p>上传文档，AI 自动生成高质量摘要，提升检索精度</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">📦</div>
				<h3>轻量存储</h3>
				<p>仅存储资源链接，支持网盘、GitHub 等多种来源</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">📊</div>
				<h3>数据分析</h3>
				<p>实时追踪热门资源和搜索趋势，发现优质内容</p>
			</div>
		</div>
	</section>
</div>

<style>
	.home-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	/* Hero Section */
	.hero-section {
		padding: 4rem 1rem;
		text-align: center;
		color: white;
	}

	.hero-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.site-title {
		font-size: 3.5rem;
		font-weight: 800;
		margin: 0 0 0.5rem 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
		letter-spacing: -1px;
	}

	.site-subtitle {
		font-size: 1.2rem;
		margin: 0 0 2.5rem 0;
		opacity: 0.95;
		font-weight: 300;
	}

	.search-box {
		display: flex;
		gap: 0.5rem;
		background: white;
		padding: 0.5rem;
		border-radius: 50px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		margin-bottom: 1.5rem;
	}

	.search-input {
		flex: 1;
		border: none;
		outline: none;
		padding: 1rem 1.5rem;
		font-size: 1.1rem;
		background: transparent;
		color: #333;
	}

	.search-input::placeholder {
		color: #9ca3af;
	}

	.search-button {
		padding: 1rem 2.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 40px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.search-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.hot-searches {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		justify-content: center;
		font-size: 0.95rem;
	}

	.hot-label {
		font-weight: 600;
	}

	.hot-tag {
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 0.4rem 0.8rem;
		border-radius: 20px;
		cursor: pointer;
		transition: background 0.2s, transform 0.2s;
		font-size: 0.9rem;
	}

	.hot-tag:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	/* Hot Resources Section */
	.hot-resources-section {
		max-width: 1200px;
		margin: -2rem auto 3rem;
		padding: 0 1rem;
		position: relative;
		z-index: 1;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-header h2 {
		color: white;
		font-size: 1.8rem;
		margin: 0;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
	}

	.view-all {
		color: white;
		text-decoration: none;
		font-weight: 600;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		transition: background 0.2s;
	}

	.view-all:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.resources-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.resource-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.resource-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	}

	.resource-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
	}

	.course-tag {
		background: #e0e7ff;
		color: #4338ca;
		padding: 0.3rem 0.6rem;
		border-radius: 6px;
		font-weight: 600;
	}

	.resource-stats {
		color: #6b7280;
		font-size: 0.8rem;
	}

	.resource-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.resource-excerpt {
		font-size: 0.95rem;
		color: #6b7280;
		line-height: 1.6;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		flex-grow: 1;
	}

	.resource-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.75rem;
		border-top: 1px solid #f3f4f6;
		font-size: 0.85rem;
	}

	.author {
		color: #6b7280;
	}

	.course-name {
		color: #8b5cf6;
		font-weight: 500;
	}

	/* Features Section */
	.features-section {
		max-width: 1200px;
		margin: 0 auto 3rem;
		padding: 0 1rem;
	}

	.features-section h2 {
		text-align: center;
		color: white;
		font-size: 2rem;
		margin-bottom: 2rem;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.feature-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-radius: 12px;
		padding: 2rem 1.5rem;
		text-align: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s;
	}

	.feature-card:hover {
		transform: translateY(-4px);
	}

	.feature-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.feature-card h3 {
		font-size: 1.2rem;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.feature-card p {
		font-size: 0.95rem;
		color: #6b7280;
		line-height: 1.6;
		margin: 0;
	}

	@media (max-width: 768px) {
		.site-title {
			font-size: 2.5rem;
		}

		.site-subtitle {
			font-size: 1rem;
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
			gap: 1rem;
		}
	}
</style>

<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;
  const r = data.resource as any;

  import { marked } from 'marked';
  import sanitizeHtml from 'sanitize-html';

  const renderMarkdown = (text: string) => {
    const raw = text || '';
    const html = marked.parse(raw, { breaks: true });
    const htmlString = typeof html === 'string' ? html : '';

    return sanitizeHtml(htmlString, {
      ...sanitizeHtml.defaults,
      allowedTags: [...sanitizeHtml.defaults.allowedTags, 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img'],
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'alt', 'title']
      },
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' })
      }
    });
  };

  // 格式化日期
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>{r ? `${r.title} - OpenBrain` : '资源详情 - OpenBrain'}</title>
</svelte:head>

<div class="resource-shell">
  <div class="container">
    {#if !r}
      <!-- 资源不存在状态 -->
      <div class="empty-state">
        <div class="empty-icon"></div>
        <h2>资源不存在</h2>
        <p>该资源可能已被删除或从未存在</p>
        <a href="/" class="btn btn-primary">返回首页</a>
      </div>
    {:else}
      <!-- 面包屑导航 -->
      <nav class="breadcrumb">
        <a href="/">首页</a>
        <span class="breadcrumb-sep">›</span>
        <a href="/search">资源库</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">{r.title}</span>
      </nav>

      <!-- 资源头部卡片 -->
      <div class="resource-header card">
        <div class="header-content">
          <div class="header-meta">
            <span class="course-badge">{r.course_name}</span>
            {#if r.course_teacher}
              <span class="teacher-tag">{r.course_teacher}</span>
            {/if}
          </div>
          <h1 class="resource-title">{r.title}</h1>
          <div class="author-row">
            <span class="author-name">{r.author_name}</span>
            <span class="publish-date">发布于 {formatDate(r.created_at)}</span>
          </div>
        </div>
        <div class="header-action">
          <form method="POST" action="?/download">
            <button class="btn btn-download">
              <span>访问资源</span>
              <span class="btn-arrow">→</span>
            </button>
          </form>
        </div>
      </div>

      <!-- 统计数据条 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">{r.view_count}</span>
          <span class="stat-label">次浏览</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{r.download_count}</span>
          <span class="stat-label">次下载</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{new Date(r.created_at).toLocaleDateString('zh-CN')}</span>
          <span class="stat-label">创建日期</span>
        </div>
      </div>

      <!-- 摘要内容卡片 -->
      <div class="content-card card">
        <div class="content-header">
          <span class="section-badge">AI 摘要</span>
          <h2>资源摘要</h2>
        </div>
        <div class="content-body">
          <div class="content-detail markdown-body" aria-label="资源摘要">
            {@html renderMarkdown(r.content_detail)}
          </div>
        </div>
      </div>

      <!-- 底部操作区 -->
      <div class="action-footer">
        <a href="/search" class="btn btn-ghost">
          <span>← 返回搜索</span>
        </a>
        <form method="POST" action="?/download" class="action-form">
          <button class="btn btn-download">
            <span>立即访问资源</span>
            <span class="btn-arrow">→</span>
          </button>
        </form>
      </div>
    {/if}
  </div>
</div>

<style>
  /* ========== 整体布局 ========== */
  .resource-shell {
    min-height: 100vh;
    background: var(--c-bg);
    padding: 2rem 0 4rem;
  }

  /* ========== 空状态 ========== */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-lg);
    margin-top: 2rem;
  }

  .empty-icon {
    display: none;
  }

  .empty-state h2 {
    font-family: var(--font-serif);
    color: var(--c-primary);
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    color: var(--c-text-sub);
    margin-bottom: 1.5rem;
  }

  /* ========== 面包屑导航 ========== */
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    color: var(--c-text-sub);
  }

  .breadcrumb a {
    color: var(--c-text-sub);
    transition: var(--transition);
  }

  .breadcrumb a:hover {
    color: var(--c-primary);
  }

  .breadcrumb-sep {
    color: var(--c-border);
  }

  .breadcrumb-current {
    color: var(--c-text-main);
    font-weight: 500;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ========== 资源头部卡片 ========== */
  .resource-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
    padding: 2.5rem 2rem;
    margin-bottom: 1.5rem;
    border-radius: var(--radius-lg);
  }

  .resource-header:hover {
    transform: none;
    box-shadow: var(--shadow-md);
  }

  .header-content {
    width: 100%;
    max-width: 700px;
  }

  .header-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .course-badge {
    display: inline-flex;
    padding: 0.35rem 0.85rem;
    background: rgba(44, 62, 80, 0.08);
    color: var(--c-primary);
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .teacher-tag {
    font-size: 0.85rem;
    color: var(--c-text-sub);
  }

  .resource-title {
    font-family: var(--font-serif);
    font-size: 1.75rem;
    color: var(--c-primary);
    margin: 0 0 1rem;
    line-height: 1.4;
    word-break: break-word;
  }

  .author-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .author-name {
    font-weight: 600;
    color: var(--c-text-main);
  }

  .publish-date {
    color: var(--c-text-sub);
    font-size: 0.875rem;
    margin-left: 0.5rem;
  }

  .header-action {
    flex-shrink: 0;
  }

  .btn-download {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 1rem 2rem;
    font-size: 1.05rem;
    font-weight: 600;
    color: white;
    background-color: var(--c-primary);
    border: none;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    cursor: pointer;
    transition: var(--transition);
  }

  .btn-download:hover {
    background-color: var(--c-primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }

  .btn-download:active {
    transform: translateY(0);
  }

  .btn-arrow {
    transition: transform 0.2s ease;
  }

  .btn-download:hover .btn-arrow {
    transform: translateX(4px);
  }

  /* ========== 统计数据条 ========== */
  .stats-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    padding: 1.25rem 2rem;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-lg);
    margin-bottom: 1.5rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stat-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--c-primary);
    font-family: var(--font-serif);
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--c-text-sub);
  }

  .stat-divider {
    width: 1px;
    height: 2rem;
    background: var(--c-border);
  }

  /* ========== 摘要内容卡片 ========== */
  .content-card {
    padding: 0;
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin-bottom: 1.5rem;
  }

  .content-card:hover {
    transform: none;
    box-shadow: var(--shadow-md);
  }

  .content-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 2rem;
    background: linear-gradient(135deg, rgba(44, 62, 80, 0.03) 0%, rgba(44, 62, 80, 0.01) 100%);
    border-bottom: 1px solid var(--c-border);
  }

  .section-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.75rem;
    background: linear-gradient(135deg, var(--c-primary) 0%, #3d566e 100%);
    color: white;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.3px;
  }

  .content-header h2 {
    font-family: var(--font-serif);
    font-size: 1.25rem;
    color: var(--c-primary);
    margin: 0;
  }

  .content-body {
    padding: 2rem;
  }

  /* ========== Markdown 内容样式 ========== */
  .content-detail {
    line-height: 1.8;
    color: var(--c-text-main);
  }

  .content-detail :global(h1),
  .content-detail :global(h2),
  .content-detail :global(h3),
  .content-detail :global(h4),
  .content-detail :global(h5),
  .content-detail :global(h6) {
    font-family: var(--font-serif);
    color: var(--c-primary);
    margin: 1.5rem 0 0.75rem;
    line-height: 1.4;
  }

  .content-detail :global(h1) { font-size: 1.5rem; }
  .content-detail :global(h2) { font-size: 1.35rem; }
  .content-detail :global(h3) { font-size: 1.2rem; }

  .content-detail :global(p) {
    margin: 0.75rem 0;
  }

  .content-detail :global(ul),
  .content-detail :global(ol) {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  .content-detail :global(li) {
    margin: 0.35rem 0;
  }

  .content-detail :global(a) {
    color: var(--c-accent);
    text-decoration: underline;
    text-decoration-color: rgba(230, 126, 34, 0.3);
    transition: var(--transition);
  }

  .content-detail :global(a:hover) {
    color: var(--c-primary);
    text-decoration-color: var(--c-primary);
  }

  .content-detail :global(code) {
    background: rgba(44, 62, 80, 0.06);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.9em;
    font-family: 'Consolas', 'Monaco', monospace;
  }

  .content-detail :global(pre) {
    background: rgba(44, 62, 80, 0.04);
    padding: 1rem 1.25rem;
    border-radius: var(--radius-md);
    overflow-x: auto;
    margin: 1rem 0;
    border: 1px solid var(--c-border);
  }

  .content-detail :global(pre code) {
    background: none;
    padding: 0;
  }

  .content-detail :global(blockquote) {
    margin: 1rem 0;
    padding: 0.75rem 1.25rem;
    border-left: 4px solid var(--c-accent);
    background: rgba(230, 126, 34, 0.05);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    color: var(--c-text-sub);
  }

  .content-detail :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-md);
    margin: 1rem 0;
  }

  .content-detail :global(hr) {
    border: none;
    height: 1px;
    background: var(--c-border);
    margin: 1.5rem 0;
  }

  .content-detail :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }

  .content-detail :global(th),
  .content-detail :global(td) {
    padding: 0.75rem;
    border: 1px solid var(--c-border);
    text-align: left;
  }

  .content-detail :global(th) {
    background: rgba(44, 62, 80, 0.04);
    font-weight: 600;
  }

  /* ========== 底部操作区 ========== */
  .action-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1.5rem;
    margin-top: 0.5rem;
    border-top: 1px solid var(--c-border);
  }

  .action-footer .btn-ghost {
    display: inline-flex;
    align-items: center;
    padding: 0.85rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    color: var(--c-text-sub);
    background-color: transparent;
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: var(--transition);
  }

  .action-footer .btn-ghost:hover {
    color: var(--c-primary);
    border-color: var(--c-primary);
    background-color: rgba(44, 62, 80, 0.04);
  }

  .action-form {
    display: inline;
  }

  /* ========== 响应式设计 ========== */
  @media (max-width: 768px) {
    .resource-header {
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .header-action {
      width: 100%;
    }

    .btn-download {
      width: 100%;
      justify-content: center;
    }

    .resource-title {
      font-size: 1.5rem;
    }

    .stats-bar {
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1rem;
    }

    .stat-divider {
      display: none;
    }

    .stat-item {
      flex: 1;
      min-width: calc(50% - 0.5rem);
      justify-content: center;
      padding: 0.5rem;
      background: var(--c-bg);
      border-radius: var(--radius-sm);
    }

    .content-body {
      padding: 1.5rem;
    }

    .action-footer {
      flex-direction: column;
      gap: 1rem;
    }

    .action-footer .btn {
      width: 100%;
      justify-content: center;
    }

    .breadcrumb {
      font-size: 0.8rem;
    }

    .breadcrumb-current {
      max-width: 120px;
    }
  }
</style>

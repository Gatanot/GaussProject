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
</script>

<div class="container resource-shell">
  {#if !r}
    <div class="card">
      <p>资源不存在或已被删除。</p>
    </div>
  {:else}
    <div class="section-header">
      <div>
        <p class="eyebrow">资源详情</p>
        <h2>{r.title}</h2>
        <p class="section-hint">{r.course_name} · 作者 {r.author_name}</p>
      </div>
      <form method="POST" action="?/download">
        <button class="btn btn-primary">跳转资源链接 →</button>
      </form>
    </div>

    <div class="card resource-body">
      <div class="meta">
        <span>查看 {r.view_count} 次</span>
        <span>下载 {r.download_count} 次</span>
        <span>创建于 {new Date(r.created_at).toLocaleString()}</span>
      </div>
      <h3>摘要</h3>
      <div class="content-detail" aria-label="资源摘要">
        {@html renderMarkdown(r.content_detail)}
      </div>
    </div>
  {/if}
  
</div>

<style>
  .resource-shell { margin-top: 2rem; }
  .resource-body { padding: 1.25rem; border-radius: var(--radius-lg); }
  .meta { display: flex; gap: 1rem; color: var(--c-text-sub); margin-bottom: 0.8rem; }
  .content-detail { line-height: 1.7; }
  .content-detail h1, .content-detail h2, .content-detail h3 { margin: 0.4rem 0; }
  .content-detail p { margin: 0.25rem 0; }
</style>

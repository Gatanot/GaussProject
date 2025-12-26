<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;
  const r = data.resource as any;
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
      <p class="content-detail">{r.content_detail}</p>
    </div>
  {/if}
  
</div>

<style>
  .resource-shell { margin-top: 2rem; }
  .resource-body { padding: 1.25rem; border-radius: var(--radius-lg); }
  .meta { display: flex; gap: 1rem; color: var(--c-text-sub); margin-bottom: 0.8rem; }
  .content-detail { white-space: pre-wrap; line-height: 1.7; }
</style>

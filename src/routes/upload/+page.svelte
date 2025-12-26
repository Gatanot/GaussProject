<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  let title = '';
  let course_name = '';
  let course_teacher = '';
  let course_department = '';
  let resource_url = '';
  let content_detail = '';
  let tags = '';
  import { enhance } from '$app/forms';
  let submitting = false;
  let actionResult: { success: boolean; message: string; resourceId?: number } | null = null;
</script>

<div class="container upload-shell">
  <div class="section-header">
    <div>
      <p class="eyebrow">录入</p>
      <h2>发布资源</h2>
      <p class="section-hint">仅存链接与摘要，文件不入库</p>
    </div>
  </div>

  <form
    class="card upload-form"
    method="POST"
    use:enhance={({ formElement }) => {
      submitting = true;
      actionResult = null;
      return async ({ result, update }) => {
        try {
          if (result.type === 'success') {
            actionResult = result.data as any;
            // 清空所有输入栏，避免重复提交
            formElement.reset();
            title = '';
            course_name = '';
            course_teacher = '';
            course_department = '';
            resource_url = '';
            content_detail = '';
            tags = '';
          } else {
            // 非成功结果交给默认更新机制处理（如失败校验）
            await update();
          }
        } finally {
          submitting = false;
        }
      };
    }}
  >
    <div class="form-row">
      <label for="course_name">课程名称</label>
      <input id="course_name" name="course_name" placeholder="如：数据库系统原理" bind:value={course_name} required />
    </div>
    <div class="form-row">
      <label for="course_teacher">授课教师</label>
      <input id="course_teacher" name="course_teacher" placeholder="如：王老师" bind:value={course_teacher} />
    </div>
    <div class="form-row">
      <label for="course_department">所属院系</label>
      <input id="course_department" name="course_department" placeholder="如：计算机学院" bind:value={course_department} />
    </div>

    <div class="form-row">
      <label for="title">标题</label>
      <input id="title" name="title" placeholder="如：数据库系统原理期末复习笔记" bind:value={title} required />
    </div>

    <div class="form-row">
      <label for="resource_url">资源链接</label>
      <input id="resource_url" name="resource_url" placeholder="https://..." bind:value={resource_url} required />
    </div>

    <div class="form-row">
      <label for="content_detail">描述 / 摘要</label>
      <textarea id="content_detail" name="content_detail" rows="8" bind:value={content_detail} required placeholder="可手写，或上传 .md/.txt 让 AI 自动生成"></textarea>
    </div>

    <div class="form-row">
      <label for="tags">标签（用中文逗号/英文逗号分隔）</label>
      <input id="tags" name="tags" placeholder="例如：数据库, 复习, 期末" bind:value={tags} />
      <p class="section-hint">会自动去重与截断（最大 30 字），插入到 resource_tags</p>
    </div>

    <div class="form-row">
      <label for="summary_file">上传文件生成摘要（.md/.txt）</label>
      <input id="summary_file" type="file" accept=".md,.txt,text/markdown,text/plain" />
      <button type="button" class="btn btn-outline" on:click={async () => {
        const fileEl = document.getElementById('summary_file') as HTMLInputElement;
        const f = fileEl?.files?.[0];
        if (!f) return;
        const fd = new FormData();
        fd.append('file', f);
        const res = await fetch('/api/ai-summarize', { method: 'POST', body: fd });
        const json = await res.json();
        if (json?.summary) {
          content_detail = json.summary as string;
        }
      }}>AI 生成摘要</button>
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" disabled={submitting}>
        {submitting ? '提交中...' : '提交'}
      </button>
      {#if actionResult}
        <span class="submit-result {actionResult.success ? 'ok' : 'err'}">
          {actionResult.message}
          {#if actionResult.success && actionResult.resourceId}
            · <a href="/resource/{actionResult.resourceId}">查看详情 →</a>
          {/if}
        </span>
      {/if}
    </div>
  </form>
</div>

<style>
  .upload-shell {
    margin-top: 2rem;
  }
  .upload-form {
    padding: 1.25rem;
    border-radius: var(--radius-lg);
  }
  .form-row { margin-bottom: 1rem; display: grid; gap: 0.5rem; }
  label { font-weight: 700; color: var(--c-primary); }
  input, select, textarea {
    border: 1px solid var(--c-border);
    background: var(--c-surface);
    padding: 0.7rem 0.8rem;
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    color: var(--c-text-main);
  }
  .section-hint { color: var(--c-text-sub); font-size: 0.85rem; margin-top: 0.25rem; }
  .form-actions { display: flex; align-items: center; gap: 0.75rem; }
  .submit-result { font-size: 0.95rem; }
  .submit-result.ok { color: var(--c-primary); }
  .submit-result.err { color: var(--c-accent); }
</style>

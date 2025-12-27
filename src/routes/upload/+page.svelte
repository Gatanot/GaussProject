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
  let summaryMessage = '';
  let summaryLoading = false;

  const isAllowedFile = (f: File) => {
    const mimeOk = ['text/plain', 'text/markdown'].includes(f.type);
    const extOk = /\.(md|txt)$/i.test(f.name);
    return mimeOk || extOk;
  };

  // 拖动上传相关状态
  let isDragging = false;
  let draggedFileName = '';
  let uploadedTitle = ''; // 存储上传成功后的标题

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isAllowedFile(file)) {
        draggedFileName = file.name;
        // 将拖入的文件设置到文件输入框
        const fileEl = document.getElementById('summary_file') as HTMLInputElement;
        if (fileEl) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileEl.files = dataTransfer.files;
        }
      } else {
        summaryMessage = '仅支持 .md/.txt 文档';
      }
    }
  }
</script>

<div class="page-content">
  <div class="container">
    <!-- 页面标题区 -->
    <header class="page-header">
      <h1 class="page-title">发布资源</h1>
      <p class="page-subtitle">仅存链接与摘要，文件不入库</p>
    </header>

    <!-- 表单卡片 -->
    <div class="upload-card">
      <form
        method="POST"
        use:enhance={({ formElement }) => {
          submitting = true;
          actionResult = null;
          uploadedTitle = title; // 保存当前标题用于成功提示
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
                draggedFileName = '';
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
        <!-- 课程信息分组 -->
        <fieldset class="form-fieldset">
          <legend class="fieldset-legend">课程信息</legend>
          
          <div class="form-grid">
            <div class="form-group">
              <label class="label" for="course_name">课程名称 <span class="required">*</span></label>
              <input class="input" id="course_name" name="course_name" placeholder="如：数据库系统原理" bind:value={course_name} required />
            </div>

            <div class="form-group">
              <label class="label" for="course_teacher">授课教师</label>
              <input class="input" id="course_teacher" name="course_teacher" placeholder="如：王老师" bind:value={course_teacher} />
            </div>

            <div class="form-group">
              <label class="label" for="course_department">所属院系</label>
              <input class="input" id="course_department" name="course_department" placeholder="如：计算机学院" bind:value={course_department} />
            </div>
          </div>
        </fieldset>

        <!-- 资源信息分组 -->
        <fieldset class="form-fieldset">
          <legend class="fieldset-legend">资源详情</legend>

          <div class="form-group">
            <label class="label" for="title">标题 <span class="required">*</span></label>
            <input class="input" id="title" name="title" placeholder="如：数据库系统原理期末复习笔记" bind:value={title} required />
          </div>

          <div class="form-group">
            <label class="label" for="resource_url">资源链接 <span class="required">*</span></label>
            <input class="input" id="resource_url" name="resource_url" type="url" placeholder="https://..." bind:value={resource_url} required />
          </div>

          <div class="form-group">
            <label class="label" for="content_detail">描述 / 摘要 <span class="required">*</span></label>
            <textarea class="textarea" id="content_detail" name="content_detail" rows="6" bind:value={content_detail} required placeholder="可手写，或上传 .md/.txt 让 AI 自动生成"></textarea>
          </div>

          <!-- AI 摘要生成区 -->
          <div class="ai-summary-box">
            <div class="ai-summary-header">
              <span class="ai-icon">✨</span>
              <span class="ai-label">AI 辅助生成</span>
            </div>
            
            <!-- 拖动上传区域 -->
            <div
              class="drop-zone {isDragging ? 'dragging' : ''} {draggedFileName ? 'has-file' : ''}"
              on:dragenter={handleDragEnter}
              on:dragleave={handleDragLeave}
              on:dragover={handleDragOver}
              on:drop={handleDrop}
              role="region"
              aria-label="拖动上传区域"
            >
              <input class="file-input-hidden" id="summary_file" type="file" accept=".md,.txt,text/markdown,text/plain" on:change={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                  draggedFileName = target.files[0].name;
                }
              }} />
              {#if draggedFileName}
                <div class="drop-zone-content">
                  <span class="file-icon">📄</span>
                  <span class="file-name">{draggedFileName}</span>
                  <button type="button" class="clear-file-btn" on:click={() => {
                    draggedFileName = '';
                    const fileEl = document.getElementById('summary_file') as HTMLInputElement;
                    if (fileEl) fileEl.value = '';
                  }}>✕</button>
                </div>
              {:else}
                <div class="drop-zone-content">
                  <span class="drop-icon">📁</span>
                  <span class="drop-text">拖动 .md / .txt 文件到此处</span>
                  <span class="drop-hint">或</span>
                  <label for="summary_file" class="file-select-btn">选择文件</label>
                </div>
              {/if}
            </div>
            
            <div class="ai-summary-content">
              <button type="button" class="ai-generate-btn" disabled={summaryLoading || !draggedFileName} on:click={async () => {
                summaryMessage = '';
                const fileEl = document.getElementById('summary_file') as HTMLInputElement;
                const f = fileEl?.files?.[0];
                if (!f) {
                  summaryMessage = '请先选择或拖入文件';
                  return;
                }
                if (!isAllowedFile(f)) {
                  summaryMessage = '仅支持 .md/.txt 文档';
                  return;
                }

                const fd = new FormData();
                fd.append('file', f);
                summaryLoading = true;
                try {
                  const res = await fetch('/api/ai-summarize', { method: 'POST', body: fd });
                  const json = await res.json();
                  if (res.ok && json?.summary) {
                    content_detail = json.summary as string;
                    summaryMessage = '摘要已生成，可编辑后提交';
                  } else {
                    summaryMessage = json?.error || '摘要生成失败，请稍后重试';
                  }
                } catch (err) {
                  console.error('summary error', err);
                  summaryMessage = '请求失败，请检查网络后重试';
                } finally {
                  summaryLoading = false;
                }
              }}>
                {#if summaryLoading}
                  <span class="loading-spinner"></span> 生成中...
                {:else}
                  AI 生成摘要
                {/if}
              </button>
            </div>
            {#if summaryMessage}
              <p class="ai-message {summaryMessage.includes('生成') ? 'success' : 'info'}">{summaryMessage}</p>
            {/if}
          </div>

          <div class="form-group">
            <label class="label" for="tags">标签</label>
            <input class="input" id="tags" name="tags" placeholder="例如：数据库, 复习, 期末（用逗号分隔）" bind:value={tags} />
            <p class="hint">会自动去重与截断（最大 30 字）</p>
          </div>
        </fieldset>

        <!-- 提交区域 -->
        <div class="form-footer">
          <button class="submit-btn" disabled={submitting}>
            {#if submitting}
              <span class="loading-spinner"></span> 提交中...
            {:else}
              发布资源
            {/if}
          </button>
          
          {#if actionResult}
            <div class="result-message {actionResult.success ? 'success' : 'error'}">
              <span class="result-icon">{actionResult.success ? '✓' : '✗'}</span>
              {#if actionResult.success}
                <span>资料成功上传：{uploadedTitle}</span>
              {:else}
                <span>{actionResult.message}</span>
              {/if}
              {#if actionResult.success && actionResult.resourceId}
                <a href="/resource/{actionResult.resourceId}" class="result-link">查看详情 →</a>
              {/if}
            </div>
          {/if}
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  /* ===== 页面布局 ===== */
  .page-content {
    padding: 2.5rem 0 4rem;
  }

  /* ===== 页面容器 ===== */
  .container {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 1.5rem; /* 扩大左右留白，确保对称 */
  }

  /* ===== 页面标题区 ===== */
  .page-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .page-title {
    font-family: var(--font-serif);
    font-size: 2rem;
    font-weight: 700;
    color: var(--c-primary);
    margin-bottom: 0.5rem;
  }

  .page-subtitle {
    font-size: 0.95rem;
    color: var(--c-text-sub);
  }

  /* ===== 表单卡片 ===== */
  .upload-card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-lg);
    padding: 1.75rem 2rem;
    max-width: 600px;
    margin: 0 auto;
    box-shadow: var(--shadow-sm);
  }

  /* ===== 表单分组 ===== */
  .form-fieldset {
    border: none;
    padding: 0;
    margin: 0 0 2rem 0;
  }

  .fieldset-legend {
    font-family: var(--font-serif);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--c-primary);
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--c-border);
    width: 100%;
    display: block;
  }

  /* ===== 表单网格（课程信息） ===== */
  .form-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)); /* 固定为三列，列宽均分，避免贴边不对称 */
    column-gap: 1.5rem; /* 更大的列间距，确保输入框间有明显空隙 */
    row-gap: 1rem;
    padding: 0; /* 移除网格侧填充，避免左右不一致 */
  }

  /* ===== 表单项 ===== */
  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-grid .form-group {
    margin-bottom: 0;
  }

  .label {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--c-text-main);
    margin-bottom: 0.5rem;
  }

  .required {
    color: var(--c-accent);
  }

  .input, .textarea {
    width: 100%;
    max-width: 100%;
    min-width: 0; /* 防止 grid/flex 子项溢出 */
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-family: var(--font-sans);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    background-color: var(--c-surface);
    color: var(--c-text-main);
    transition: var(--transition);
    box-sizing: border-box; /* 边界盒，确保宽度包含内边距与边框，防止贴边 */
  }

  .input:focus, .textarea:focus {
    outline: none;
    border-color: var(--c-primary);
    box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
  }

  .input::placeholder, .textarea::placeholder {
    color: var(--c-text-sub);
    opacity: 0.7;
  }

  .textarea {
    resize: vertical;
    min-height: 140px;
    line-height: 1.6;
  }

  .hint {
    font-size: 0.8rem;
    color: var(--c-text-sub);
    margin-top: 0.4rem;
  }

  /* ===== AI 摘要生成区 ===== */
  .ai-summary-box {
    background: linear-gradient(135deg, rgba(230, 126, 34, 0.03) 0%, rgba(44, 62, 80, 0.03) 100%);
    border: 1px dashed var(--c-border);
    border-radius: var(--radius-md);
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .ai-summary-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .ai-icon {
    font-size: 1rem;
  }

  .ai-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--c-text-sub);
  }

  .ai-summary-content {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  /* ===== 文件选择按钮 ===== */
  .file-input-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  .file-select-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 1.2rem;
    border-radius: var(--radius-sm);
    font-weight: 500;
    font-size: 0.95rem;
    cursor: pointer;
    transition: var(--transition);
    border: 1px solid var(--c-border);
    background-color: transparent;
    color: var(--c-text-main);
    white-space: nowrap;
  }

  .file-select-btn:hover {
    border-color: var(--c-primary);
    color: var(--c-primary);
  }

  /* ===== AI 生成摘要按钮 ===== */
  .ai-generate-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 1.2rem;
    border-radius: var(--radius-sm);
    font-weight: 500;
    font-size: 0.95rem;
    cursor: pointer;
    transition: var(--transition);
    border: 1px solid var(--c-border);
    background-color: transparent;
    color: var(--c-text-main);
    gap: 0.5rem;
    white-space: nowrap;
  }

  .ai-generate-btn:hover {
    border-color: var(--c-primary);
    color: var(--c-primary);
  }

  .ai-generate-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .ai-message {
    font-size: 0.85rem;
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-sm);
  }

  .ai-message.success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--c-success);
  }

  .ai-message.info {
    background: rgba(230, 126, 34, 0.1);
    color: var(--c-accent);
  }

  /* ===== 提交区域 ===== */
  .form-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--c-border);
  }

  /* ===== 发布资源按钮 ===== */
  .submit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 1.2rem;
    border-radius: var(--radius-sm);
    font-weight: 500;
    font-size: 0.95rem;
    cursor: pointer;
    transition: var(--transition);
    border: 1px solid transparent;
    gap: 0.5rem;
    background-color: var(--c-primary);
    color: white;
    min-width: 160px;
  }

  .submit-btn:hover {
    background-color: var(--c-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* ===== 结果消息 ===== */
  .result-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: 0.9rem;
  }

  .result-message.success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--c-success);
  }

  .result-message.error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--c-danger);
  }

  .result-icon {
    font-weight: 700;
  }

  .result-link {
    margin-left: 0.5rem;
    color: var(--c-primary);
    font-weight: 500;
  }

  .result-link:hover {
    color: var(--c-accent);
    text-decoration: underline;
  }

  /* ===== 拖动上传区域 ===== */
  .drop-zone {
    border: 2px dashed var(--c-border);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    margin-bottom: 1rem;
    text-align: center;
    transition: var(--transition);
    background: var(--c-surface);
    cursor: pointer;
  }

  .drop-zone:hover {
    border-color: var(--c-primary);
    background: rgba(44, 62, 80, 0.02);
  }

  .drop-zone.dragging {
    border-color: var(--c-accent);
    background: rgba(230, 126, 34, 0.05);
    transform: scale(1.01);
  }

  .drop-zone.has-file {
    border-color: var(--c-success);
    border-style: solid;
    background: rgba(16, 185, 129, 0.05);
  }

  .drop-zone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .drop-icon {
    font-size: 2rem;
    opacity: 0.7;
  }

  .drop-text {
    font-size: 0.95rem;
    color: var(--c-text-sub);
  }

  .drop-hint {
    font-size: 0.8rem;
    color: var(--c-text-sub);
    opacity: 0.7;
  }

  .file-icon {
    font-size: 1.5rem;
  }

  .file-name {
    font-size: 0.95rem;
    color: var(--c-text-main);
    font-weight: 500;
    word-break: break-all;
  }

  .clear-file-btn {
    background: none;
    border: none;
    color: var(--c-text-sub);
    font-size: 1rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    transition: var(--transition);
  }

  .clear-file-btn:hover {
    color: var(--c-danger);
    background: rgba(239, 68, 68, 0.1);
  }

  /* ===== 加载动画 ===== */
  .loading-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ===== 响应式 ===== */
  @media (max-width: 640px) {
    .upload-card {
      padding: 1.25rem; /* 减小内边距，留更多空间给内容 */
      margin: 0;
      width: 100%;
      border-radius: var(--radius-md);
    }

    .page-title {
      font-size: 1.6rem;
    }

    .ai-summary-content {
      flex-direction: column;
      align-items: stretch;
    }

    .file-select-btn,
    .ai-generate-btn {
      width: 100%;
      justify-content: center;
    }

    .drop-zone {
      padding: 1rem;
    }

    .drop-icon {
      font-size: 1.5rem;
    }
  }
  
  @media (max-width: 480px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

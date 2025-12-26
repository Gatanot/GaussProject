import type { RequestHandler } from './$types';

// 轻量级本地摘要：提取前若干行与标题，适用于 .md/.txt
function naiveSummarize(text: string): string {
  const clean = text.replace(/\r/g, '').trim();
  const lines = clean.split('\n').slice(0, 50);
  // 选取以 # 开头的标题与首段
  const headings = lines.filter((l) => l.trim().startsWith('#')).slice(0, 5);
  const body = lines.filter((l) => !l.trim().startsWith('#')).slice(0, 20);
  const headBlock = headings.join('\n');
  const bodyBlock = body.join('\n');
  const combined = (headBlock + '\n\n' + bodyBlock).trim();
  // 截断到约 1200 字符
  return combined.length > 1200 ? combined.slice(0, 1200) + '...' : combined;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: '缺少文件或类型不正确' }), { status: 400 });
    }

    const ct = file.type || 'text/plain';
    if (!['text/plain', 'text/markdown'].includes(ct) && !file.name.match(/\.(md|txt)$/i)) {
      return new Response(JSON.stringify({ error: '仅支持 .md/.txt 文件' }), { status: 400 });
    }

    const buf = await file.arrayBuffer();
    const text = Buffer.from(buf).toString('utf-8');

    // 这里可扩展对接外部 LLM（OpenAI/DeepSeek），当前使用本地摘要以便开箱即用
    const summary = naiveSummarize(text);
    return new Response(JSON.stringify({ summary }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('AI 摘要接口错误:', e);
    return new Response(JSON.stringify({ error: '摘要生成失败' }), { status: 500 });
  }
};

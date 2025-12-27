import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
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

const ALLOWED_MIME = ['text/plain', 'text/markdown'];
const ALLOWED_EXT = /\.(md|txt)$/i;
const MAX_CHARS = 12000; // 防止过长内容请求导致超时

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: '缺少文件或类型不正确' }), { status: 400 });
    }

    const ct = file.type || 'text/plain';
    if (!ALLOWED_MIME.includes(ct) && !file.name.match(ALLOWED_EXT)) {
      return new Response(JSON.stringify({ error: '仅支持 .md/.txt 文件' }), { status: 400 });
    }

    const buf = await file.arrayBuffer();
    const text = Buffer.from(buf).toString('utf-8');

    if (!text.trim()) {
      return new Response(JSON.stringify({ error: '文件内容为空，无法生成摘要' }), { status: 400 });
    }

    const truncated = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
  const prompt = `请基于以下文档内容生成一篇中文摘要，突出重点、结论和建议，避免重复文件原文，语言简洁连贯。\n\n文档内容\n${truncated}`;

    const apiKey = env.API_KEY;
    const model = env.MODEL_NAME;
    const baseURL = env.BASE_URL;

    if (!apiKey || !model || !baseURL) {
      return new Response(JSON.stringify({ error: '缺少 AI 配置，请检查 BASE_URL / MODEL_NAME / API_KEY' }), {
        status: 500
      });
    }

    const client = new OpenAI({ apiKey, baseURL });

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: '你是学术资源助手，请输出简洁的中文摘要，覆盖核心观点与结论。'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 400
    });

    const aiSummary = completion.choices?.[0]?.message?.content?.trim();
    if (!aiSummary) {
      return new Response(JSON.stringify({ error: 'AI 摘要生成失败，请稍后重试' }), { status: 502 });
    }

    return new Response(JSON.stringify({ summary: aiSummary }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('AI 摘要接口错误:', e);
    return new Response(JSON.stringify({ error: '摘要生成失败' }), { status: 500 });
  }
};

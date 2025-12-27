import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { RequestHandler } from './$types';

let cachedSystemPrompt: string | null = null;

async function loadSystemPrompt(): Promise<string> {
  if (cachedSystemPrompt) return cachedSystemPrompt;
  const promptPath = resolve(process.cwd(), 'src', 'prompt.md');
  try {
    cachedSystemPrompt = (await readFile(promptPath, 'utf-8')).trim();
  } catch (err) {
    console.error('读取系统提示词失败 prompt.md:', err);
    cachedSystemPrompt = '';
  }

  if (!cachedSystemPrompt) {
    cachedSystemPrompt = '你是 OpenBrain 校园知识库的 AI 客服助手，保持回答简洁且聚焦平台相关问题。';
  }

  return cachedSystemPrompt;
}

export const POST: RequestHandler = async ({ request }) => {
  let payload: any;
  try {
    payload = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: '请求体必须是 JSON 格式' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const question = typeof payload?.question === 'string' ? payload.question.trim() : '';
  if (!question) {
    return new Response(JSON.stringify({ error: '请输入想咨询的问题' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = env.API_KEY;
  const model = env.MODEL_NAME;
  const baseURL = env.BASE_URL;

  if (!apiKey || !model || !baseURL) {
    return new Response(JSON.stringify({ error: '缺少 AI 配置，请检查 BASE_URL / MODEL_NAME / API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const systemPrompt = await loadSystemPrompt();
  const client = new OpenAI({ apiKey, baseURL });

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        // 每次请求只发送用户当前提问
        { role: 'user', content: question }
      ],
      temperature: 0.3,
      max_tokens: 600
    });

    const answer = completion.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return new Response(JSON.stringify({ error: 'AI 客服暂时没有返回结果，请稍后重试' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('AI 客服接口异常:', err);
    return new Response(JSON.stringify({ error: '客服服务暂不可用，请稍后再试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

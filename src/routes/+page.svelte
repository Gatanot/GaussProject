<script lang="ts">
	import type { PageData } from './$types';
	import { dev } from '$app/environment';

	export let data: PageData;

	let running = false;
	let result: any = null;
	let error: string | null = null;

	async function runTest() {
		running = true;
		result = null;
		error = null;

		try {
			const res = await fetch('/api/db-test', { method: 'POST' });
			const json = await res.json();
			if (!res.ok) {
				error = json.error || `请求失败: ${res.status}`;
				result = json;
			} else {
				result = json;
			}
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			running = false;
		}
	}
</script>

<div class="container">
	<h1>OpenGauss 数据库连接测试</h1>
	
	<div class="card {data.connectionTest.success ? 'success' : 'error'}">
		<h2>连接状态</h2>
		<div class="status">
			<span class="icon">{data.connectionTest.success ? '✅' : '❌'}</span>
			<span class="message">{data.connectionTest.message}</span>
		</div>
		
		{#if data.connectionTest.success}
			<div class="details">
				<h3>数据库版本</h3>
				<p class="version">{data.connectionTest.version}</p>
				
				{#if data.dbInfo}
					<h3>连接信息</h3>
					<ul>
						<li><strong>数据库名称:</strong> {data.dbInfo.database}</li>
						<li><strong>当前用户:</strong> {data.dbInfo.user}</li>
						<li><strong>服务器地址:</strong> {data.dbInfo.server_addr || 'N/A'}</li>
						<li><strong>服务器端口:</strong> {data.dbInfo.server_port || 'N/A'}</li>
					</ul>
				{/if}
				
				<p class="timestamp">测试时间: {new Date(data.timestamp).toLocaleString('zh-CN')}</p>
			</div>

			<div class="test-section">
				<h3>数据库 CRUD 测试</h3>
				{#if !dev}
					<p>数据库测试仅在开发模式可用。</p>
				{:else}
					<button class="btn" on:click={runTest} disabled={running}>{running ? '运行中...' : 'Run DB Test'}</button>
					{#if result}
						<pre class="result">{JSON.stringify(result, null, 2)}</pre>
					{/if}
					{#if error}
						<pre class="error">{error}</pre>
					{/if}
				{/if}
			</div>
		{:else}
			<div class="error-details">
				<h3>错误详情</h3>
				<p>请检查以下内容：</p>
				<ul>
					<li>OpenGauss 数据库是否正在运行</li>
					<li>主机地址和端口是否正确 (当前配置: 127.0.0.1:5432)</li>
					<li>用户名和密码是否正确</li>
					<li>数据库名称是否存在</li>
					<li>防火墙是否允许连接</li>
				</ul>
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	h1 {
		color: #333;
		text-align: center;
		margin-bottom: 2rem;
	}

	.card {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-left: 4px solid;
	}

	.card.success {
		border-left-color: #22c55e;
	}

	.card.error {
		border-left-color: #ef4444;
	}

	h2 {
		margin-top: 0;
		color: #333;
	}

	h3 {
		color: #555;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 1.2rem;
		margin: 1rem 0;
	}

	.icon {
		font-size: 2rem;
	}

	.message {
		font-weight: 500;
	}

	.details {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.version {
		background: #f3f4f6;
		padding: 0.75rem;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.9rem;
		word-break: break-all;
		color: #374151;
	}

	ul {
		list-style: none;
		padding: 0;
	}

	li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #f3f4f6;
	}

	li:last-child {
		border-bottom: none;
	}

	strong {
		color: #374151;
	}

	.timestamp {
		margin-top: 1.5rem;
		font-size: 0.9rem;
		color: #6b7280;
		text-align: right;
	}

	.error-details {
		margin-top: 1rem;
	}

	.error-details ul {
		list-style: disc;
		padding-left: 1.5rem;
	}

	.error-details li {
		border-bottom: none;
		color: #6b7280;
	}
</style>

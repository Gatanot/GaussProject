<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import '../app.css';

	let { children, data } = $props();

	let chatOpen = $state(false);
	let question = $state('');
	let answer = $state('');
	let loading = $state(false);
	let error = $state('');

	const toggleChat = () => {
		chatOpen = !chatOpen;
		if (!chatOpen) {
			resetChat();
		}
	};

	const closeChat = () => {
		chatOpen = false;
		resetChat();
	};

	const resetChat = () => {
		question = '';
		answer = '';
		error = '';
	};

	const submitQuestion = async () => {
		error = '';
		answer = '';
		const payload = question.trim();
		if (!payload) {
			error = '请先输入想咨询的问题';
			return;
		}

		loading = true;
		try {
			const res = await fetch('/api/ai-support', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ question: payload })
			});

			const json = await res.json();
			if (res.ok && json?.answer) {
				answer = json.answer as string;
			} else {
				error = json?.error || '客服服务暂不可用，请稍后重试';
			}
		} catch (err) {
			console.error('ai support error', err);
			error = '请求失败，请检查网络后重试';
		} finally {
			loading = false;
		}
	};

	const handleOverlayKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeChat();
		}
	};
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Header user={data.user} chatOpen={chatOpen} toggleChat={toggleChat} />
{@render children()}

{#if chatOpen}
	<div
		class="cs-overlay"
		role="button"
		tabindex="0"
		onclick={closeChat}
		onkeydown={handleOverlayKeydown}
	>
		<div
			class="cs-dialog"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(event) => event.stopPropagation()}
			onkeydown={(event) => {
				if (event.key === 'Escape') {
					event.preventDefault();
					closeChat();
				}
			}}
		>
			<header class="cs-header">
				<div>
					<p class="cs-badge">AI 客服</p>
					<h3 class="cs-title">有什么可以帮你？</h3>
					<p class="cs-sub">每次只发送你当前的提问给 AI，保护隐私</p>
				</div>
				<button class="cs-close" type="button" onclick={closeChat} aria-label="关闭客服">×</button>
			</header>

			<div class="cs-body">
				<label class="cs-label" for="cs-question">向 AI 客服提问</label>
				<textarea
					id="cs-question"
					class="cs-textarea"
					rows="4"
					bind:value={question}
					placeholder="例如：如何上传资源？或搜索不到某个课程怎么办？"
					onkeydown={(event) => {
						event.stopPropagation();
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault();
							submitQuestion();
						}
					}}
				></textarea>

				<div class="cs-actions">
							<button type="button" class="btn" onclick={closeChat}>关闭</button>
							<button type="button" class="btn btn-primary" disabled={loading} onclick={submitQuestion}>
						{#if loading}
							<span class="cs-spinner"></span> 发送中...
						{:else}
							发送
						{/if}
					</button>
				</div>

				{#if error}
					<p class="cs-error">{error}</p>
				{/if}

				{#if answer}
					<div class="cs-answer">
						<p class="cs-label">回复</p>
						<p class="cs-answer-text">{answer}</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.cs-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		z-index: 1200;
	}

	.cs-dialog {
		width: min(520px, 100%);
		background: var(--c-surface);
		border: 1px solid var(--c-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		animation: fadeIn 0.2s ease, slideUp 0.25s ease;
	}

	.cs-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.cs-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.65rem;
		background: rgba(44, 62, 80, 0.06);
		color: var(--c-primary);
		border-radius: var(--radius-sm);
		font-weight: 700;
		font-size: 0.85rem;
		margin: 0 0 0.35rem;
	}

	.cs-title {
		margin: 0;
		font-size: 1.25rem;
		color: var(--c-primary);
		font-family: var(--font-serif);
	}

	.cs-sub {
		margin: 0.25rem 0 0;
		color: var(--c-text-sub);
		font-size: 0.9rem;
	}

	.cs-close {
		border: none;
		background: transparent;
		color: var(--c-text-sub);
		font-size: 1.35rem;
		cursor: pointer;
		border-radius: var(--radius-sm);
		padding: 0.25rem 0.5rem;
		transition: var(--transition);
	}

	.cs-close:hover {
		background: rgba(44, 62, 80, 0.08);
		color: var(--c-primary);
	}

	.cs-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.cs-label {
		font-size: 0.9rem;
		color: var(--c-text-sub);
		margin: 0;
	}

	.cs-textarea {
		width: 100%;
		border: 1px solid var(--c-border);
		border-radius: var(--radius-md);
		padding: 0.75rem 0.9rem;
		font-size: 0.95rem;
		resize: vertical;
		min-height: 110px;
		background: var(--c-bg);
		color: var(--c-text-main);
		outline: none;
		transition: var(--transition);
	}

	.cs-textarea:focus {
		border-color: var(--c-primary);
		box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
	}

	.cs-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.65rem;
		margin-top: 0.25rem;
	}

	.cs-error {
		margin: 0;
		color: #c0392b;
		background: #fdecea;
		border: 1px solid #f5c6cb;
		border-radius: var(--radius-sm);
		padding: 0.55rem 0.75rem;
		font-size: 0.9rem;
	}

	.cs-answer {
		border: 1px solid var(--c-border);
		border-radius: var(--radius-md);
		background: var(--c-bg);
		padding: 0.9rem 1rem;
	}

	.cs-answer-text {
		margin: 0.35rem 0 0;
		color: var(--c-text-main);
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.cs-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		display: inline-block;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

		@keyframes fadeIn {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}

		@keyframes slideUp {
			from {
				opacity: 0;
				transform: translateY(10px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}

	@media (max-width: 640px) {
		.cs-dialog {
			padding: 1rem 1.1rem;
			width: 100%;
		}
	}
</style>

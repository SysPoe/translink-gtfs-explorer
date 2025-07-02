<script lang="ts">
	let { data } = $props();
	let today = Number.parseInt(
		new Date(Date.now() + 60 * 60 * 10 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
	);
</script>

<h2>{Object.keys(data.runs).length} results for "{data.query}"</h2>
<ul>
	{#each Object.keys(data.runs).sort() as run}
		<li>
			<a href="/run/{run}">{run}</a>:
			{@html data.runs[run].map((v) => {
					if (v == today) return `<b><u>${v}</u></b>`;
					return v;
				})
				.slice(0,5).join(', ')} {data.runs[run].length > 5 ? '...' : ''}
		</li>
	{/each}
</ul>

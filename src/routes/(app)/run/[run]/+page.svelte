<script lang="ts">
	let { data } = $props();
	let runKeys = $state();
	let today = Number.parseInt(
		new Date(Date.now() + 60 * 60 * 10 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
	);

	if (
		data.runDates != undefined &&
		Object.keys(data.runDates).length > 0 &&
		Object.keys(data.runDates).filter((v) => data.runDates[v] == undefined).length == 0
	) {
		runKeys = Object.keys(data.runDates).sort((a, b) => data.runDates[a][0] - data.runDates[b][0]);
	}
</script>

{#if data.runDates != undefined && Object.keys(data.runDates).length > 0 && Object.keys(data.runDates).filter((v) => data.runDates[v] == undefined).length == 0}
	<h2>{data.run}</h2>

	<i>RunGuru says {data.run} is a {data.guru}</i>

	<h3>Trip/Run Dates</h3>
	<i>Trip ID</i>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
	<i>Dates (<b><u>Today</u></b>)</i>
	{#each runKeys as trip}
		<div>
			<a href="/trip/{trip}">{trip}</a>: {@html data.runDates[trip]
				.map((v) => {
					if (v == today) return `<b><u>${v}</u></b>`;
					return v;
				})
				.join(', ')}
		</div>
	{/each}
{:else}
	<h1>Run not found: {data.run}</h1>
{/if}

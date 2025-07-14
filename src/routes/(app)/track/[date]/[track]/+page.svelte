<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
  <title>Track {data.track} on {data.date} - Translink GTFS Explorer</title>
</svelte:head>

<h2>Track {data.track} on {data.date}</h2>
<ul>
	{#each data.trackInfo.filter((v) => v.type == 'run') as trackTime}
		{@const time = trackTime.data}
		<li>
			{time.diff}
			<a href="/stations/{time.from_parent_id}/">{time.from.toUpperCase()}</a>
			@ {time.fromTime}
			<a href="/run/{time.run}/">{time.run}</a> (<a href="/trip/{time.trip_id}/">{time.trip_id}</a>)
			to
			<a href="/stations/{time.to_parent_id}/">{time.to.toUpperCase()}</a>
			@ {time.toTime}
		</li>
	{/each}
</ul>

{data.trackInfo.filter((v) => v.type == 'status')[0].message}

<script lang="ts">
	import { stops } from "gtfs/models";

	let { data } = $props();
	let { results } = data;

	let today = Number.parseInt(
		new Date(Date.now() + 60 * 60 * 10 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
	);
</script>

<h2>{results.runs.length} results for "{data.query}" and {data.date}</h2>
<ul>
	{#each results.runs as run}
		{@const rdata = results.data[run]}
		{@const firstChild = results.stops[rdata.stopTimes[0].stop_id || '']}
		{@const firstParent = results.stops[firstChild.parent_station || '']}
		{@const lastChild = results.stops[(rdata.stopTimes.at(-1) || { stop_id: '' }).stop_id || '']}
		{@const lastParent = results.stops[lastChild.parent_station || '']}

		<li>
			<hr />
			<a href="/run/{run}#:~:text={today}">{run}</a>:
			{rdata.stopTimes[0].arrival_time?.slice(0, 5)}
			<a href="/stations/{firstParent?.stop_id}/">
				{firstParent?.stop_id
					.replace(/place_|sta|stn/g, '')
					.toUpperCase()}{firstChild?.platform_code}
			</a>
			-
			<a href="/stations/{lastParent?.stop_id}/">
				{lastParent?.stop_id.replace(/place_|sta|stn/g, '').toUpperCase()}{lastChild?.platform_code}
			</a>
			({firstParent.stop_name?.replace(/ station/, '')} - {lastParent.stop_name?.replace(
				/ station/,
				''
			)}) service
			<br />
			<span style="display:inline-block; width: 58px; height: 1px;"></span>
			{rdata.expressInfo}
			<br />
			<span style="display:inline-block; width: 58px; height: 1px;"></span>
			<i>RunGuru says {run} is a {rdata.runGuru}</i>
		</li>
	{/each}
</ul>

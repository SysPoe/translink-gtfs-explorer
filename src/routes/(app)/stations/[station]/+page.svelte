<script lang="ts">
	import dep from '$lib/assets/dep.svg';

	let { data } = $props();
	let info = data.stationInfo;
	let today = Number.parseInt(
		new Date(Date.now() + 60 * 60 * 10 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
	);

	const or = (value: any) => {
		if (value === null) return '<b>null</b>';
		if (value === undefined) return '<b>undefined</b>';
		return value;
	};
</script>

<svelte:head>
  <title>Station {data.station} - Translink GTFS Explorer</title>
</svelte:head>

<h1>
	{@html or(info.stop_name)}
	<a href="/stations/{data.station}/departures/live"><img src={dep} width="25px" height="25px" /></a>
</h1>
Stop ID: {@html or(info.stop_id)}<br />
Stop Code: {@html or(info.stop_code)}<br />
Stop Name: {@html or(info.stop_name)}<br />
TTS Stop Name: {@html or(info.tts_stop_name)}<br />
Stop Desc: {@html or(info.stop_desc)}<br />
Stop Coords:
{#if info.stop_lat && info.stop_lon}
	<a
		href="https://www.openstreetmap.org?mlat={info.stop_lat}&mlon={info.stop_lon}&zoom=17"
		target="_blank"
	>
		{info.stop_lat}, {info.stop_lon}
	</a>
{:else}
	{@html or(info.stop_lat)}, {@html or(info.stop_lon)}
{/if}<br />
Zone ID: {@html or(info.zone_id)}<br />
Stop URL:
{#if info.stop_url}
	<a href={info.stop_url}>{info.stop_url}</a>
{:else}
	{@html or(info.stop_url)}
{/if}<br />
Location Type: {@html or(info.location_type)}<br />
Parent Station:
{#if info.parent_station}
	<a href="/r/stations/{info.parent_station}/">{info.parent_station}</a>
{:else}
	{@html or(info.parent_station)}
{/if}<br />
Stop Timezone: {@html or(info.stop_timezone)}<br />
Wheelchair Accessible: {@html or(info.wheelchair_boarding)}<br />
Level ID: {@html or(info.level_id)}<br />
Platform Code: {@html or(info.platform_code)}<br />

{#if info.child_stations.length > 0}
	<h2>Child Stations</h2>
	{#each info.child_stations as child}
		<h3>
			{#if child.stop_id}
				<a href="/r/stations/{child.stop_id}/">{child.stop_name || child.stop_id}</a>
				<a href="/stations/{child.stop_id}/departures/live"
					><img src={dep} width="16px" height="16px" /></a
				>
			{:else}
				{or(child.stop_name || child.stop_id)}
			{/if}
		</h3>
		Stop ID: {@html or(child.stop_id)}<br />
		Stop Code: {@html or(child.stop_code)}<br />
		Stop Name: {@html or(child.stop_name)}<br />
		TTS Stop Name: {@html or(child.tts_stop_name)}<br />
		Stop Desc: {@html or(child.stop_desc)}<br />
		Stop Coords: {#if child.stop_lat && child.stop_lon}
			<a
				href="https://www.openstreetmap.org?mlat={child.stop_lat}&mlon={child.stop_lon}&zoom=17"
				target="_blank"
			>
				{child.stop_lat}, {child.stop_lon}
			</a>
		{:else}
			{@html or(child.stop_lat)}, {@html or(child.stop_lon)}
		{/if}<br />
		Zone ID: {@html or(child.zone_id)}<br />
		Stop URL:
		{#if child.stop_url}
			<a href={child.stop_url}>{child.stop_url}</a>
		{:else}
			{@html or(child.stop_url)}
		{/if}<br />
		Location Type: {@html or(child.location_type)}<br />
		Parent Station: {@html or(child.parent_station)}<br />
		Stop Timezone: {@html or(child.stop_timezone)}<br />
		Wheelchair Accessible: {@html or(child.wheelchair_boarding)}<br />
		Level ID: {@html or(child.level_id)}<br />
		Platform Code: {@html or(child.platform_code)}<br />
	{/each}
{/if}

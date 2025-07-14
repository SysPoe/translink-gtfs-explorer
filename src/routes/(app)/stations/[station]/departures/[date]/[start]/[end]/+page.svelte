<script lang="ts">
	import DepartureList from '$lib/components/DepartureList.svelte';

	let { data } = $props();
	let info = data.stationInfo;

	const or = (value: any) => {
		if (value === null) return '<b>null</b>';
		if (value === undefined) return '<b>undefined</b>';
		return value;
	};

	function handleFormSubmission() {
		let date = (document.getElementById('date') as HTMLInputElement).value;
		let start = (document.getElementById('start') as HTMLInputElement).value;
		let end = (document.getElementById('end') as HTMLInputElement).value;
		let id = info.stop_id;
		location.href = `/stations/${id}/departures/${date}/${start}/${end}`;
	}

	function onKeyDown(e: { key: string }) {
		if (e.key === 'Enter') handleFormSubmission();
	}

	function switchToLive() {
		let id = info.stop_id;
		location.href = `/stations/${id}/departures/live`;
	}
</script>

<svelte:head>
  <title>Departures for {info.stop_name || info.stop_id} on {data.date} - Translink GTFS Explorer</title>
</svelte:head>

<h1>
	Departures for
	{#if info.stop_id}
		<a href="/stations/{info.stop_id}/">{info.stop_name || info.stop_id}</a>
	{:else}
		{or(info.stop_name || info.stop_id)}
	{/if}
</h1>

<div id="form">
	Date: <input
		onkeydown={onKeyDown}
		type="text"
		value={data.date}
		id="date"
		name="date"
		placeholder={data.date.toString()}
	/><br />
	Start Time:
	<input
		onkeydown={onKeyDown}
		type="text"
		value={data.start}
		id="start"
		name="start"
		placeholder={data.start}
	/><br />
	End Time:
	<input
		onkeydown={onKeyDown}
		type="text"
		value={data.end}
		id="end"
		name="end"
		placeholder={data.end}
	/><br />
	<button onclick={handleFormSubmission}>Go</button>
	<button onclick={switchToLive}>Switch to Live View</button>
</div>

<DepartureList {...data} />

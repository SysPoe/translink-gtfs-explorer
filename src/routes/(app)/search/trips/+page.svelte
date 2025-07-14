<script lang="ts">
	import { guruData } from '$lib/runGuru';

	let stopsAt: { station: string; platform: string; key: number }[] = $state([]);

	function addStopsAt() {
		stopsAt = [...stopsAt, { station: '', platform: '', key: Date.now() + Math.random() }];
	}

	function removeStopsAt(index: number) {
		stopsAt = stopsAt.filter((_, i) => i !== index);
	}

	let { data } = $props();
	let stationList: { id: string; name: string }[] = data.stationList;

	let serviceDates: { value: string; key: number }[] = $state([]);

	function addServiceDate() {
		serviceDates = [...serviceDates, { value: '', key: Date.now() + Math.random() }];
	}

	function removeServiceDate(index: number) {
		serviceDates = serviceDates.filter((_, i) => i !== index);
	}
</script>

<svelte:head>
  <title>Search Trips - Translink GTFS Explorer</title>
</svelte:head>

<h2>Search Trips</h2>

<div id="search-box">
	<form action="/search/trips/res" method="get">
		<div>
			<label>
				Start:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
				<select name="start">
					<option value="">Select station</option>
					{#each stationList as station}
						<option value={station.id}>{station.name}</option>
					{/each}
				</select>
			</label>
			<input type="number" name="startPlatform" placeholder="Platform" />
		</div>
		<div>
			<label>
				Destination:
				<select name="destination">
					<option value="">Select station</option>
					{#each stationList as station}
						<option value={station.id}>{station.name}</option>
					{/each}
				</select>
			</label>
			<input type="number" name="destinationPlatform" placeholder="Platform" />
		</div>
		<br />
		<div>
			Stops at:<br />
			{#each stopsAt as stop, i (stop.key)}
				<select name={'stopsAt' + i}>
					<option value="">Select station</option>
					{#each stationList as station}
						<option value={station.id}>{station.name}</option>
					{/each}
				</select>
				<input type="number" name={'stopsAtPlatform' + i} placeholder="Platform" />
				<button type="button" onclick={() => removeStopsAt(i)} style="margin-left:4px">✕</button>
				{#if i === stopsAt.length - 1}
					<button type="button" onclick={addStopsAt}>+</button>
				{:else}
					AND
				{/if}
				<br />
			{/each}
			{#if stopsAt.length === 0}
				<button type="button" onclick={addStopsAt}>+</button>
			{/if}
		</div>
		<br />
		<div>
			Service Date/s:<br />
			{#each serviceDates as date, i (date.key)}
				<div class="calendar-input">
					<input type="date" name={'serviceDate' + i} />
					<button type="button" onclick={() => removeServiceDate(i)} style="margin-left:4px"
						>✕</button
					>
					{#if i === serviceDates.length - 1}
						<button type="button" onclick={addServiceDate}>+</button>
					{:else}
						AND
					{/if}
				</div>
				<br />
			{/each}
			{#if serviceDates.length === 0}
				<button type="button" onclick={addServiceDate}>+</button>
			{/if}
		</div>
		<br />
		<label>
			Route Short Name: <input type="text" name="routeShortName" placeholder="e.g. IPCA"/>
		</label><br />
		<label>
			Run Vehicle:
			<select name="runVehicle">
				<option value="">Any vehicle</option>
				{#each Object.keys(guruData.first) as letter}
					<option value={letter}>{letter} - {guruData.first[letter]}</option>
				{/each}
			</select>
		</label><br />
		<label>
			Run Destination:
			<select name="runDestination">
				<option value="">Any destination</option>
				{#each Object.keys(guruData.second) as letter}
					<option value={letter}>{letter} - {guruData.second[letter]}</option>
				{/each}
			</select>
		</label>

		<br /><br />

		<details>
			<summary>Advanced</summary>
			<label>
				Service ID:<br />
				<input type="text" name="serviceId" />
			</label><br />
			<label>
				Route ID:<br />
				<input type="text" name="routeId" />
			</label>
		</details>
		<br />
		<button type="submit">Search</button>
	</form>
</div>

<style>
	.calendar-input {
		display: inline-block;
		align-items: center;
		gap: 4px;
	}
</style>

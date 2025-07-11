<script lang="ts">
	import { routeAttributes } from 'gtfs/models';
	import type { Trip, Route, Stop, TripUpdate, StopTimeUpdate, StopTime } from 'gtfs';

	export let tripUpdates: Record<string, TripUpdate>;
	export let stopTimeUpdates: Record<string, StopTimeUpdate>;
	export let stopTimes: Array<StopTime>;
	export let trips: Record<string, Trip>;
	export let routes: Record<string, Route>;
	export let stops: Record<string, Stop>;
	export let expressInfos: Record<string, string>;
	export let runGurus: Record<string, string>;

	function formatTime(time: string | undefined): string {
		if (!time) return '??:??';
		const [h, m] = time.split(':');
		let hour = Number.parseInt(h);
		if (hour >= 24) {
			hour = hour - 24;
		}
		return `${hour.toString().padStart(2, '0')}:${m}`;
	}

	function round(num: number): number {
		return num < 0 ? -Math.ceil(-num) : Math.floor(num);
	}
</script>

{#each stopTimes as dep}
	{@const trip = trips[dep.trip_id]}
	{@const route = routes[trip.route_id]}
	{@const stop = stops[dep.stop_id || '']}
	<hr />
	{#if stopTimeUpdates[dep.trip_id]}
		{@const stUpdate = stopTimeUpdates[dep.trip_id]}

		{#if stUpdate.departure_timestamp}
			{new Date(stUpdate.departure_timestamp * 1000 + 10 * 3600_000).toISOString().slice(11, 16)}
		{:else}
			{formatTime(dep.departure_time)}
		{/if}

		{#if stUpdate.stop_id}
			p{stops[stUpdate.stop_id].platform_code}
		{:else}
			p{stop.platform_code}
		{/if}
	{:else}
		{formatTime(dep.arrival_time)} p{stop.platform_code}
	{/if}

	- <a href="/trip/{trip.trip_id}">{trip.trip_id.slice(-4)}</a>
	{route.route_short_name}
	{(trip.trip_headsign || 'unknown').replace('station', '').trim()}
	{#if dep.drop_off_type == 1}
		(No Drop Off)
	{/if}
	{#if dep.pickup_type == 1}
		(No Pickup)
	{/if}
	<br />

	<!-- Flexbox container for the second row of details -->
	<div class="details-row">
		<div class="delay-column">
			{#if stopTimeUpdates[dep.trip_id]}
				{@const stUpdate = stopTimeUpdates[dep.trip_id]}
				{@const delay = round((stUpdate.departure_delay || 0) / 60)}

				{#if delay > 5}
					<span class="delay late">({delay}m late)</span>
				{:else if delay > 0}
					<span class="delay sorta-late">({delay}m late)</span>
				{:else if delay == 0}
					<span class="delay ontime">(on time)</span>
				{:else if delay < 0}
					<span class="delay early">({delay}m early)</span>
				{/if}
			{:else}
				<span class="delay scheduled">(scheduled)</span>
			{/if}
		</div>

		<div class="info-column">
			{expressInfos[dep.trip_id]}
			<br />
			<i>RunGuru says {trip.trip_id.slice(-4)} is a {runGurus[dep.trip_id]}</i>
		</div>
	</div>
{/each}

<style>
	ul {
		list-style: none;
		padding: 0;
	}

	li {
		padding: 8px 0;
	}

	.delay {
		font-size: 0.8em;
	}

	.scheduled {
		color: gray;
	}

	.sorta-late {
		color: orange;
	}

	.late {
		color: red;
	}

	.ontime {
		color: darkgreen;
	}

	.early {
		color: blue;
	}

	.details-row {
		display: flex;
		align-items: baseline;
	}

	.delay-column {
		width: 100px;
		flex-shrink: 0;
	}
</style>

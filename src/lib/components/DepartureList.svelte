<script lang="ts">
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

	function formatDelayString(delay: number): string {
		const absDelay = Math.abs(delay);
		const hours = Math.floor(absDelay / 60);
		const minutes = absDelay % 60;
		let str = '';
		if (hours > 0) {
			str += `${hours}h`;
			if (minutes > 0) str += ` ${minutes}m`;
		} else {
			str += `${minutes}m`;
		}
		if (delay > 0) {
			str += ' late';
		} else if (delay < 0) {
			str += ' early';
		}
		return `(${str.trim()})`;
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

	- <a href="/trip/{trip.trip_id}">{trip.trip_id.slice(-4)}</a> to {(
		trip.trip_headsign || 'unknown'
	)
		.replace('station', '')
		.trim()}
	({route.route_short_name})
	{#if dep.drop_off_type == 1}
		(No Drop Off)
	{:else if dep.drop_off_type == 2}
		(Phone Agency to Arrange Drop Off)
	{:else if dep.drop_off_type == 3}
		(Coordinate with Driver for Drop Off)
	{/if}
	{#if dep.pickup_type == 1}
		(No Pickup)
	{:else if dep.pickup_type == 2}
		(Phone Agency to Arrange Pickup)
	{:else if dep.pickup_type == 3}
		(Coordinate with Driver for Pickup)
	{/if}
	<br />

	<!-- Flexbox container for the second row of details -->
	<div class="details-row">
		<div class="delay-column">
			{#if stopTimeUpdates[dep.trip_id]}
				{@const stUpdate = stopTimeUpdates[dep.trip_id]}
				{@const delay = round((stUpdate.departure_delay || 0) / 60)}

				{#if delay > 0}
					<span class="delay {delay > 5 ? 'late' : 'sorta-late'}">{formatDelayString(delay)}</span>
				{:else if delay == 0}
					<span class="delay ontime">(on time)</span>
				{:else if delay < 0}
					<span class="delay early">{formatDelayString(delay)}</span>
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
	.delay {
		font-size: 0.75em;
		font-weight: bold;
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
		width: 115px;
		flex-shrink: 0;
	}
</style>

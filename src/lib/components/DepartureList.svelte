<script lang="ts">
	import { routeAttributes } from 'gtfs/models';

	export let stopTimes: any[];
	export let trips: any;
	export let routes: any;
	export let stops: any;
	export let expressInfos: any;
	export let runGurus: any;

	function formatTime(time: string) {
		console.log(time);
		if (!time) return '??:??';
		const [h, m] = time.split(':');
		let hour = Number.parseInt(h);
		if (hour >= 24) {
			hour = hour - 24;
		}
		return `${hour.toString().padStart(2, '0')}:${m}`;
	}
</script>

<ul>
	{#each stopTimes as dep}
		{@const trip = trips[dep.trip_id]}
		{@const route = routes[trip.route_id]}
		{@const stop = stops[dep.stop_id || '']}
		<li>
			<hr />
			{formatTime(dep.arrival_time)} p{stop.platform_code} -
			<a href="/trip/{trip.trip_id}">{trip.trip_id.slice(-4)}</a>
			{route.route_short_name}
			{(trip.trip_headsign || 'unknown').replace('station', '').trim()}
			{#if dep.drop_off_type == 1}
				(No Drop Off)
			{/if}
			{#if dep.pickup_type == 1}
				(No Pickup)
			{/if}
			<br />
			<span style="display:inline-block; width: 58px; height: 1px;"></span>
			{expressInfos[dep.trip_id]}
			<br />
			<span style="display:inline-block; width: 58px; height: 1px;"></span>
			<i>RunGuru says {trip.trip_id.slice(-4)} is a {runGurus[dep.trip_id]}</i>
		</li>
	{/each}
</ul>

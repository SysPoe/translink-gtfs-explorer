<script lang="ts">
	import { routeAttributes } from 'gtfs/models';

	export let stopTimes: any[];
	export let trips: any;
	export let routes: any;
	export let stops: any;
	export let expressInfos: any;
	export let runGurus: any;
</script>

<ul>
	{#each stopTimes as dep}
		{@const trip = trips[dep.trip_id]}
		{@const route = routes[trip.route_id]}
		{@const stop = stops[dep.stop_id || '']}
		<li>
			<hr />
			{(dep.arrival_time || '??:??:??').slice(0, 5)} p{stop.platform_code} -
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

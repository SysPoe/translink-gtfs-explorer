<script lang="ts">
	

	export let stopTimes: any[];
	export let trips: any;
	export let routes: any;
	export let stops: any;
	export let expressInfos: any;
	export let runGurus: any;

	function formatTime(time: string, delay: number | undefined) {
		if (delay === undefined) {
			return time.slice(0, 5);
		}

		const [hours, minutes, seconds] = time.split(':').map(Number);
		const totalSeconds = hours * 3600 + minutes * 60 + seconds + delay;

		const newHours = Math.floor(totalSeconds / 3600);
		const newMinutes = Math.floor((totalSeconds % 3600) / 60);

		const formattedHours = String(newHours).padStart(2, '0');
		const formattedMinutes = String(newMinutes).padStart(2, '0');

		const delayMinutes = Math.round(delay / 60);
		let delayString = '';
		if (delayMinutes === 0) {
			delayString = '(on time)';
		} else if (delayMinutes > 0) {
			delayString = `(${delayMinutes}m late)`;
		} else {
			delayString = `(${-delayMinutes}m early)`;
		}

		return `${formattedHours}:${formattedMinutes} ${delayString}`;
	}
</script>

<ul>
	{#each stopTimes as dep}
		{@const trip = trips[dep.trip_id]}
		{@const route = routes[trip.route_id]}
		{@const stop = stops[dep.stop_id || '']}
		<li>
			<hr />
			{#if dep.schedule_relationship === 'SKIPPED'}
				<del>{formatTime(dep.arrival_time || '00:00:00', dep.arrival_delay)} p{stop.platform_code} -
				<a href="/trip/{trip.trip_id}">{trip.trip_id.slice(-4)}</a>
				{route.route_short_name}
				{(trip.trip_headsign || 'unknown').replace('station', '').trim()}</del> (cancelled)
			{:else if dep.schedule_relationship === 'NEW' || dep.schedule_relationship === 'REPLACEMENT'}
				{formatTime(dep.arrival_time || '00:00:00', dep.arrival_delay)} p{stop.platform_code} -
				<a href="/trip/{trip.trip_id}">{trip.trip_id.slice(-4)}</a>
				{route.route_short_name}
				{(trip.trip_headsign || 'unknown').replace('station', '').trim()} (added)
			{:else}
				{formatTime(dep.arrival_time || '00:00:00', dep.arrival_delay)} p{stop.platform_code} -
				<a href="/trip/{trip.trip_id}">{trip.trip_id.slice(-4)}</a>
				{route.route_short_name}
				{(trip.trip_headsign || 'unknown').replace('station', '').trim()}
			{/if}
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

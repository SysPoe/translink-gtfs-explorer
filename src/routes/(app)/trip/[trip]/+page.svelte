<script lang="ts">
	let { data } = $props();
	let { tripInfo } = data;
	let today = Number.parseInt(
		new Date(Date.now() + 60 * 60 * 10 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
	);

	function round(num: number): number {
		return num < 0 ? -Math.ceil(-num) : Math.floor(num);
	}
</script>

<svelte:head>
  <title>Trip {data.trip} - Translink GTFS Explorer</title>
</svelte:head>

<h2>{data.trip}</h2>

<h3>Trip Info</h3>
Headsign: {tripInfo.trip.trip_headsign}<br />
Service ID: {tripInfo.trip.service_id}<br />
Run: <a href="/run/{tripInfo.run}">{tripInfo.run}</a><br />
<i>RunGuru says that {tripInfo.run} is a {tripInfo.runGuru}</i>

<h3>Route: {tripInfo.route.route_id}</h3>
Short Name: {tripInfo.route.route_short_name}<br />
Long Name: {tripInfo.route.route_long_name}

<h3>Service Data</h3>
{#each tripInfo.serviceDates as serviceDate}
	<div>
		{@html serviceDate == today ? `<b><u>${serviceDate}</u></b>` : serviceDate}:
		{#if tripInfo.tracks[serviceDate] == 'unknown'}
			Unknown track
		{:else}
			<a href="/track/{serviceDate}/{tripInfo.tracks[serviceDate]}">
				Track: {tripInfo.tracks[serviceDate]}
			</a>
		{/if}
		<ul>
			{#each tripInfo.stopTimes[serviceDate] as stopTime}
				{@const tripUpdate = tripInfo.updates.find(
					(v) => v.stop_sequence == stopTime.stop_sequence
				)}
				<li>
					{stopTime.arrival_time}
					{#if serviceDate == today && tripUpdate != undefined && tripUpdate != null}
						{@const delay = round((tripUpdate.departure_delay || 0) / 60)}
						<span
							style="color:{delay >= 5
								? 'red'
								: delay >= 1
									? 'darkorange'
									: delay == 0
										? 'darkgreen'
										: 'blue'};">{delay >= 0 ? '+' : ''}{delay}</span
						>
						{tripUpdate.schedule_relationship?.slice(0, 3)}
						-
						{#if tripUpdate.stop_id && tripUpdate.parent}
							<a href="/stations/{tripUpdate.parent?.stop_id}/">
								{tripUpdate.parent?.stop_id.replace(/place_|sta|stn/g, '').toUpperCase()}{tripUpdate
									.stop?.platform_code}
							</a>
							({tripUpdate.parent?.stop_name} p{tripUpdate.stop?.platform_code})
							{#if tripUpdate.stop_id != stopTime.stop_id}
								FROM
								<a href="/stations/{stopTime.parent.stop_id}/">
									{stopTime.parent.stop_id.replace(/place_|sta|stn/g, '').toUpperCase()}{stopTime
										.stop.platform_code}
								</a>
							{/if}
						{:else}
							<a href="/stations/{stopTime.parent.stop_id}/">
								{stopTime.parent.stop_id.replace(/place_|sta|stn/g, '').toUpperCase()}{stopTime.stop
									.platform_code}
							</a>
							({stopTime.parent.stop_name} p{stopTime.stop.platform_code})
						{/if}
					{:else}
						-
						<a href="/stations/{stopTime.parent.stop_id}/">
							{stopTime.parent.stop_id.replace(/place_|sta|stn/g, '').toUpperCase()}{stopTime.stop
								.platform_code}
						</a>
						({stopTime.parent.stop_name} p{stopTime.stop.platform_code})
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/each}

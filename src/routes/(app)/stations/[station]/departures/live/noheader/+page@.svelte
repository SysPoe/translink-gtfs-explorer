<script lang="ts">
	import DepartureList from '$lib/components/DepartureList.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	let info = data.stationInfo;

	const or = (value: any) => {
		if (value === null) return '<b>null</b>';
		if (value === undefined) return '<b>undefined</b>';
		return value;
	};

	function switchToNormal() {
		let id = info.stop_id;
		const now = new Date();
		const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
		const start = '00:00:00';
		const end = '28:00:00';
		location.href = `/stations/${id}/departures/${date}/${start}/${end}`;
	}

	onMount(() => {
		setTimeout(() => {
			location.reload();
		}, 15000);
	});
</script>

<DepartureList {...data} />

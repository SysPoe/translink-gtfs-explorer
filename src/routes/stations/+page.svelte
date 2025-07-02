<script lang="ts">
	import dep from '$lib/assets/dep.svg';

	let { data } = $props();
	let { stations } = data;

	const or = (value: any) => {
		if (value === null) return '<b>null</b>';
		if (value === undefined) return '<b>undefined</b>';
		return value;
	};
</script>

<h1>Browse Stations</h1>
<ul>
	{#each stations as st}
		<li>
			<a href="/stations/{st.stop_id}">{st.stop_name}</a>
		</li>
	{/each}
</ul>
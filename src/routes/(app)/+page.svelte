<script lang="ts">
	import type { KeyboardEventHandler } from 'svelte/elements';

	let today = Number.parseInt(
		new Date(Date.now() + 60 * 60 * 10 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
	);


</script>

<svelte:head>
  <title>Home - Translink GTFS Explorer</title>
</svelte:head>

<a href="/stations/">Browse stations</a><br />
<a href="/alerts/">Browse alerts</a><br />
<a href="/search/runs/">Search runs</a><br />
<a href="/search/trips/">Search trips</a><br />
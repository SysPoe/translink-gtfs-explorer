<script lang="ts">
	import type { KeyboardEventHandler } from 'svelte/elements';

	let today = Number.parseInt(
		new Date(Date.now() + 60 * 60 * 10 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
	);

	function handleRunSubmit() {
		let search = (document.getElementById('search') as HTMLInputElement).value.toUpperCase().trim();
		let date = (document.getElementById('date') as HTMLInputElement).value.trim();
		if (/^[A-Z0-9]{4}$/.test(search)) location.href = '/run/' + search;
		else
			location.href =
				'/search/' + encodeURIComponent(search) + '/' + (/^\d{8}$/.test(date) ? date : '');
	}

	let handleRunKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
		if (e.key === 'Enter') handleRunSubmit();
	};
</script>

<div id="run-search">
	<label for="search">Search run numbers using regex:</label>
	<input type="text" name="search" id="search" placeholder="^DK..$" onkeydown={handleRunKeyDown} />
	<input
		type="text"
		name="date"
		id="date"
		value={today}
		placeholder="Any Date"
		onkeydown={handleRunKeyDown}
	/>
	<input type="submit" value="Search" id="search-submit" onclick={handleRunSubmit} />
</div>
<div id="browse-stations">
	<a href="/stations/">Browse stations</a>
</div>
<script lang="ts">
    let { children } = $props();
</script>

<nav>
    <a href="/">Home</a>
    <a href="/alerts">Alerts</a>
    <a href="/stations">Stations</a>
</nav>

{@render children()}
<script>
    export let data../../alerts/$types.js;
</script>

<h1>Service Alerts</h1>

{#if data.alerts.length > 0}
    <ul>
        {#each data.alerts as alert}
            <li>
                <strong>{alert.header_text}</strong>
                <p>{@html alert.description_text}</p>
            </li>
        {/each}
    </ul>
{:else}
    <p>No service alerts at this time.</p>
{/if}

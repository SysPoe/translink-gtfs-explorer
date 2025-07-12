import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5000,
		host: '0.0.0.0',
		allowedHosts: ['syspoe.zone.id']
	},
	ssr: {
		noExternal: ['svelte-select']
	}
});

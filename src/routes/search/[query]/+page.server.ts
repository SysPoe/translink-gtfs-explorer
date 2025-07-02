import type { PageServerLoad } from './[date]/$types';
import { getRuns } from '$lib/run';

export const load: PageServerLoad = async ({ params }) => {
	return {
		query: params.query,
		runs: await getRuns(params.query)
	};
};

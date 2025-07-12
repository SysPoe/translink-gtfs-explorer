import type { PageServerLoad } from './$types';
import { getRunDates } from '$lib/run';
import runGuru from '$lib/runGuru';

export const load: PageServerLoad = async ({ params }) => {
	return {
		run: params.run,
		runDates: await getRunDates(params.run.toUpperCase()),
		guru: runGuru(params.run.toUpperCase())
	};
};

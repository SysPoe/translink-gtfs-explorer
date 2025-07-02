import type { PageServerLoad } from './$types';
import { getRunsByDay } from '$lib/run';

export const load: PageServerLoad = async ({ params }) => {
	return {
		query: params.query,
		date: params.date,
		results: await getRunsByDay(params.query, Number.parseInt(params.date))
	};
};

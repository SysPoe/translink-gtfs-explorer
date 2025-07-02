import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTripInfo } from '$lib/trip';

export const load: PageServerLoad = async ({ params }) => {
	let tripInfo = await getTripInfo(params.trip);
	if(tripInfo === null || !tripInfo) return error(404, {
		message: `Trip ${params.trip} not found`
	})
	return { trip: params.trip, tripInfo };
};

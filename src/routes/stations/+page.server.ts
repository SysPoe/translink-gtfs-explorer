import { getStations } from '$lib/station';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return { stations: await getStations() };
};

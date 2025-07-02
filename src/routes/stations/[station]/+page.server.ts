import { getStationData } from '$lib/station';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return { station: params.station, stationInfo: await getStationData(params.station) };
};

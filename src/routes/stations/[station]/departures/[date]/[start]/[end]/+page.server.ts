import { getDepartures, getStationData } from '$lib/station';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return {
		station: params.station,
		date: Number.parseInt(params.date),
		start: params.start,
		end: params.end,
		stationInfo: await getStationData(params.station),
		...await getDepartures(params.station, Number.parseInt(params.date), params.start, params.end)
	};
};

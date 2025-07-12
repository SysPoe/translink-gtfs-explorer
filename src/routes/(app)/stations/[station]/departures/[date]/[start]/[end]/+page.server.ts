import { error } from '@sveltejs/kit';
import { getDepartures, getStationData } from '$lib/station';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		let stationInfo = await getStationData(params.station);
		return {
			station: params.station,
			date: Number.parseInt(params.date),
			start: params.start,
			end: params.end,
			stationInfo,
			...(await getDepartures(
				params.station,
				Number.parseInt(params.date),
				params.start,
				params.end
			))
		};
	} catch (err) {
		return error(404, {
			message: `Station "${params.station}" not found`
		});
	}
};

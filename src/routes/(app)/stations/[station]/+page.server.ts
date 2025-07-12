import { error } from '@sveltejs/kit';
import { getStationData } from '$lib/station';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		let stationInfo = await getStationData(params.station);
		return { station: params.station, stationInfo: stationInfo };
	} catch (err) {
		return error(404, {
			message: `Station "${params.station}" not found`
		});
	}
};

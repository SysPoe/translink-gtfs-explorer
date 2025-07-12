import { getStations } from '$lib/station';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const stations = await getStations();
    return {
		stationList: stations.map((v) => ({
			id: v.stop_id,
			name: v.stop_name?.replaceAll(/station/gi, "").trim()
		})) as { id: string; name: string }[]
    };
};

		
import { getDepartures, getStationData } from '$lib/station';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const now = new Date();
    const date = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const start = now.toTimeString().slice(0, 8);
    const end = "28:00:00";

    return {
        station: params.station,
        date: date,
        start: start,
        end: end,
        stationInfo: await getStationData(params.station),
        ...await getDepartures(params.station, date, start, end)
    };
};

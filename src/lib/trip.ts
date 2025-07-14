import tGTFS from './gtfs';
import * as gtfs from 'gtfs';
import { getServiceDates } from './utils/calendar';
import { getTrack, traceLoadData } from './trace';
import runGuru from './runGuru';
import { findPassingStopTimes, type AugmentedStopTime } from './utils/stops';

let trips: gtfs.Trip[];
let stopTimes: gtfs.StopTime[];

async function loadData() {
	if (trips != undefined && stopTimes != undefined) return;
	await tGTFS.loadGTFS();
	trips = tGTFS.getTrips();
	stopTimes = tGTFS.getStopTimes();
}

type AugmentedStopTimeParent = AugmentedStopTime & {
	parent: gtfs.Stop;
	stop: gtfs.Stop;
};

export async function getTripInfo(trip_id: string) {
	await loadData();
	let trip = gtfs.getTrips({ trip_id })[0];

	if(trip === undefined) return null;
	
	let serviceDates = getServiceDates(
		gtfs.getCalendars({ service_id: trip.service_id }),
		gtfs.getCalendarDates({ service_id: trip.service_id })
	);

	let stopTimes: { [key: number]: AugmentedStopTimeParent[] } = {};
	let tracks: { [key: number]: string } = {};

	for (let date of serviceDates[Object.keys(serviceDates)[0]]) {
		await traceLoadData();
		tracks[date] = (await getTrack(trip_id.slice(-4), date)) || 'unknown';
	}

	serviceDates[Object.keys(serviceDates)[0]].forEach(async (v) => {
		// @ts-ignore
		stopTimes[v] = ((await findPassingStopTimes(gtfs
			.getStoptimes({ date: v, trip_id: trip.trip_id })
			.sort((a, b) => a.stop_sequence - b.stop_sequence))) as AugmentedStopTimeParent[])
			.map((v) => {
				v.stop = gtfs.getStops({ stop_id: v.stop_id })[0];
				v.parent = gtfs.getStops({ stop_id: v.stop.parent_station })[0];
				return v;
			});
	});

	return {
		trip,
		serviceDates: serviceDates[Object.keys(serviceDates)[0]],
		route: gtfs.getRoutes({ route_id: trip.route_id })[0],
		run: trip_id.slice(-4),
		stopTimes,
		tracks,
		runGuru: runGuru(trip_id.slice(-4)),
		updates: gtfs.getStopTimeUpdates({ trip_id }).map((v) => {
			if(!v.stop_id) return v;
			return {
				...v,
				parent: v.stop_id
					? gtfs.getStops({ stop_id: v.stop_id })[0]?.parent_station
						? gtfs.getStops({ stop_id: gtfs.getStops({ stop_id: v.stop_id })[0].parent_station })[0]
						: undefined
					: undefined,
				stop: v.stop_id ? gtfs.getStops({ stop_id: v.stop_id })[0] : undefined
			};
		})
	};
}

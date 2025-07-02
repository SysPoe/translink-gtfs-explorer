import tGTFS from './gtfs';
import * as gtfs from 'gtfs';
import { getServiceDates } from './utils/calendar';
import { getTrack, traceLoadData } from './trace';
import runGuru from './runGuru';

let trips: gtfs.Trip[];
let stopTimes: gtfs.StopTime[];

async function loadData() {
	if (trips != undefined && stopTimes != undefined) return;
	await tGTFS.loadGTFS();
	trips = tGTFS.getTrips();
	stopTimes = tGTFS.getStopTimes();
}

type StopTimeParent = {
	trip_id: string;
	arrival_time?: string;
	arrival_timestamp?: gtfs.UnixTimestamp;
	departure_time?: string;
	departure_timestamp?: gtfs.UnixTimestamp;
	location_group_id?: string;
	location_id?: string;
	stop_id?: string;
	stop_sequence: number;
	stop_headsign?: string;
	start_pickup_drop_off_window?: string;
	start_pickup_drop_off_window_timestamp?: gtfs.UnixTimestamp;
	pickup_type?: 0 | 1 | 2 | 3;
	drop_off_type?: 0 | 1 | 2 | 3;
	continuous_pickup?: 0 | 1 | 2 | 3;
	continuous_drop_off?: 0 | 1 | 2 | 3;
	shape_dist_traveled?: number;
	timepoint?: 0 | 1;
	pickup_booking_rule_id?: string;
	drop_off_booking_rule_id?: string;
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

	let stopTimes: { [key: number]: StopTimeParent[] } = {};
	let tracks: { [key: number]: string } = {};

	for (let date of serviceDates[Object.keys(serviceDates)[0]]) {
		await traceLoadData();
		tracks[date] = (await getTrack(trip_id.slice(-4), date)) || 'unknown';
	}

	serviceDates[Object.keys(serviceDates)[0]].forEach((v) => {
		// @ts-ignore
		stopTimes[v] = gtfs
			.getStoptimes({ date: v, trip_id: trip.trip_id })
			.sort((a, b) => a.stop_sequence - b.stop_sequence)
			.map((v) => {
				// @ts-ignore
				v.stop = gtfs.getStops({ stop_id: v.stop_id })[0];
				// @ts-ignore
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

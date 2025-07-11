import tGTFS from './gtfs';
import * as gtfs from 'gtfs';
import { timeSecs } from './utils/time';
import { findExpressString } from './utils/express';
import runGuru from './runGuru';

let trips: gtfs.Trip[];
let stopTimes: gtfs.StopTime[];

async function loadData() {
	if (trips != undefined && stopTimes != undefined) return;
	await tGTFS.loadGTFS();
	trips = tGTFS.getTrips();
	stopTimes = tGTFS.getStopTimes();
}

type Stop = {
	stop_id: string;
	stop_code?: string;
	stop_name?: string;
	tts_stop_name?: string;
	stop_desc?: string;
	stop_lat?: number;
	stop_lon?: number;
	zone_id?: string;
	stop_url?: string;
	location_type?: 0 | 1 | 2 | 3 | 4;
	parent_station?: string;
	stop_timezone?: string;
	wheelchair_boarding?: 0 | 1 | 2;
	level_id?: string;
	platform_code?: string;
	child_stations: gtfs.Stop[];
};

export async function getStationData(stop_id: string): Promise<Stop> {
	await loadData();

	// @ts-expect-error The gtfs library doesn't have the correct types
	const out: Stop = gtfs.getStops({ stop_id })[0];
	out.child_stations = gtfs
		.getStops({ parent_station: stop_id })
		.filter((v) => (out.stop_name ? v.stop_name?.startsWith(out.stop_name) : true))
		.filter((v) => v.platform_code && /^\d+/.test(v.platform_code))
		.sort((a, b) =>
			(a.stop_name || 0) < (b.stop_name || 0) ? -1 : a.stop_name == b.stop_name ? 0 : 1
		);

	return out;
}

export async function getStations() {
	await loadData();
	return gtfs.getStops().filter((v) => v.stop_id.startsWith('place_'));
}

export async function getDepartures(
	stop_id: string,
	date: number,
	start_time: string,
	end_time: string
) {
	const children = gtfs.getStops({ parent_station: stop_id }).map((v) => v.stop_id);
	let stopTimes: gtfs.StopTime[] = gtfs.getStoptimes({ stop_id, date });
	for (const c of children) stopTimes = stopTimes.concat(gtfs.getStoptimes({ stop_id: c, date }));

	stopTimes = stopTimes
		.filter((v) => (timeSecs(v.departure_time || '00:00:00') || 0) >= (timeSecs(start_time) || 0))
		.filter((v) => (timeSecs(v.departure_time || '00:00:00') || 0) <= (timeSecs(end_time) || 0))
		.filter((v) => v.trip_id.includes('-QR '))
		.sort((a, b) => (a.arrival_timestamp || 0) - (b.arrival_timestamp || 0));

	const tripIds = [...new Set(stopTimes.map((v) => v.trip_id))];
	const trips: { [trip_id: string]: gtfs.Trip } = {};
	for (const id of tripIds) trips[id] = gtfs.getTrips({ trip_id: id })[0];

	const routeIds = [...new Set(Object.keys(trips).map((v) => trips[v].route_id))];
	const routes: { [route_id: string]: gtfs.Route } = {};
	for (const id of routeIds) routes[id] = gtfs.getRoutes({ route_id: id })[0];

	const stopIds: string[] = [...new Set(stopTimes.map((v) => v.stop_id || ''))];
	const stops: { [stop_id: string]: gtfs.Stop } = {};
	for (const id of stopIds) stops[id] = gtfs.getStops({ stop_id: id })[0];
	for (const id of Object.keys(stops))
		if (stops[id].parent_station && !stops[stops[id].parent_station])
			stops[stops[id].parent_station] = gtfs.getStops({ stop_id: stops[id].parent_station })[0];

	const runGurus: { [trip_id: string]: string } = {};
	for (const id of tripIds) runGurus[id] = runGuru(id.slice(-4));

	const expressInfos: { [trip_id: string]: string } = {};
	for (const id of tripIds) {
		let tripStopTimes = gtfs
			.getStoptimes({ trip_id: id })
			.sort((a, b) => a.stop_sequence - b.stop_sequence);

		let mySeq =
			tripStopTimes.find(
				(v) =>
					v.stop_id === stop_id ||
					children.includes(v.stop_id?.toString() || 'definitely not included')
			)?.stop_sequence || 0;
		tripStopTimes = tripStopTimes.filter((v) => v.stop_sequence >= mySeq);

		for (const time of tripStopTimes)
			stops[time.stop_id || ''] = gtfs.getStops({ stop_id: time.stop_id || '' })[0];
		for (const id of Object.keys(stops))
			if (stops[id].parent_station && !stops[stops[id].parent_station])
				stops[stops[id].parent_station] = gtfs.getStops({ stop_id: stops[id].parent_station })[0];

		const tripStops = tripStopTimes.map((v) => gtfs.getStops({ stop_id: v.stop_id })[0]);
		const expressInfo = findExpressString(tripStops, stops, stop_id);
		expressInfos[id] = expressInfo;
	}

	return { stopTimes, trips, stops, routes, runGurus, expressInfos };
}

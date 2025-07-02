import tGTFS from './gtfs';
import * as gtfs from 'gtfs';
import { timeSecs } from './utils/time';
import findExpress from './utils/express';
import runGuru from './runGuru';
import { getTripUpdates, getStopTimeUpdates } from 'gtfs';

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
		.sort(
			(a, b) =>
				(timeSecs(a.departure_time || '00:00:00') || 0) +
				(a.departure_delay || 0) -
				((timeSecs(b.departure_time || '00:00:00') || 0) + (b.departure_delay || 0))
		);

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
		const expressData = findExpress(tripStops.map((v) => v.parent_station || v.stop_id)).filter(
			(v) => v.type !== 'local'
		);

		// Ew. Gross. BTW the function wrapper is so that you can collapse it
		const expressInfo =
			expressData.length > 0
				? (() =>
						expressData
							.reduce(
								(acc, segment, index) => {
									if (index === 0 || segment.from !== acc[acc.length - 1].to) {
										acc.push({ from: segment.from, to: segment.to, stoppingAt: [] });
									} else {
										acc[acc.length - 1].stoppingAt.push(segment.from);
										acc[acc.length - 1].to = segment.to;
									}
									return acc;
								},
								[] as { from: string; to: string; stoppingAt: string[] }[]
							)
							.map((run) => {
								const startName = stops[run.from]?.stop_name?.replace(' station', '');
								const endName = stops[run.to]?.stop_name?.replace(' station', '');
								const stoppingAtNames = run.stoppingAt.map((stopId) =>
									stops[stopId]?.stop_name?.replace(' station', '')
								);
								const formattedStoppingAtNames =
									stoppingAtNames.length <= 1
										? stoppingAtNames[0]
										: `${stoppingAtNames.slice(0, -1).join(', ')}, and ${stoppingAtNames[stoppingAtNames.length - 1]}`;
								return run.from == stops[stop_id].parent_station || run.from == stop_id
									? run.stoppingAt.length > 0
										? `Running express to ${endName}, stopping only at ${formattedStoppingAtNames}`
										: `Running express to ${endName}`
									: run.stoppingAt.length > 0
										? `Running express between ${startName} and ${endName}, stopping only at ${formattedStoppingAtNames}`
										: `Running express between ${startName} and ${endName}`;
							})
							.join('; '))()
				: 'All stops';

		expressInfos[id] = expressInfo;
	}

	const tripUpdates = getTripUpdates();
	const stopTimeUpdates = getStopTimeUpdates();

	for (const stopTime of stopTimes) {
		const tripUpdate = tripUpdates.find((tu) => tu.trip_id === stopTime.trip_id);
		if (tripUpdate) {
			if (tripUpdate.schedule_relationship === 'SKIPPED') {
				stopTime.schedule_relationship = 'SKIPPED';
			} else {
				let bestStopTimeUpdate: gtfs.StopTimeUpdate | undefined;
				let bestMatchScore = -1; // Higher score means better match

				for (const stu of stopTimeUpdates) {
					if (stu.trip_id !== stopTime.trip_id) continue;

					let currentMatchScore = 0;

					// Score for stop_id match
					if (stu.stop_id === stopTime.stop_id) {
						currentMatchScore += 10; // High score for direct stop_id match
					} else {
						// Check for parent_station match (platform change)
						const currentStopParent = stops[stopTime.stop_id]?.parent_station;
						const updateStopParent = stops[stu.stop_id]?.parent_station;
						if (currentStopParent && updateStopParent && currentStopParent === updateStopParent) {
							currentMatchScore += 5; // Medium score for parent_station match
						}
					}

					// Score for stop_sequence match
					if (stu.stop_sequence === stopTime.stop_sequence) {
						currentMatchScore += 2; // Lower score, as sequence can change
					} else if (stu.stop_sequence && stopTime.stop_sequence) {
						// If sequence doesn't match, but both exist, penalize slightly
						currentMatchScore -= 1;
					}

					// If we have a better match, update bestStopTimeUpdate
					if (currentMatchScore > bestMatchScore) {
						bestMatchScore = currentMatchScore;
						bestStopTimeUpdate = stu;
					}
				}

				if (bestStopTimeUpdate && bestMatchScore > 0) {
					// Only apply if a positive match score
					stopTime.arrival_delay = bestStopTimeUpdate.arrival_delay;
					stopTime.departure_delay = bestStopTimeUpdate.departure_delay;
					// Add schedule_relationship
					if (bestStopTimeUpdate.schedule_relationship) {
						stopTime.schedule_relationship = bestStopTimeUpdate.schedule_relationship;
					}
				}
			}
		}
		for (const tripUpdate of tripUpdates) {
			// Ensure schedule_relationship exists and is either NEW or REPLACEMENT
			if (
				(tripUpdate.schedule_relationship === 'NEW' ||
					tripUpdate.schedule_relationship === 'REPLACEMENT') &&
				tripUpdate.stop_time_update
			) {
				for (const stu of tripUpdate.stop_time_update) {
					if (stu.stop_id === stop_id || children.includes(stu.stop_id || '')) {
						const newStopTime: any = {
							trip_id: tripUpdate.trip_id,
							stop_id: stu.stop_id,
							stop_sequence: stu.stop_sequence,
							arrival_time: stu.arrival?.time
								? new Date(stu.arrival.time * 1000).toTimeString().slice(0, 8)
								: undefined,
							departure_time: stu.departure?.time
								? new Date(stu.departure.time * 1000).toTimeString().slice(0, 8)
								: undefined,
							arrival_delay: stu.arrival?.delay,
							departure_delay: stu.departure?.delay,
							schedule_relationship: tripUpdate.schedule_relationship
						};
						stopTimes.push(newStopTime);

						// Add trip and route info if not already present
						if (!trips[tripUpdate.trip_id]) {
							trips[tripUpdate.trip_id] = gtfs.getTrips({ trip_id: tripUpdate.trip_id })[0];
							if (trips[tripUpdate.trip_id] && !routes[trips[tripUpdate.trip_id].route_id]) {
								routes[trips[tripUpdate.trip_id].route_id] = gtfs.getRoutes({
									route_id: trips[tripUpdate.trip_id].route_id
								})[0];
							}
						}
						if (!runGurus[tripUpdate.trip_id]) {
							runGurus[tripUpdate.trip_id] = runGuru(tripUpdate.trip_id.slice(-4));
						}
						// Express info for new trips might need to be calculated or handled differently if it's not in the static GTFS
						// For now, we'll leave it as is, it might be empty for new trips.
					}
				}
			}
		}

		stopTimes = stopTimes.sort(
			(a, b) =>
				(a.departure_timestamp !== undefined
					? a.departure_timestamp
					: timeSecs(a.departure_time || '00:00:00')) +
				(a.departure_delay || 0) -
				((b.departure_timestamp !== undefined
					? b.departure_timestamp
					: timeSecs(b.departure_time || '00:00:00')) +
					(b.departure_delay || 0))
		);

		return { stopTimes, trips, stops, routes, runGurus, expressInfos };
	}
}

import tGTFS from './gtfs';
import * as gtfs from 'gtfs';
import { getServiceDates } from './utils/calendar';
import runGuru from './runGuru';
import findExpress, { type PathResult } from './utils/express';

let trips: gtfs.Trip[];
let stopTimes: gtfs.StopTime[];

async function loadData() {
	if (trips != undefined && stopTimes != undefined) return;
	await tGTFS.loadGTFS();
	trips = tGTFS.getTrips();
	stopTimes = tGTFS.getStopTimes();
}

export async function getRunDates(run: string) {
	await loadData();

	let myTrips = trips.filter((v) => v.trip_id.endsWith(run));

	let calendars: gtfs.Calendar[] = [];
	let calendarDates: gtfs.CalendarDate[] = [];

	for (const { service_id } of myTrips) {
		calendars = calendars.concat(gtfs.getCalendars({ service_id }));
		calendarDates = calendarDates.concat(gtfs.getCalendarDates({ service_id }));
	}

	let serviceDates = getServiceDates(calendars, calendarDates);
	let myMap: { [key: string]: number[] } = {};

	for (const trip of myTrips) myMap[trip.trip_id] = serviceDates[trip.service_id];

	return myMap;
}

export async function getRunsByDay(run: string, dateNum: number) {
	// The types in this function are kinda cooked. Just don't change it and it'll work
	await loadData();

	let myTrips = [
		...new Set(
			trips
				.filter((v) => new RegExp(run, 'i').test(v.trip_id.slice(-4)))
				.map((v) => v.trip_id.slice(-4))
		)
	].map((v) => getRunDates(v));

	// @ts-ignore
	for (let i = 0; i < myTrips.length; i++) myTrips[i] = await myTrips[i];

	myTrips = myTrips.filter((v) =>
		Object.keys(v)
			// @ts-ignore
			.map((k) => v[k].includes(dateNum))
			.includes(true)
	);

	let mp: {
		[run: string]: {
			trip: gtfs.Trip;
			stopTimes: gtfs.StopTime[];
			route: gtfs.Route;
			runGuru: string;
			expressInfo: string;
		};
	} = {};

	let stops: { [stop_id: string]: gtfs.Stop } = {};

	for (const v of myTrips) {
		let trip_id = Object.keys(v)
			// @ts-ignore
			.find((k) => v[k].includes(dateNum));
		let trip = gtfs.getTrips({ trip_id })[0];

		let stopTimes = gtfs
			.getStoptimes({ trip_id })
			.sort((a, b) => a.stop_sequence - b.stop_sequence);

		for (const st of stopTimes) {
			if (st.stop_id != undefined && stops[st.stop_id] == undefined)
				stops[st.stop_id] = gtfs.getStops({ stop_id: st.stop_id })[0];

			if (
				stops[st.stop_id || ''].parent_station != undefined &&
				stops[stops[st.stop_id || ''].parent_station || ''] == undefined
			)
				stops[stops[st.stop_id || ''].parent_station || ''] = gtfs.getStops({
					stop_id: stops[st.stop_id || ''].parent_station
				})[0];
		}

		let stopParentIds: string[] = stopTimes.map((v) => stops[v.stop_id || ''].parent_station || '');
		let expressData = findExpress(stopParentIds).filter((v) => v.type !== 'local');

		// Ew. Gross. BTW the function wrapper is so that you can collapse it
		let expressInfo =
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
								return run.stoppingAt.length > 0
									? `Running express between ${startName} and ${endName}, stopping only at ${formattedStoppingAtNames}`
									: `Running express between ${startName} and ${endName}`;
							})
							.join('; '))()
				: 'All stops';

		mp[(trip_id || '0000').slice(-4)] = {
			trip,
			stopTimes,
			route: gtfs.getRoutes({ route_id: trip.route_id })[0],
			runGuru: runGuru((trip_id || '0000').slice(-4)),
			expressInfo
		};
	}

	return {
		runs: myTrips.map((v) => Object.keys(v)[0].slice(-4)).sort() as any as number[],
		data: mp,
		stops
	};
}

export async function getRuns(run: string): Promise<{ [key: string]: number[] }> {
	// The types in this function are kinda cooked. Just don't change it and it'll work
	await loadData();

	let myTrips = [
		...new Set(
			trips
				.filter((v) => new RegExp(run, 'i').test(v.trip_id.slice(-4)))
				.map((v) => v.trip_id.slice(-4))
		)
	].map((v) => getRunDates(v)) as any as { [key: string]: number[] }[];

	// @ts-ignore
	for (let i = 0; i < myTrips.length; i++) myTrips[i] = await myTrips[i];

	let retTrips: { [key: string]: number[] } = {};
	for (const mtrip of myTrips) {
		for (const trip of Object.keys(mtrip)) {
			if (retTrips[trip.slice(-4)] == undefined) retTrips[trip.slice(-4)] = [];
			retTrips[trip.slice(-4)] = retTrips[trip.slice(-4)].concat(mtrip[trip]).sort();
		}
	}

	return retTrips;
}

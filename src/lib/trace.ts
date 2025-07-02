import tGTFS from './gtfs';
import * as gtfs from 'gtfs';
import { getRunDates } from './run';

let today = Number.parseInt(
	new Date(Date.now() + 60 * 60 * 10 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
);

setInterval(
	() => {
		today = Number.parseInt(
			new Date(Date.now() + 60 * 60 * 10 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
		);
	},
	5 * 60 * 1000
);

let tripIdsMap: Map<string, boolean>;

type TraceResult =
	| {
			type: 'run';
			data: {
				diff: string;
				from: string;
				from_parent_id: string;
				fromTime: string;
				run: string;
				to: string;
				to_parent_id: string;
				toTime: string;
				trip_id: string;
			};
			message: string;
			info?: undefined;
	  }
	| { type: string; message: string; info: string }
	| {
			type: string;
			info: 'DR';
			data: {
				nextRunId: string;
			};
			message: string;
	  };

export async function traceLoadData() {
	if (!tripIdsMap) {
		await tGTFS.loadGTFS();
		const trips: gtfs.Trip[] = tGTFS.getTrips();
		const tripIds: string[] = trips.map((v) => v.trip_id);
		tripIdsMap = new Map(tripIds.map((id) => [id, true]));
	}
}

function calculateTime(timeStr: string, durationStr: string, operation: string = '+'): string {
	const toSeconds = (t: string): number => {
		const [h = 0, m = 0, s = 0] = t.split(':').map(Number);
		return h * 3600 + m * 60 + s;
	};

	let result: number =
		operation === '+'
			? toSeconds(timeStr) + toSeconds(durationStr)
			: toSeconds(timeStr) - toSeconds(durationStr);

	if (result < 0) result += 86400;
	if (result > 172800) result %= 172800;

	const h = Math.floor(result / 3600);
	const m = Math.floor((result % 3600) / 60);
	const s = result % 60;
	const pad = (n: number): string => String(n).padStart(2, '0');
	return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function getFirstStop(trip_id: string, date: number) {
	const firstStop = gtfs
		.getStoptimes({ trip_id, date })
		.sort((a, b) => a.stop_sequence - b.stop_sequence)[0];

	let stopTimeUpdate =
		date === today
			? gtfs.getStopTimeUpdates({
					trip_id: firstStop?.trip_id,
					stop_sequence: firstStop?.stop_sequence
				})[0] || {
					departure_delay: 0,
					arrival_delay: 0,
					stop_id: firstStop?.stop_id ? firstStop.stop_id : ''
				}
			: {
					departure_delay: 0,
					arrival_delay: 0,
					stop_id: firstStop?.stop_id ? firstStop.stop_id : ''
				};

	if (
		gtfs.getStops({ stop_id: stopTimeUpdate.stop_id }).length == 0 ||
		gtfs.getStops({
			stop_id: gtfs.getStops({ stop_id: stopTimeUpdate.stop_id })[0].parent_station || ''
		}).length == 0
	)
		stopTimeUpdate.stop_id = firstStop?.stop_id ? firstStop.stop_id : '';

	let h = Math.floor((stopTimeUpdate.departure_delay || stopTimeUpdate.arrival_delay || 0) / 3600);
	let m =
		Math.floor((stopTimeUpdate.departure_delay || stopTimeUpdate.arrival_delay || 0) / 60) % 60;
	let s = (stopTimeUpdate.departure_delay || stopTimeUpdate.arrival_delay || 0) % 60;

	let pad = (n: number): string => String(n).padStart(2, '0');

	return firstStop
		? {
				stop_id: stopTimeUpdate.stop_id || (firstStop?.stop_id ? firstStop.stop_id : ''),
				departure_time: firstStop?.departure_time
					? calculateTime(firstStop.departure_time, `${pad(h)}:${pad(m)}:${pad(s)}`)
					: ''
			}
		: null;
}

function getLastStop(trip_id: string, date: number) {
	const runStops = gtfs
		.getStoptimes({ trip_id, date })
		.sort((a, b) => a.stop_sequence - b.stop_sequence);

	const lastStop = runStops.at(-1);

	let stopTimeUpdate =
		date == today
			? gtfs.getStopTimeUpdates({
					trip_id: lastStop?.trip_id,
					stop_sequence: lastStop?.stop_sequence
				})[0] || { departure_delay: 0, stop_id: lastStop?.stop_id ? lastStop.stop_id : '' }
			: {
					departure_delay: 0,
					arrival_delay: 0,
					stop_id: lastStop?.stop_id ? lastStop.stop_id : ''
				};
	if (
		gtfs.getStops({ stop_id: stopTimeUpdate.stop_id }).length == 0 ||
		gtfs.getStops({
			stop_id: gtfs.getStops({ stop_id: stopTimeUpdate.stop_id })[0].parent_station || ''
		}).length == 0
	)
		stopTimeUpdate.stop_id = lastStop?.stop_id ? lastStop.stop_id : '';

	let h = Math.floor((stopTimeUpdate.departure_delay || stopTimeUpdate.arrival_delay || 0) / 3600);
	let m =
		Math.floor((stopTimeUpdate.departure_delay || stopTimeUpdate.arrival_delay || 0) / 60) % 60;
	let s = (stopTimeUpdate.departure_delay || stopTimeUpdate.arrival_delay || 0) % 60;

	let pad = (n: number): string => String(n).padStart(2, '0');

	return lastStop
		? {
				stop_id: stopTimeUpdate.stop_id || (lastStop?.stop_id ? lastStop.stop_id : ''),
				departure_time: lastStop?.departure_time
					? calculateTime(lastStop.departure_time, `${pad(h)}:${pad(m)}:${pad(s)}`)
					: ''
			}
		: null;
}

function getCleanStationName(stopId: string): string {
	const stop = gtfs.getStops({ stop_id: stopId })[0];
	return (
		stop?.parent_station
			?.replace(/^place_/, '')
			.replace(/sta$/, '')
			.replace(/stn$/, '') + (stop?.platform_code || '') || 'Unknown'
	);
}

export async function* reverseTraceTrack(
	initialRun: string,
	dateNumber: number
): AsyncGenerator<TraceResult> {
	let run: string = initialRun.toUpperCase();
	let prevFirstStopId: string = '';
	let prevTime: string = '';

	while (true) {
		let runDates = await getRunDates(run);
		let id = Object.keys(runDates).filter((v) => runDates[v].includes(dateNumber))[0];
		if (!id) {
			// Run does not happen on that date or does not exist
			yield { type: 'status', info: 'RDPNF', message: 'RDPNF. Goodbye.' };
			return;
		}

		const first = getFirstStop(id, dateNumber);

		const last = getLastStop(id, dateNumber);

		if (!first || !last) {
			// Error - IDK what happened
			yield { type: 'status', info: 'ERR', message: 'ERR. Goodbye.' };
			return;
		}

		if (prevFirstStopId && last.stop_id !== prevFirstStopId) {
			// Continuing service - The previous service arriving at the platform is a continuing service
			yield { type: 'status', info: 'CS', message: 'CS. Goodbye.' };
			return;
		}

		const startStation = getCleanStationName(first.stop_id);
		const endStation = getCleanStationName(last.stop_id);

		yield {
			type: 'run',
			data: {
				diff: prevTime
					? `(-${calculateTime(prevTime, last.departure_time, '-').slice(0, -3)})`
					: '(-00:00)',
				from: startStation,
				from_parent_id: gtfs.getStops({ stop_id: first.stop_id })[0]?.parent_station || '',
				fromTime: first.departure_time.slice(0, -3),
				run,
				to: endStation,
				to_parent_id: gtfs.getStops({ stop_id: last.stop_id })[0]?.parent_station || '',
				toTime: last.departure_time.slice(0, -3),
				trip_id: id
			},
			message: `${
				prevTime
					? `(-${calculateTime(prevTime, last.departure_time, '-').slice(0, -3)})`
					: '(-00:00)'
			} ${startStation}T${first.departure_time.slice(
				0,
				-3
			)} ${run} ${endStation}T${last.departure_time.slice(0, -3)}`
		};

		prevTime = first.departure_time;

		prevFirstStopId = first.stop_id;

		const prevTrip = gtfs
			.getStoptimes({
				date: dateNumber,
				stop_id: first.stop_id,
				start_time: calculateTime(first.departure_time, '00:30:00', '-'),
				end_time: first.departure_time
			})
			.filter(
				(st: gtfs.StopTime) =>
					tripIdsMap.has(st.trip_id) &&
					!st.trip_id.endsWith(run) &&
					st.arrival_timestamp !== undefined
			)
			.sort(
				(b, a) =>
					(a?.arrival_timestamp ? a.arrival_timestamp : 0) -
					(b?.arrival_timestamp ? b.arrival_timestamp : 0)
			)
			.at(0);

		if (!prevTrip) {
			// No train found within 30 minutes of the arrival time at the first stop
			yield { type: 'status', info: 'NT', message: 'NT. Goodbye.' };
			return;
		}

		const nextRunId = prevTrip.trip_id.slice(-4);

		if (nextRunId[0] !== run[0]) {
			// Different vehicle ID, therefore cannot be the same train
			yield { type: 'status', info: 'DR', data: { nextRunId }, message: `DR ${nextRunId}` };
			return;
		}

		run = nextRunId;
	}
}

export async function getTrack(initialRun: string, dateNumber: number): Promise<string | null> {
	let run: string | null = null;
	for await (const res of reverseTraceTrack(initialRun, dateNumber)) {
		if (res.type == 'run') {
			// @ts-ignore
			run = res.data.run;
		}
	}
	return run;
}

export async function* traceTrack(
	initialRun: string,
	dateNumber: number
): AsyncGenerator<TraceResult> {
	let run: string = initialRun.toUpperCase();
	let prevLastStopId: string = '';
	let prevTime: string = '';

	while (true) {
		let runDates = await getRunDates(run);
		let id = Object.keys(runDates).filter((v) => runDates[v].includes(dateNumber))[0];
		if (!id) {
			yield { type: 'status', info: 'RDPNF', message: 'RDPNF. Goodbye.' };
			return;
		}

		const first = getFirstStop(id, dateNumber);
		const last = getLastStop(id, dateNumber);

		if (!first || !last) {
			yield { type: 'status', info: 'ERR', message: 'ERR. Goodbye.' };
			return;
		}

		if (prevLastStopId && first.stop_id !== prevLastStopId) {
			yield { type: 'status', info: 'CS', message: 'CS. Goodbye.' };
			return;
		}

		const startStation = getCleanStationName(first.stop_id);
		const endStation = getCleanStationName(last.stop_id);

		yield {
			type: 'run',
			data: {
				diff: prevTime
					? `(+${calculateTime(first.departure_time, prevTime, '-').slice(0, -3)})`
					: '(+00:00)',
				from: startStation,
				from_parent_id: gtfs.getStops({ stop_id: first.stop_id })[0]?.parent_station || '',
				fromTime: first.departure_time.slice(0, -3),
				run,
				to: endStation,
				to_parent_id: gtfs.getStops({ stop_id: last.stop_id })[0]?.parent_station || '',
				toTime: last.departure_time.slice(0, -3),
				trip_id: id
			},
			message: `${
				prevTime
					? `(+${calculateTime(first.departure_time, prevTime, '-').slice(0, -3)})`
					: '(+00:00)'
			} ${startStation}T${first.departure_time.slice(
				0,
				-3
			)} ${run} ${endStation}T${last.departure_time.slice(0, -3)}`
		};

		prevTime = last.departure_time;
		prevLastStopId = last.stop_id;

		const nextTrip = gtfs
			.getStoptimes({
				date: dateNumber,
				stop_id: last.stop_id,
				start_time: last.departure_time,
				end_time: calculateTime(last.departure_time, '00:30:00')
			})
			.filter(
				(st: gtfs.StopTime) =>
					tripIdsMap.has(st.trip_id) &&
					!st.trip_id.endsWith(run) &&
					st.arrival_timestamp !== undefined
			)
			.sort(
				(a, b) =>
					(a?.arrival_timestamp ? a.arrival_timestamp : 0) -
					(b?.arrival_timestamp ? b.arrival_timestamp : 0)
			)
			.at(0);

		if (!nextTrip) {
			yield { type: 'status', info: 'NT', message: 'NT. Goodbye.' };
			return;
		}

		const nextRunId = nextTrip.trip_id.slice(-4);

		if (nextRunId[0] !== run[0]) {
			yield { type: 'status', info: 'DR', data: { nextRunId }, message: `DR ${nextRunId}` };
			return;
		}

		run = nextRunId;
	}
}

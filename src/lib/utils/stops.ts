import * as gtfs from 'gtfs';
import { findExpress } from './express';
import { getSRT } from './srt';
import { loadGTFS } from '$lib/gtfs';

export function findPassingStops(stops: string[]): { stop_id: string; passing: boolean }[] {
	let express = findExpress(stops);
	let allStops: { stop_id: string; passing: boolean }[] = [];

	for (const e of express) {
		if (e.type == 'unknown_segment') {
			console.error(`Unknown segment between ${e.from} and ${e.to}: ${e.message}`);
			continue;
		}
		if (e.type == 'local') {
			if (allStops.at(-1)?.stop_id != e.from) allStops.push({ stop_id: e.from, passing: false });
			for (let i = stops.findIndex((v) => v == e.from) + 1; i <= stops.length; i++) {
				if (stops[i] == e.to) break;
				allStops.push({ stop_id: stops[i], passing: false });
			}
			continue;
		}
		if (allStops.at(-1)?.stop_id != e.from) allStops.push({ stop_id: e.from, passing: false });
		allStops.push(...(e.skipping?.map((v) => ({ stop_id: v, passing: true })) || []));
		if (allStops.at(-1)?.stop_id != e.to) allStops.push({ stop_id: e.to, passing: false });
	}
	return allStops;
}

export type PassingStopSRT = {
	from: string;
	to: string;
	emu: number;
	passing: boolean;
};

export type AugmentedStopTime = gtfs.StopTime & {
	_passing: boolean;
};

export async function findPassingStopSRTs(stops: string[]): Promise<PassingStopSRT[]> {
	let allStops = findPassingStops(stops);

	let allStopSRTs: PassingStopSRT[] = [];
	for (let i = 0; i < allStops.length - 1; i++) {
		let srt = await getSRT(allStops[i].stop_id, allStops[i + 1].stop_id);
		if (srt === undefined) {
			console.error('No SRT found between', allStops[i], 'and', allStops[i + 1]);
			continue;
		}
		allStopSRTs.push({
			from: allStops[i].stop_id,
			to: allStops[i + 1].stop_id,
			emu: srt,
			passing: allStops[i + 1].passing
		});
	}

	return allStopSRTs;
}

export async function findPassingStopTimes(
	stopTimes: gtfs.StopTime[]
): Promise<AugmentedStopTime[]> {
	await loadGTFS();
	let stops = stopTimes
		.sort((a, b) => a.stop_sequence - b.stop_sequence)
		.map((st) => gtfs.getStops({ stop_id: st.stop_id })[0]?.parent_station)
		.filter((v) => v != undefined);
	let idsToTimes: Record<string, gtfs.StopTime> = {};
	for (let st of stopTimes) {
		let parent = gtfs.getStops({ stop_id: st.stop_id })[0]?.parent_station;
		if (!parent) continue;
		if (!idsToTimes[parent]) idsToTimes[parent] = st;
	}

	let passingSRTs = await findPassingStopSRTs(stops);
	let passingRun: PassingStopSRT[] = [];
	let times: AugmentedStopTime[] = [{ ...idsToTimes[passingSRTs[0].from], _passing: false }];

	for (let srt of passingSRTs) {
		if (srt.passing) {
			passingRun.push(srt);
			continue;
		}

		if (passingRun.length == 0) {
			times.push({ ...idsToTimes[srt.to], _passing: false });
			continue;
		}

		let startTime = times.at(-1);
		let endTime = idsToTimes[srt.to];

		if (!startTime) {
			console.error('ERROR: Start time should not be undefined', startTime, srt);
			continue;
		}
		if (!endTime) {
			console.error('ERROR: End time should not be undefined', endTime, srt.to, srt);
			continue;
		}
		if (!startTime.departure_timestamp)
			console.error('ERROR: Start time should not be undefined', startTime, srt);
		if (!endTime.departure_timestamp)
			console.error('ERROR: End time should not be undefined', endTime, srt);
		if (!startTime.departure_timestamp || !endTime.departure_timestamp) continue;

		let timeDifference = Math.floor(
			(endTime.departure_timestamp - startTime.departure_timestamp) / 60
		);
		let totalTimePass = passingRun.reduce((acc, curr) => acc + curr.emu, 0);
		let rescaledAccumulatedPassingRuns = passingRun.map((v) => ({
			...v,
			emu: Math.floor((v.emu / totalTimePass) * timeDifference)
		})).reduce((acc, curr) => {
			if (acc.length === 0) {
				acc.push(curr);
			} else {
				let last = acc[acc.length - 1];
				acc.push({
					...curr,
					emu: last.emu + curr.emu
				});
			}
			return acc;
		}, [] as PassingStopSRT[]);

		for (let i = 0; i < rescaledAccumulatedPassingRuns.length; i++) {
			let run = rescaledAccumulatedPassingRuns[i];
			if (run.emu <= 0) continue;
			times.push({
				_passing: true,
				stop_id: run.to,
				trip_id: stopTimes[0].trip_id,
				stop_sequence: stopTimes[0].stop_sequence + i / rescaledAccumulatedPassingRuns.length,
				departure_timestamp: startTime.departure_timestamp + run.emu * 60,
				arrival_timestamp:
					(startTime.arrival_timestamp || startTime.departure_timestamp) + run.emu * 60
			});
		}

		times.push({ ...endTime, _passing: false });

		passingRun = [];
	}

	return times;
}

import tGTFS from './gtfs';
import * as gtfs from 'gtfs';
import { timeSecs } from './utils/time';
import { findExpressString } from './utils/express';
import runGuru from './runGuru';

let trips: gtfs.Trip[];
let stopTimes: gtfs.StopTime[];
// https://gtfsrt.api.translink.com.au/GTFS/QR_GTFS.zip
// cabsta -> cabstn
// rbksta -> redsta
// cmrsta -> cmrstn
// exhsta -> nothing, cuz exhibition doesn't exist
// slysta -> nothing, apparently salisbury doesn't exist
// tensta -> nothing, tennyson doesn't exist
let qr_stations: string[] = JSON.parse(
	'["place_ascsta","place_aldsta","place_aucsta","place_albsta","place_altsta","place_birsta","place_balsta","place_domsta","place_bunsta","place_bbrsta","place_binsta","place_bowsta","place_intsta","place_censta","place_beesta","place_bvlsta","place_brasta","place_bursta","place_bansta","place_baysta","place_forsta","place_brdsta","place_betsta","place_bwrsta","place_bdlsta","place_cabstn","place_cassta","place_cppsta","place_chesta","place_cansta","place_crysta","place_crnsta","place_corsta","place_coosta","place_clesta","place_cmrstn","place_clasta","place_darsta","place_dbnsta","place_deasta","place_dinsta","place_daksta","place_dupsta","place_ebbsta","place_edesta","place_enosta","place_egjsta","place_eassta","place_elmsta","place_eudsta","place_eumsta","place_exhsta","place_faista","place_frusta","place_fersta","place_gaista","place_gaysta","place_goosta","place_geesta","place_grosta","place_gmtsta","place_grasta","place_gymsta","place_hensta","place_helsta","place_hemsta","place_holsta","place_indsta","place_ipssta","place_kepsta","place_kalsta","place_kgtsta","place_kprsta","place_karsta","place_kursta","place_linsta","place_logsta","place_lotsta","place_lansta","place_lawsta","place_mhesta","place_mahsta","place_mgssta","place_mitsta","place_mursta","place_mansta","place_molsta","place_moosta","place_mudsta","place_milsta","place_myesta","place_nobsta","place_namsta","place_nunsta","place_npksta","place_narsta","place_nrgsta","place_norsta","place_nudsta","place_newsta","place_omesta","place_ormsta","place_oxlsta","place_oxfsta","place_palsta","place_petsta","place_parsta","place_pomsta","place_redsta","place_ricsta","place_rocsta","place_rbnsta","place_romsta","place_rossta","place_runsta","place_rivsta","place_rotsta","place_sbasta","place_sousta","place_spcsta","place_sprsta","place_sgtsta","place_shnsta","place_shesta","place_slysta","place_strsta","place_snssta","place_sunsta","place_thasta","place_tomsta","place_trista","place_thmsta","place_tarsta","place_thosta","place_tensta","place_trvsta","place_twgsta","place_virsta","place_varsta","place_wacsta","place_winsta","place_wilsta","place_wynsta","place_wnmsta","place_wbysta","place_wdrsta","place_walsta","place_welsta","place_wulsta","place_wolsta","place_wyhsta","place_yansta","place_yeesta","place_yersta","place_zllsta"]'
);

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
	return qr_stations.map((v) => gtfs.getStops({ stop_id: v })[0]).filter((v) => v);
}

export async function getDepartures(
	stop_id: string,
	date: number,
	start_time: string,
	end_time: string
) {
	let today = Number.parseInt(
		new Date(Date.now() + 60 * 60 * 10 * 1000).toISOString().slice(0, 10).replace(/-/g, '')
	);

	const children = gtfs.getStops({ parent_station: stop_id }).map((v) => v.stop_id);
	let stopTimes: gtfs.StopTime[] = gtfs.getStoptimes({ stop_id, date });
	for (const c of children) stopTimes = stopTimes.concat(gtfs.getStoptimes({ stop_id: c, date }));

	stopTimes = stopTimes
		.filter((v) => v.trip_id.includes('-QR '))
		.filter((v) => {
			let update = gtfs
				.getStopTimeUpdates({ trip_id: v.trip_id })
				.filter((v) => children.includes(v.stop_id || '') || v.stop_id == stop_id)[0];
			let t = timeSecs(v.departure_time || '00:00:00') || 0;
			t =
				(date == today && update
					? update.departure_timestamp
						? timeSecs(
								new Date(update.departure_timestamp * 1000 + 10 * 3600_000)
									.toISOString()
									.slice(11, 19)
							)
						: t
					: t) || t;
			return t >= (timeSecs(start_time) || 0) && t <= (timeSecs(end_time) || 0);
		})
		.sort((a, b) => (a.arrival_timestamp || 0) - (b.arrival_timestamp || 0));

	const tripIds = [...new Set(stopTimes.map((v) => v.trip_id))];
	const trips: { [trip_id: string]: gtfs.Trip } = {};
	for (const id of tripIds) trips[id] = gtfs.getTrips({ trip_id: id })[0];

	const routeIds = [...new Set(Object.keys(trips).map((v) => trips[v].route_id))];
	const routes: { [route_id: string]: gtfs.Route } = {};
	for (const id of routeIds) routes[id] = gtfs.getRoutes({ route_id: id })[0];

	const _stopTimeUpdates = gtfs
		.getStopTimeUpdates()
		.filter((v) => v.stop_id == stop_id || children.includes(v.stop_id || ''))
		.filter((v) => tripIds.includes(v.trip_id || ''));
	const stopTimeUpdates: { [trip_id: string]: gtfs.StopTimeUpdate } = {};
	for (const update of _stopTimeUpdates) {
		if (!update.trip_id) continue;
		stopTimeUpdates[update.trip_id] = update;
	}

	for (const trip_id of tripIds) {
		if (stopTimeUpdates[trip_id]) continue;
		const stopTime = stopTimes.find((v) => v.trip_id === trip_id);
		const sequence = stopTime?.stop_sequence || 0;

		let updates = gtfs.getStopTimeUpdates({ trip_id });

		updates = updates.filter((v) => (v.stop_sequence || Number.POSITIVE_INFINITY) < sequence);
		updates = updates.sort(
			(a, b) =>
				(a.stop_sequence || Number.POSITIVE_INFINITY) -
				(b.stop_sequence || Number.POSITIVE_INFINITY)
		);
		if (updates.at(-1) == undefined) continue;
		stopTimeUpdates[trip_id] = updates.at(-1) as gtfs.StopTimeUpdate;
		stopTimeUpdates[trip_id].stop_id = undefined;
		if (stopTime?.departure_timestamp && stopTimeUpdates[trip_id].departure_delay)
			stopTimeUpdates[trip_id].departure_timestamp =
				stopTime?.departure_timestamp + stopTimeUpdates[trip_id].departure_delay;
		else stopTimeUpdates[trip_id].departure_timestamp = stopTime?.departure_timestamp;
	}

	const stopIds: string[] = [
		...new Set(
			stopTimes
				.map((v) => v.stop_id || '')
				.concat(_stopTimeUpdates.map((v) => v.stop_id || ''))
				.filter((v) => v != '')
		)
	];
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

	return { stopTimes, trips, stops, routes, runGurus, expressInfos, stopTimeUpdates };
}

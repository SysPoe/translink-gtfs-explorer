import * as gtfs from 'gtfs';
import fs from 'fs';

let config = {
	agencies: [
		{
			url: 'https://gtfsrt.api.translink.com.au/GTFS/SEQ_GTFS.zip',
			realtimeAlerts: {
				url: 'https://gtfsrt.api.translink.com.au/api/realtime/SEQ/alerts'
			},
			realtimeTripUpdates: {
				url: 'https://gtfsrt.api.translink.com.au/api/realtime/SEQ/TripUpdates'
			},
			realtimeVehiclePositions: {
				url: 'https://gtfsrt.api.translink.com.au/api/realtime/SEQ/VehiclePositions'
			}
		}
	],
	sqlitePath: './db.sqlite',
	// verbose: false,
	db: undefined
};

let loaded = false;

if (!fs.existsSync('./lastSynced')) fs.writeFileSync('./lastSynced', '1980-01-01');

let doSync =
	(Date.now() - new Date(fs.readFileSync('./lastSynced').toString()).getTime()) /
		1000 /
		60 /
		60 /
		24 >
	1;

if (doSync) {
	fs.writeFileSync('./lastSynced', new Date().toISOString().split('T')[0]);
	fs.rmSync('./db.sqlite');
}

if (fs.existsSync('./db.sqlite')) {
	const db = gtfs.openDb({
		sqlitePath: './db.sqlite'
	});
	config.db = db;
}

export async function loadGTFS(bypass = false) {
	if (loaded && !bypass) return;
	loaded = true;
	if (doSync) {
		console.log('doSync', doSync);
		await gtfs.importGtfs(config);
	}
	await gtfs.updateGtfsRealtime(config);
	setInterval(updateRealtime, 60 * 1000)
	if (gtfs.getStops().length == 0) await gtfs.importGtfs(config);
}

export async function updateRealtime() {
	await gtfs.updateGtfsRealtime(config);
}

let trips: gtfs.Trip[];
let stopTimes: gtfs.StopTime[];

export function getTrips(): gtfs.Trip[] {
	if (trips == undefined) trips = gtfs.getTrips().filter((v) => v.service_id.startsWith('QR'));
	return trips;
}

export function getStopTimes(): gtfs.StopTime[] {
	if (trips == undefined) getTrips();
	if (stopTimes == undefined) {
		stopTimes = [];
		trips.forEach((v) => {
			stopTimes = stopTimes.concat(gtfs.getStoptimes({ trip_id: v.trip_id }));
		});
	}

	return stopTimes;
}

export default {
	loadGTFS,
	updateRealtime,
	getTrips,
	getStopTimes
};

import * as gtfs from 'gtfs';
import fs from 'fs';
import cron from 'node-cron';
import { DateTime } from 'luxon';

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

// Detect system timezone
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('Detected system timezone:', tz);

// Calculate the local time (system timezone) that matches 3am UTC+10
function getLocalHourForUTCPlus10(hour = 3) {
	// 3am UTC+10 in UTC
	const utcPlus10 = DateTime.utc().set({ hour: hour, minute: 0, second: 0, millisecond: 0 });
	// Shift to UTC+10
	const utcTime = utcPlus10.minus({ hours: 10 });
	// Convert to system timezone
	const localTime = utcTime.setZone(tz);
	return localTime.hour;
}

const localHour = getLocalHourForUTCPlus10(3);
console.log(`Scheduling GTFS refresh at local hour ${localHour} to match 3am UTC+10`);

// Schedule at calculated local hour
cron.schedule(`0 ${localHour} * * *`, async () => {
	console.log('Scheduled GTFS refresh to match 3am UTC+10');
	loaded = false;
	await loadGTFS(true);
}, { timezone: tz });

loadGTFS();

export default {
	loadGTFS,
	updateRealtime,
	getTrips,
	getStopTimes
};

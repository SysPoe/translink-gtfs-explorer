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
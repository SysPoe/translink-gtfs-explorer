import { traceLoadData, traceTrack } from '$lib/trace';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	let trackInfo = [];

	await traceLoadData();

	for await (const res of traceTrack(params.track, Number.parseInt(params.date))) {
		trackInfo.push(res);
	}
	return { date: params.date, track: params.track, trackInfo };
};

export let guruData: {
	first: { [key: string]: string };
	second: { [key: string]: string };
} = {
	first: {
		'1': '6 car SMU or IMU',
		D: 'NGR',
		J: '3-car SMU or IMU',
		T: '6-car IMU or SMU',
		U: '3-car IMU or SMU',
		X: 'Train equipped w/ level 2 ETCS'
		// '1': '6 car SMU',
		// J: '3-car SMU',
		// T: '6-car IMU',
		// U: '3-car IMU',
		// X: 'ICE or ICE/EMU in revenue service (any length)'
	},
	second: {
		'0': 'Bowen Hills/Mayne Area',
		'1': 'Caboolture',
		'4': 'Gympie North',
		'5': 'between Darra and Grandchester (except Rosewood services)',
		'6': 'Rosewood (even numbers)',
		'7': 'Beenleigh line',
		'8': 'Cleveland',
		'9': 'Roma Street',
		A: 'Shorncliffe line',
		B: 'Pinkenba line',
		C: 'Corinda via South Brisbane OR From Corinda to Yeerongpilly',
		D: 'Darra via Toowong',
		E: 'Ferny Grove line',
		F: 'Various destinations as determined by Control',
		G: 'Beyond Beenleigh to Varsity Lakes',
		H: 'Cannon Hill or beyond towards Cleveland',
		K: 'Springfield',
		L: 'between Nambour and Yandina',
		M: 'from Cleveland to Bowen Hills',
		N: 'Exhibition via Brisbane Central',
		P: 'Airport Spur',
		R: 'from Shorncliffe to Roma Street',
		S: 'from Shorncliffe to South Bank/Yeerongpilly',
		V: 'Banoon',
		W: 'Zillmere Area',
		X: 'Exhibition Direct',
		Y: 'Kippa Ring / Petrie',
		Z: 'Exhibition'
	}
};

export default function runGuru(trainNumber: string, includeDestination: boolean = true): string {
	if (trainNumber.length !== 4) {
		return 'Invalid train number. It must be 4 characters long.';
	}
	trainNumber = trainNumber.toUpperCase();

	const firstChar = trainNumber[0];
	const secondChar = trainNumber[1];

	const first: string = guruData.first[firstChar];
	const second: string = guruData.second[secondChar];

	return includeDestination
		? `${first} heading ${second ? (second.includes(' to ') || /^(beyond|from|between)/.test(second) ? '' : 'to') : 'to'} ${second}.`
		: first;
}

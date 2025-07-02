let data: {
	first: { [key: string]: string };
	second: { [key: string]: string };
} = {
	first: {
		'1': '6 car SMU in revenue service',
		D: 'NGR (suburban)',
		J: '3-car SMU in revenue service',
		T: '6-car IMU in revenue service',
		U: '3-car IMU in revenue service',
		X: 'NGR w/ level 2 ETCS in revenue service'
		// X: 'ICE or ICE/EMU in revenue service (any length)'
	},
	second: {
		'0': 'Bowen Hills/Mayne Area',
		'1': 'Caboolture (Suburban)',
		'4': 'Gympie North',
		'5': 'beyond Darra to Grandchester (except Rosewood services)',
		'6': 'Rosewood (suburban only, even numbers)',
		'7': 'Beenleigh line (Suburban)',
		'8': 'Cleveland (Suburban)',
		'9': 'Roma Street',
		A: 'Shorncliffe line (Suburban)',
		B: 'Pinkenba line (Suburban)',
		C: 'Corinda via South Brisbane (Suburban) OR From Corinda to Yeerongpilly (Suburban)',
		D: 'Darra via Toowong (Suburban)',
		E: 'Ferny Grove line (Suburban)',
		F: 'Various destinations as determined by Control',
		G: 'Beyond Beenleigh to Robina (Suburban)',
		H: 'Cannon Hill or beyond towards Cleveland',
		K: 'Springfield',
		L: 'Yandina (Suburban)',
		M: 'from Cleveland to Bowen Hills (Suburban)',
		N: 'Exhibition via Brisbane Central (Suburban)',
		P: 'Airport Spur (Suburban)',
		R: 'from Shorncliffe to Roma Street (Suburban)',
		S: 'from Shorncliffe to South Bank/Yeerongpilly (Suburban)',
		V: 'Banoon (Suburban)',
		W: 'Zillmere Area',
		X: 'Exhibition Direct (Suburban)',
		Y: 'Kippa Ring / Petrie',
		Z: 'Exhibition (Suburban)'
	}
};

export default function runGuru(trainNumber: string) {
	if (trainNumber.length !== 4) {
		return 'Invalid train number. It must be 4 characters long.';
	}
	trainNumber = trainNumber.toUpperCase();

	const firstChar = trainNumber[0];
	const secondChar = trainNumber[1];

	const first: string = data.first[firstChar];
	const second: string = data.second[secondChar];

	return `${first} heading ${second ? (second.includes(' to ') ? '' : 'to') : 'to'} ${second}.`;
}

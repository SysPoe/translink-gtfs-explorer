export function timeSecs(timeStr: string) {
	const parts = timeStr.split(':');
	let hours, minutes, seconds;

	if (parts.length === 3) {
		hours = parseInt(parts[0], 10);
		minutes = parseInt(parts[1], 10);
		seconds = parseInt(parts[2], 10);
	} else if (parts.length === 2) {
		hours = parseInt(parts[0], 10);
		minutes = parseInt(parts[1], 10);
		seconds = 0; // Default seconds to 0 for HH:mm format
	} else {
		console.error(`Invalid time format: "${timeStr}". Expected HH:mm:ss or HH:mm.`);
		return null;
	}

	// Check for valid numbers and ranges (minutes and seconds should be 0-59)
	if (
		isNaN(hours) ||
		isNaN(minutes) ||
		isNaN(seconds) ||
		minutes < 0 ||
		minutes > 59 ||
		seconds < 0 ||
		seconds > 59 ||
		hours < 0
	) {
		// Hours can be > 23, but not negative
		console.error(`Invalid time value in "${timeStr}".`);
		return null;
	}

	return hours * 3600 + minutes * 60 + seconds;
}

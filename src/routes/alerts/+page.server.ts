
import * as gtfs from 'gtfs';
import { loadGTFS } from '$lib/gtfs';

export async function load() {
    await loadGTFS();
    const alerts = gtfs.getServiceAlerts().map(alert => {
        alert.description_text = alert.description_text.replace(/\n/g, '<br>');
        return alert;
    });
    return { alerts };
}

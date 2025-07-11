const combos: string[][] = [["place_gymsta","place_trvsta","place_crnsta","place_pomsta","place_crysta","place_eumsta","place_yansta","place_namsta"],["place_namsta","place_wbysta","place_palsta","place_eudsta","place_molsta","place_lansta","place_bwrsta","place_gmtsta","place_bbrsta","place_elmsta","place_cabstn"],["place_cabstn","place_myesta","place_bursta","place_narsta","place_daksta","place_petsta"],["place_petsta","place_kalsta","place_mudsta","place_mahsta","place_mhesta","place_rotsta","place_kprsta"],["place_petsta","place_lawsta","place_brasta","place_strsta","place_balsta","place_cassta","place_zllsta","place_geesta","place_snssta","place_virsta","place_norsta"],["place_norsta","place_binsta","place_baysta","place_nudsta","place_bdlsta","place_nobsta","place_deasta","place_sgtsta","place_shnsta"],["place_norsta","place_nunsta","place_tomsta","place_egjsta"],["place_egjsta","place_intsta","place_domsta"],["place_egjsta","place_clasta","place_hensta","place_ascsta","place_dbnsta"],["place_egjsta","place_wolsta","place_albsta","place_bowsta"],["place_fersta","place_kepsta","place_grosta","place_oxfsta","place_mitsta","place_gaysta","place_enosta","place_aldsta","place_newsta","place_wilsta","place_winsta","place_bowsta"],["place_bowsta","place_forsta","place_censta","place_romsta"],["place_romsta","place_exhsta","place_bowsta"],["place_romsta","place_sousta","place_sbasta","place_parsta"],["place_romsta","place_milsta","place_aucsta","place_twgsta","place_tarsta","place_indsta","place_chesta","place_grasta","place_shesta","place_corsta","place_oxlsta","place_darsta"],["place_parsta","place_brdsta","place_coosta","place_npksta","place_mgssta","place_cansta","place_mursta","place_hemsta","place_linsta","place_wyhsta","place_wnmsta","place_wynsta","place_mansta","place_lotsta","place_thosta","place_birsta","place_welsta","place_ormsta","place_clesta"],["place_parsta","place_dupsta","place_faista","place_yersta","place_yeesta","place_moosta","place_rocsta","place_cppsta","place_bansta","place_sunsta","place_altsta","place_runsta","place_frusta","place_kursta","place_trista","place_wdrsta","place_kgtsta","place_logsta","place_betsta","place_edesta","place_holsta","place_beesta"],["place_darsta","place_ricsta","place_sprsta","place_spcsta"],["place_darsta","place_wacsta","place_gaista","place_goosta","place_redsta","place_rivsta","place_dinsta","place_ebbsta","place_bunsta","place_bvlsta","place_eassta","place_ipssta","place_thmsta","place_wulsta","place_karsta","place_walsta","place_thasta","place_rossta"],["place_beesta","place_omesta","place_cmrstn","place_helsta","place_nrgsta","place_rbnsta","place_varsta"]];

interface GraphNode {
  to: string;
}

export interface PathResult {
  type: "express" | "local" | "unknown_segment";
  from: string;
  to: string;
  skipping?: string[];
  message?: string;
}

function buildTrainGraph(combosData: string[][]): Map<string, GraphNode[]> {
  const graph = new Map<string, GraphNode[]>();

  for (const combo of combosData) {
    for (let i = 0; i < combo.length; i++) {
      const currentStop = combo[i];
      if (!graph.has(currentStop)) {
        graph.set(currentStop, []);
      }

      if (i < combo.length - 1) {
        const nextStop = combo[i + 1];
        if (!graph.has(nextStop)) {
          graph.set(nextStop, []);
        }
        graph.get(currentStop)!.push({ to: nextStop });
      }

      if (i > 0) {
        const prevStop = combo[i - 1];
        if (!graph.has(prevStop)) {
          graph.set(prevStop, []);
        }
        graph.get(currentStop)!.push({ to: prevStop });
      }
    }
  }
  return graph;
}

function findPathBFS(graph: Map<string, GraphNode[]>, start: string, end: string): string[] | null {
  if (!graph.has(start) || !graph.has(end)) {
    return null;
  }
  if (start === end) {
    return [start];
  }

  const queue: { stop: string; path: string[] }[] = [{ stop: start, path: [start] }];
  const visited = new Set<string>();
  visited.add(start);

  while (queue.length > 0) {
    const { stop: currentStop, path: currentPath } = queue.shift()!;

    const neighbors = graph.get(currentStop);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.to)) {
          visited.add(neighbor.to);
          const newPath = [...currentPath, neighbor.to];

          if (neighbor.to === end) {
            return newPath;
          }
          queue.push({ stop: neighbor.to, path: newPath });
        }
      }
    }
  }
  return null;
}

export default function findExpress(givenStops: string[], combosData: string[][] = combos): PathResult[] {
  const graph = buildTrainGraph(combosData);
  const result: PathResult[] = [];

  for (let i = 0; i < givenStops.length - 1; i++) {
    const startStop = givenStops[i];
    const endStop = givenStops[i + 1];

    const actualPathBetween = findPathBFS(graph, startStop, endStop);

    if (actualPathBetween) {
      let foundDirectSegment = false;
      for (const combo of combosData) {
        const startIndex = combo.indexOf(startStop);
        const endIndex = combo.indexOf(endStop);

        if (startIndex !== -1 && endIndex !== -1) {
          let intermediateStops: string[] = [];
          if (startIndex < endIndex) {
            intermediateStops = combo.slice(startIndex + 1, endIndex);
          } else if (startIndex > endIndex) {
            intermediateStops = combo.slice(endIndex + 1, startIndex).reverse();
          }

          if (intermediateStops.length > 0) {
            result.push({
              type: "express",
              from: startStop,
              to: endStop,
              skipping: intermediateStops,
            });
          } else {
            result.push({
              type: "local",
              from: startStop,
              to: endStop,
            });
          }
          foundDirectSegment = true;
          break;
        }
      }

      if (!foundDirectSegment && actualPathBetween.length > 2) {
          const interchangeStops = actualPathBetween.slice(1, actualPathBetween.length - 1);
          result.push({
            type: "express",
            from: startStop,
            to: endStop,
            skipping: interchangeStops
          });
      } else if (!foundDirectSegment && actualPathBetween.length === 2) {
           result.push({
            type: "local",
            from: startStop,
            to: endStop
          });
      }

    } else {
      result.push({
        type: "unknown_segment",
        from: startStop,
        to: endStop,
        message: "No path found between these stops in the network."
      });
    }
  }
  return result;
}

/**
 * Returns a human-readable express info string for a sequence of stops.
 * @param tripStops Array of stop objects (must have stop_id and parent_station)
 * @param stops Lookup object for stop_id to stop details
 * @param stop_id The reference stop_id
 * @returns Express info string
 */
export function findExpressString(tripStops: any[], stops: Record<string, any>, stop_id: string): string {
	const expressData = findExpress(tripStops.map((v) => v.parent_station || v.stop_id)).filter(
		(v) => v.type !== 'local'
	);

	if (expressData.length === 0) return 'All stops';

	const segments = expressData.reduce(
		(acc, segment, index) => {
			if (index === 0 || segment.from !== acc[acc.length - 1].to) {
				acc.push({ from: segment.from, to: segment.to, stoppingAt: [] });
			} else {
				acc[acc.length - 1].stoppingAt.push(segment.from);
				acc[acc.length - 1].to = segment.to;
			}
			return acc;
		}, [] as { from: string; to: string; stoppingAt: string[] }[]
	);

	return segments
		.map((run) => {
			const startName = stops[run.from]?.stop_name?.replace(' station', '');
			const endName = stops[run.to]?.stop_name?.replace(' station', '');
			const stoppingAtNames = run.stoppingAt.map((stopId) => stops[stopId]?.stop_name?.replace(' station', ''));
			const formattedStoppingAtNames =
				stoppingAtNames.length <= 1
					? stoppingAtNames[0]
					: stoppingAtNames.length == 2
					? `${stoppingAtNames[0]} and ${stoppingAtNames[1]}`
					: `${stoppingAtNames.slice(0, -1).join(', ')}, and ${stoppingAtNames[stoppingAtNames.length - 1]}`;
			return run.from == stops[stop_id].parent_station || run.from == stop_id
				? run.stoppingAt.length > 0
					? `Running express to ${endName}, stopping only at ${formattedStoppingAtNames}`
					: `Running express to ${endName}`
				: run.stoppingAt.length > 0
					? `Running express between ${startName} and ${endName}, stopping only at ${formattedStoppingAtNames}`
					: `Running express between ${startName} and ${endName}`;
		})
		.join('; ');
}
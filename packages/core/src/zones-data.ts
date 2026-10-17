/**
 * Regulatory and advisory sea zones the routing API checks a route against.
 *
 * IMPORTANT: these are SIMPLIFIED polygons (lon/lat, planar edges, no antimeridian crossing),
 * accurate to roughly 20 to 50 km and drawn generously over land where that is harmless. They are
 * good for "how much of this voyage is inside an ECA" estimates, not for compliance decisions.
 * The authoritative boundaries are MARPOL Annex VI (regulation 14, Appendix VII) and, for
 * piracy, the BMP and the current industry circulars. See data/zones/README.md.
 */

export type ZoneKind = 'eca' | 'piracy';

export interface Zone {
  id: string;
  kind: ZoneKind;
  name: string;
  /** What the zone means for a voyage. */
  summary: string;
  /** ECA: `in_force` once the rules apply; piracy zones are always `advisory`. */
  status: 'in_force' | 'advisory';
  /** First day the rules apply (ECA only), ISO date. Routes are checked "as of" a date. */
  effectiveFrom?: string;
  /** Ring of [lon, lat] points; the last point joins back to the first. */
  ring: [number, number][];
  /** All current polygons are approximate; the field is there so exact ones can say otherwise. */
  approximate: boolean;
  source: string;
}

const MARPOL = 'IMO MARPOL Annex VI, regulation 14 and Appendix VII (simplified polygon)';
const SOX = 'Sulphur Emission Control Area: fuel sulphur limit 0.10 percent m/m (use MGO or a scrubber).';
const SOX_NOX = `${SOX} Also a nitrogen (NOx Tier III) area.`;

export const ZONES: readonly Zone[] = [
  {
    id: 'eca-baltic',
    kind: 'eca',
    name: 'Baltic Sea ECA',
    summary: SOX,
    status: 'in_force',
    effectiveFrom: '2006-05-19',
    approximate: true,
    source: `${MARPOL}; boundary is the parallel 57 44.8 N at the Skagen entrance`,
    ring: [
      [9.3, 57.75],
      [12.2, 57.75],
      [13.5, 59.5],
      [17, 64],
      [21, 66.5],
      [31, 66.5],
      [31, 53.5],
      [9.3, 53.5],
    ],
  },
  {
    id: 'eca-north-sea',
    kind: 'eca',
    name: 'North Sea ECA (including the English Channel)',
    summary: SOX,
    status: 'in_force',
    effectiveFrom: '2007-11-22',
    approximate: true,
    source: `${MARPOL}; North Sea as defined in Annex V regulation 5(1)(f): east of 5 W, north of 48 30 N, south of 62 N`,
    ring: [
      [-5, 48.5],
      [-5, 62],
      [12, 62],
      [12, 57.75],
      [9.3, 57.75],
      [9.3, 53.4],
      [9.3, 50],
      [-1, 48.4],
    ],
  },
  {
    id: 'eca-mediterranean',
    kind: 'eca',
    name: 'Mediterranean Sea ECA',
    summary: SOX,
    status: 'in_force',
    effectiveFrom: '2025-05-01',
    approximate: true,
    source: `${MARPOL}; Mediterranean Sea west boundary 5 36 W, east end at the Dardanelles; Black Sea and Sea of Marmara outside`,
    ring: [
      [-5.6, 35.0],
      [-5.6, 46],
      [26.2, 46],
      [26.2, 40.4],
      [36.6, 40.4],
      [36.6, 31.0],
      [32.2, 31.0],
      [25, 30.0],
      [17, 30.0],
      [10, 32],
    ],
  },
  {
    id: 'eca-north-america-pacific',
    kind: 'eca',
    name: 'North American ECA (Pacific coast)',
    summary: SOX_NOX,
    status: 'in_force',
    effectiveFrom: '2012-08-01',
    approximate: true,
    source: `${MARPOL}; up to 200 nautical miles off the US and Canadian Pacific coasts (Alaska outside)`,
    ring: [
      [-117.1, 32.5],
      [-121.8, 32.5],
      [-127.5, 40],
      [-132.5, 48.5],
      [-135, 54.7],
      [-120, 54.7],
      [-110, 54.7],
      [-110, 32.5],
    ],
  },
  {
    id: 'eca-north-america-atlantic',
    kind: 'eca',
    name: 'North American ECA (Atlantic and Gulf coasts)',
    summary: SOX_NOX,
    status: 'in_force',
    effectiveFrom: '2012-08-01',
    approximate: true,
    source: `${MARPOL}; up to 200 nautical miles off the US Atlantic and Gulf coasts and the Canadian Atlantic coast and St Lawrence`,
    ring: [
      [-97.2, 25.9],
      [-95.5, 23.5],
      [-88, 24.0],
      [-84, 23.0],
      [-80.0, 24.0],
      [-76.0, 27],
      [-73, 32],
      [-70, 36],
      [-66.5, 40],
      [-62, 41],
      [-55, 43.5],
      [-47, 47.5],
      [-50, 51.8],
      [-55.5, 51.8],
      [-60, 50.9],
      [-80, 50.9],
      [-100, 50.9],
      [-100, 25.9],
    ],
  },
  {
    id: 'eca-north-america-hawaii',
    kind: 'eca',
    name: 'North American ECA (Hawaiian Islands)',
    summary: SOX_NOX,
    status: 'in_force',
    effectiveFrom: '2012-08-01',
    approximate: true,
    source: `${MARPOL}; up to 200 nautical miles around the main Hawaiian Islands`,
    ring: [
      [-164, 15.6],
      [-151.4, 15.6],
      [-151.4, 25.6],
      [-164, 25.6],
    ],
  },
  {
    id: 'eca-us-caribbean',
    kind: 'eca',
    name: 'US Caribbean Sea ECA (Puerto Rico and US Virgin Islands)',
    summary: SOX_NOX,
    status: 'in_force',
    effectiveFrom: '2014-01-01',
    approximate: true,
    source: `${MARPOL}, Appendix VII (simplified box around Puerto Rico and the US Virgin Islands)`,
    ring: [
      [-68.0, 16.9],
      [-63.6, 16.9],
      [-63.6, 19.2],
      [-68.0, 19.2],
    ],
  },
  {
    id: 'piracy-somali-indian-ocean',
    kind: 'piracy',
    name: 'Indian Ocean piracy risk area (Gulf of Aden, Arabian Sea, Somali Basin)',
    summary:
      'Industry-defined area of higher piracy risk (BMP5 area, reduced in 2019 and again in 2021). Register with UKMTO and follow BMP5. Advisory only.',
    status: 'advisory',
    approximate: true,
    source: 'BMP5 / BIMCO-ICS circulars on the Indian Ocean High Risk Area (simplified from the May 2019 limits)',
    ring: [
      [38, 15.0],
      [43.5, 15.0],
      [56.5, 17.8],
      [60, 14],
      [60, 10],
      [55, 0],
      [50, -5],
      [38, -5],
    ],
  },
  {
    id: 'piracy-gulf-of-guinea',
    kind: 'piracy',
    name: 'Gulf of Guinea piracy risk area',
    summary:
      'Armed robbery and kidnap risk area off West and Central Africa (Liberia to Angola, widest off the Niger Delta). Follow BMP West Africa. Advisory only.',
    status: 'advisory',
    approximate: true,
    source: 'Industry listed areas and BMP West Africa (simplified; the exact listed area changes)',
    ring: [
      [-12, 8.5],
      [-4, 8],
      [8, 8],
      [12, 4.5],
      [13.5, -5.5],
      [10, -8],
      [0, -6],
      [-12, -3],
    ],
  },
];

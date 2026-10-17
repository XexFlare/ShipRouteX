# Zones

The ECA and piracy polygons live in `packages/core/src/zones-data.ts` (typed, tested, bundled into the API). This note records what they are and what they are not.

## What they are

Simplified polygons in lon/lat with straight edges, accurate to roughly 20 to 50 km, drawn generously over land where that is harmless. They answer "about how many kilometres of this voyage are inside an ECA", for fuel and cost estimates. Every zone says `approximate: true` and cites the rule it simplifies.

| Zone | In force | Basis |
|---|---|---|
| Baltic Sea | 2006-05-19 | MARPOL Annex VI reg. 14, parallel 57 44.8 N at Skagen |
| North Sea incl. English Channel | 2007-11-22 | east of 5 W, north of 48 30 N, south of 62 N |
| Mediterranean Sea | 2025-05-01 | west boundary 5 36 W, east end at the Dardanelles |
| North American (Pacific; Atlantic and Gulf; Hawaii) | 2012-08-01 | Appendix VII, 200 nm from the coast |
| US Caribbean (Puerto Rico, US Virgin Islands) | 2014-01-01 | Appendix VII |
| Indian Ocean piracy area | advisory | BMP5 high risk area (2019 limits, simplified) |
| Gulf of Guinea piracy area | advisory | industry listed areas and BMP West Africa (simplified) |

The route API counts an ECA only from its start date (`as_of`, default today), so old dates give old answers.

## Not covered (needs an authoritative source before adding)

- Canadian Arctic and Norwegian Sea ECAs (adopted by IMO resolution MEPC.392(82), deemed accepted 1 September 2025; entry-into-force and enforcement dates and exact coordinates not confirmed here).
- Exact Appendix VII coordinate lists for the North American, US Caribbean and Mediterranean areas. The IMO publishes them; replace the simplified rings with the real points.
- Red Sea / Bab-el-Mandeb conflict-related warning areas (not piracy), Singapore Strait and Malacca (ReCAAP robbery area), and the current JWC listed areas.
- The 2021 revision of the Indian Ocean high risk area (letters A to F) was not available in full; the 2019 limits are used.
- NOx Tier III applies in the North American and US Caribbean ECAs and, for ships built from 2021, in the Baltic and North Sea. The API reports sulphur ECA distance only.

Do not use these polygons for compliance or security decisions.

import { parseCoordinates } from './src/lib/coordinates/parsers.ts';
import { latLonToDMS, latLonToUTM, latLonToMGRS } from './src/lib/coordinates/converters.ts';

const testCases = [
  "40.4250, 29.9194", // DD
  "40° 25' 30\" N, 29° 55' 9.84\" E", // DMS
  "35T 748054 4478950", // UTM
  "35T PE 48054 78950", // MGRS
  "36S 342111 4111222"
];

for (const tc of testCases) {
  console.log(`\nTesting: ${tc}`);
  const parsed = parseCoordinates(tc, "WGS84");
  if (parsed && parsed.latLon) {
    console.log(`Parsed LatLon: ${parsed.latLon.lat}, ${parsed.latLon.lon}`);
    console.log(`-> DMS:  ${latLonToDMS(parsed.latLon)}`);
    const utm = latLonToUTM(parsed.latLon);
    console.log(`-> UTM:  ${utm}`);
    console.log(`-> MGRS: ${latLonToMGRS(parsed.latLon)}`);
  } else {
    console.log("Parse failed.");
  }
}

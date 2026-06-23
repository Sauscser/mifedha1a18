#!/usr/bin/env node

const baseUrl = process.env.EXPO_PUBLIC_OSRM_BASE_URL || process.argv[2];

if (!baseUrl) {
  console.error('Missing OSRM base URL.');
  console.error('Use EXPO_PUBLIC_OSRM_BASE_URL or pass as first arg.');
  process.exit(1);
}

const trimmed = baseUrl.replace(/\/+$/, '');
const sampleRoute = `${trimmed}/route/v1/driving/36.8219,-1.2921;36.8968,-1.2166?overview=false`;

(async () => {
  try {
    const res = await fetch(sampleRoute);
    if (!res.ok) {
      console.error(`HTTP ${res.status} from OSRM endpoint`);
      process.exit(2);
    }

    const data = await res.json();
    const routeCount = Array.isArray(data.routes) ? data.routes.length : 0;

    if (data.code !== 'Ok' || routeCount === 0) {
      console.error('OSRM responded but no usable route found.');
      console.error(JSON.stringify({ code: data.code, routes: routeCount }, null, 2));
      process.exit(3);
    }

    const firstDistanceMeters = data.routes[0]?.distance;
    console.log('OSRM endpoint is healthy.');
    console.log(JSON.stringify({
      code: data.code,
      routes: routeCount,
      sampleDistanceMeters: firstDistanceMeters,
      endpoint: trimmed,
    }, null, 2));
  } catch (err) {
    console.error('Failed to reach OSRM endpoint.');
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(4);
  }
})();

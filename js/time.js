// Clock with optional server-time offset (Sydney). Falls back to local clock.

let clockOffsetMs = 0; // serverNow - localNow

export function now() {
  return new Date(Date.now() + clockOffsetMs);
}

export async function syncTime() {
  try {
    const res = await fetch('https://www.timeapi.io/api/time/current/zone?timeZone=Australia/Sydney', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const server = new Date(data.dateTime);
    if (!isNaN(server)) {
      clockOffsetMs = server - new Date();
    }
  } catch (_) { /* fall back to local clock */ }
}

// Shared scan tracking for the demo. No backend: events go through a public ntfy.sh topic
// (12h retention). Only coarse data is sent: practice, city/region, device, browser. Never the IP.
window.EmoraTrack = (() => {
  const TOPIC = 'emora-lol-scans-r7nrny2a';
  const FEED = `https://ntfy.sh/${TOPIC}`;

  // One QR (and one link) per referring pediatrician
  const PRACTICES = {
    'sunny-days': { name:'Sunny Days Pediatrics', doc:'Dr. Alvarez', city:'Austin, TX',  color:'#e0795a' },
    'lone-star':  { name:'Lone Star Kids Clinic', doc:'Dr. Patel',   city:'Dallas, TX',  color:'#5b8def' },
    'coral-bay':  { name:'Coral Bay Pediatrics',  doc:'Dr. Okafor',  city:'Miami, FL',   color:'#3fb39a' },
  };
  const practice = id => PRACTICES[id] || { name: id || 'Unknown practice', doc:'', city:'', color:'#999' };
  const scanUrl = id => `${location.protocol.startsWith('http') ? location.origin : 'https://emora.lol'}/scan?p=${id}`;

  function visitor() {
    let id = null, returning = false;
    try { id = localStorage.getItem('emora-vid'); returning = !!id;
          if (!id) { id = Math.random().toString(36).slice(2, 10); localStorage.setItem('emora-vid', id); } }
    catch { id = Math.random().toString(36).slice(2, 10); }
    return { id, returning };
  }

  function parseUA(ua = navigator.userAgent) {
    let device = 'Desktop', os = 'Unknown', browser = 'Browser';
    let m;
    if (/iPhone/.test(ua)) device = 'iPhone';
    else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) device = 'iPad';
    else if (/Android/.test(ua)) { device = (ua.match(/Android [\d.]+; ([^;)]+?)(?: Build|\))/) || [])[1] || 'Android phone';
      if (/^K$/.test(device)) device = 'Android phone'; }
    else if (/Macintosh/.test(ua)) device = 'Mac';
    else if (/Windows/.test(ua)) device = 'Windows PC';
    if ((m = ua.match(/OS (\d+)[_.](\d+)/)) && /iPhone|iPad/.test(ua)) os = `iOS ${m[1]}.${m[2]}`;
    else if ((m = ua.match(/Android ([\d.]+)/))) os = `Android ${m[1]}`;
    else if ((m = ua.match(/Mac OS X (\d+)[_.](\d+)/))) os = `macOS ${m[1]}.${m[2]}`;
    else if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
    if (/Instagram/.test(ua)) browser = 'Instagram in-app';
    else if (/FBAN|FBAV/.test(ua)) browser = 'Facebook in-app';
    else if (/CriOS|Chrome\//.test(ua) && !/Edg/.test(ua)) browser = 'Chrome';
    else if (/Edg/.test(ua)) browser = 'Edge';
    else if (/FxiOS|Firefox/.test(ua)) browser = 'Firefox';
    else if (/Safari/.test(ua)) browser = 'Safari';
    const mobile = /iPhone|Android|iPad/.test(device) || /Mobi/.test(ua);
    return { device, os, browser, mobile };
  }

  // City-level location from the IP (looked up by the visitor's browser; the IP itself is never published)
  async function geo() {
    const tryJson = async (url, map) => {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500);
      try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw 0; return map(await r.json()); }
      finally { clearTimeout(t); }
    };
    try { return await tryJson('https://ipwho.is/?fields=city,region_code,country_code,success',
            j => { if (!j.success) throw 0; return { city:j.city, region:j.region_code, country:j.country_code }; }); } catch {}
    try { return await tryJson('https://ipapi.co/json/', j => ({ city:j.city, region:j.region_code, country:j.country_code })); } catch {}
    return { city:null, region:null, country:null };
  }

  const isDev = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  async function publish(evt) {
    if (isDev) evt = { ...evt, dev:true };
    try { await fetch(FEED, { method:'POST', body: JSON.stringify(evt), keepalive:true }); } catch {}
  }

  // Backfill the last 12h, then stream new events
  async function subscribe(onEvent) {
    const seen = new Set();
    const handle = m => { if (m.event !== 'message' || seen.has(m.id)) return; seen.add(m.id);
      try { const e = JSON.parse(m.message); if (e.sim || (e.dev && !isDev)) return;  // real scans only
            onEvent({ ...e, _id:m.id, _t:m.time*1000 }); } catch {} };
    try {
      const r = await fetch(`${FEED}/json?poll=1&since=12h`);
      (await r.text()).split('\n').filter(Boolean).forEach(l => handle(JSON.parse(l)));
    } catch {}
    const es = new EventSource(`${FEED}/sse?since=30s`);
    es.onmessage = e => { try { handle(JSON.parse(e.data)); } catch {} };
    return es;
  }

  return { PRACTICES, practice, scanUrl, visitor, parseUA, geo, publish, subscribe };
})();

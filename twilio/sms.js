// Twilio Function: inbound SMS webhook for the emora.lol demo line.
// Replies with a scripted intake flow and mirrors both sides to a per-chat ntfy topic,
// which emora.lol/chat?c=<code> renders live. Demo only: no real health data.
const PRACTICES = {
  'SUNNY-DAYS': 'Sunny Days Pediatrics',
  'LONE-STAR':  'Lone Star Kids Clinic',
  'CORAL-BAY':  'Coral Bay Pediatrics',
};
const NTFY = 'https://ntfy.sh';
const SCANS_TOPIC = 'emora-lol-scans-jlilk0n3';

// One reply: the full intake experience lives on the web demo (works even before carrier approval)
const link = (ref, code) => `https://emora.lol/chat?p=${ref.toLowerCase() || 'sunny-days'}&s=1`;
const FIRST = (p, url) => `Alba demo for Emora: Thanks for texting! In the real product, Emora's coordinator would reply here about your referral from ${p}. Try the full conversation: ${url} Reply STOP to opt out.`;
const LATER = url => `Alba demo for Emora: this is a demo line. Continue the conversation here: ${url}`;

const post = (topic, obj) => fetch(`${NTFY}/${topic}`, { method: 'POST', body: JSON.stringify(obj) }).catch(() => {});

exports.handler = async function (context, event, callback) {
  const twiml = new Twilio.twiml.MessagingResponse();
  const from = event.From, to = event.To, body = String(event.Body || '').trim();
  const masked = `•••${String(from).slice(-2)}`;
  try {
    // This sender's texts in the last 24h, newest first (the current one may or may not be listed yet)
    const client = context.getTwilioClient();
    let history = await client.messages.list({ from, to, dateSentAfter: new Date(Date.now() - 864e5), limit: 50 });
    history = history.filter(m => m.sid !== event.MessageSid).map(m => m.body || '');
    const msgs = [body, ...history];

    const start = msgs.findIndex(b => /Ref:\s*[A-Z-]+/i.test(b));      // the QR-prefilled opener
    const opener = start >= 0 ? msgs[start] : body;
    const code = (opener.match(/chat\s+([a-z0-9]{4,10})/i) || [])[1];
    const ref = ((opener.match(/Ref:\s*([A-Z-]+)/i) || [])[1] || '').toUpperCase();
    const practice = PRACTICES[ref] || 'your pediatrician';
    const turn = start >= 0 ? start : 0;                                  // texts since the opener
    const reply = turn === 0 ? FIRST(practice, link(ref, code)) : LATER(link(ref, code));

    twiml.message(reply);
    const now = Date.now();
    const pid = ref.toLowerCase();
    if (pid) await post(`emora-lol-chat-${pid}`, { dir: 'in', text: body, from: masked, ts: now });
    if (start === 0 && pid) {                                           // first text of a QR hand-off only
      // The scan itself is logged by emora.lol/scan; this records that the real text arrived.
      await post(SCANS_TOPIC, { type: 'text', sms: true, practice: pid, from: masked });
    }
  } catch (err) {
    console.error(err);
    twiml.message(LATER('https://emora.lol/chat'));
  }
  return callback(null, twiml);
};

# emora.lol: plush bear QR referral demo

A demo of a pediatrician-office referral flow for Emora Health. A plush bear with a QR code on its belly sits in a (made-up) pediatrician's office. A parent scans it, texts Emora in two taps, and every scan shows up live, credited to the referring office.

Live at **https://emora.lol**. Built by Alba (Nik) for the Emora team.

## How it's hosted
- GitHub Pages serves this repo's `main` branch at emora.lol (the `CNAME` file holds the domain).
- **Every push to `main` goes live in about a minute.** There is no build step. Edit the HTML/JS and push.
- Domain is registered at Namecheap (Nik's account); DNS points at GitHub Pages.

## Files
| File | What it is |
|---|---|
| `index.html` | The bear page: Three.js scene (bear, team looks, office, QR), live scan log, easter-egg care buttons |
| `scan.html` | Where the QR goes. Logs the scan, then opens Messages pre-filled to the demo number |
| `chat.html` | Web version of the text conversation (referral → trust → intake → matches → booking) |
| `track.js` | Shared: the 3 demo practices, device/location lookup, the live event feed |
| `assets/` | Emora logo files (from emorahealth.com) |
| `twilio/sms.js` | The Twilio Function that receives texts on the demo number. **Not deployed by pushing here.** Ask Nik to redeploy after edits |

## URL options
| Param | Effect |
|---|---|
| `?team=robin` | Opens on a team bear: `bear`, `zach`, `ed`, `robin` |
| `?care` | Shows the Feed / Water / Hug / Nap / Hair buttons (otherwise: tap the bear 3 times, or the faint 🐾) |
| `?p=lone-star` | Referring office: `sunny-days` (default), `lone-star`, `coral-bay` |

## Common edits
- **Practices / doctors:** `PRACTICES` in `track.js`.
- **Team bear looks** (hair, eyes, glasses, clothes): `LOOKS` and `applyLookBase()` in `index.html`.
- **Chat script:** the `run()` function and `THERAPISTS` list in `chat.html`. Therapists are fictional.
- **Office scene** (sign, wall colours, props): the "pediatrician's office" section in `index.html`.

## Data notes
- The live log uses a public ntfy.sh topic (name in `track.js`). It keeps 12 hours. Only city, device and browser are sent, never IPs or names. Fine for a demo, not for real patient data.
- To clear the log, change the topic name in **both** `track.js` and `twilio/sms.js` (then redeploy the Twilio function).
- Local testing: run `npx serve .` in this folder. Events from localhost are tagged and hidden from the live site.

import { Grid2x2, Radar, ScrollText } from 'lucide-react'
import { Benny } from '../components/Benny'
import { CREDITS, PROXIMITY_BANDS, SCORING } from '../config'
import { countryName } from '../data/countries'
import { LOCATIONS } from '../data/locations'
import { Page } from './Pages'

export function HowTo() {
  return (
    <Page title="HOW TO PLAY" kicker="60-SECOND BRIEFING">
      <div className="howto">
        <section className="howto__step"><span className="howto__n">01</span><div><h3>Look closely</h3><p>You’re dropped somewhere real. Read the signs, the road, the plants, the cars, the sky. Pinch or double-tap to zoom.</p></div><Benny expr="lookaround" size={96} /></section>
        <section className="howto__step"><span className="howto__n">02</span><div><h3>Drop your pin</h3><p>Open the map, tap where you think you are, drag to adjust, then press <b>GUESS</b> and <b>CONFIRM</b>. Two taps, so a stray finger never costs you a round.</p></div><Benny expr="maphelper" size={96} /></section>
        <section className="howto__step"><span className="howto__n">03</span><div><h3>Score</h3><p>Up to {SCORING.maxPerRound.toLocaleString('en-US')} points a round — the closer, the more. Five rounds, {(SCORING.maxPerRound * 5).toLocaleString('en-US')} max.</p></div><Benny expr="proud" size={96} /></section>
      </div>
      <h2 className="h2 mt">THE THREE CLUES <small className="muted">· −{SCORING.cluePenalty} each, use any or none</small></h2>
      <div className="howclues">
        <div><Grid2x2 /><h3>FOUR CORNERS</h3><p>Four countries, one is right. Pick it to confirm the country (and earn a passport stamp).</p></div>
        <div><ScrollText /><h3>DECODE</h3><p>A short riddle about the place — language, climate, history, food. Helpful, never a giveaway.</p></div>
        <div><Radar /><h3>PROXIMITY</h3><p>Drop one test pin. You’ll hear how hot or cold it is: {PROXIMITY_BANDS.map((b) => b.label).join(', ')}. Your real guess is separate.</p></div>
      </div>
      <h2 className="h2 mt">MODES</h2>
      <ul className="bul">
        <li><b>WORLD TOUR</b> — five places. With a free street-imagery key (Settings) you can look around and move along roads; otherwise you get a real photo of each place.</li>
        <li><b>ONE SHOT</b> — one fixed photo per round. No moving, no rotating. Pure instinct.</li>
        <li><b>ENDLESS EXPLORER</b> — keep going as long as you like and stop any time.</li>
      </ul>
      <p className="note">Tip: tap Benny. Repeatedly. For science.</p>
    </Page>
  )
}

export function Credits() {
  const photos = LOCATIONS.slice().sort((a, b) => countryName(a.countryCode).localeCompare(countryName(b.countryCode)))
  return (
    <Page title="CREDITS" kicker="ATTRIBUTION & LICENSES" wide>
      <div className="credits">
        <section>
          <h2 className="h2">LOCATED.</h2>
          <p>Created by {CREDITS.createdBy}. Starring Benny, a real Pomeranian, as himself. © {CREDITS.year}. Benny artwork from the LOCATED. mascot sheet.</p>
          <p className="muted small">All game sounds are synthesized live in the browser — no recorded audio is used.</p>
        </section>
        <section>
          <h2 className="h2">MAPS &amp; DATA</h2>
          <ul className="bul">
            <li>Country borders: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a> (public domain), via <a href="https://github.com/topojson/world-atlas" target="_blank" rel="noopener">world-atlas</a> (ISC).</li>
            <li>Detailed map tiles: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>, ODbL. Tiles served by the OpenStreetMap Foundation under its tile usage policy.</li>
            <li>Street-level imagery (when enabled): <a href="https://www.mapillary.com" target="_blank" rel="noopener">Mapillary</a> contributors, CC BY-SA 4.0, shown with MapillaryJS (MIT).</li>
          </ul>
        </section>
        <section>
          <h2 className="h2">SOFTWARE</h2>
          <p className="small">React (MIT) · Vite (MIT) · Leaflet (BSD-2-Clause) · d3-geo (ISC) · topojson-client (ISC) · Lucide icons (ISC) · Archivo typeface by Omnibus-Type (SIL Open Font License 1.1) · MapillaryJS (MIT).</p>
        </section>
        <section>
          <h2 className="h2">PHOTOGRAPHS</h2>
          <p className="muted small">Real photos from Wikimedia Commons, used under their open licenses. Resized for the game; otherwise unaltered. Revealing this list spoils the answers, so maybe don’t study it before playing.</p>
          <ul className="photocredits">
            {photos.map((l) => (
              <li key={l.id}>
                <b>{l.place}</b> — {l.photo.credit.title ? <>“{l.photo.credit.title}” by </> : null}{l.photo.credit.author} · <a href={l.photo.credit.licenseUrl} target="_blank" rel="noopener">{l.photo.credit.license}</a> · <a href={l.photo.credit.sourceUrl} target="_blank" rel="noopener">source</a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Page>
  )
}

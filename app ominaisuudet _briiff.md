# Saliohjelma — sovellusbriiffi Claude Codelle

## 1. Projektin konteksti ja tavoite

### Käyttäjä
Ville-Veikko, yksittäinen käyttäjä. Sovellus on täysin henkilökohtainen, ei muita käyttäjiä, ei kirjautumista, ei käyttäjähallintaa.

### Käyttötilanne
Sovellusta käytetään salilla puhelimella treenin aikana. Kädet voivat olla likaiset ja märät, rasitus vaikuttaa motoriikkaan. Käyttöliittymän on oltava erittäin selkeä, napit isoja ja helppokäyttöisiä.

### Tavoite
Sovellus korvaa Google Sheets -taulukon selaamiseen salilla. Käyttäjä suunnittelee ohjelman edelleen Sheetsissä, mutta kirjaa toteutuneet tulokset sovellukseen, joka tallentaa ne automaattisesti takaisin Sheetsiin.

---

## 2. Tekninen arkkitehtuuri

### Frontend
- React + Vite, ei TypeScript
- Mobile-first, max-leveys 430px, keskitetty
- Tumma teema (#0f0f0f tausta), koko sovelluksessa
- Hosted: GitHub Pages (pysyvä URL puhelimelle)
- Lisätään kotinäytölle kuin natiivisovellus (PWA-manifesti)

### Backend
- Google Apps Script Web App
- URL: `https://script.google.com/macros/s/AKfycbxZG_4VmrwoJkSc4L3zk-rgF5oBlEG_5FSoWGw0BOgUF5oPg9E0FabysRprXovcFeA/exec`
- Kommunikaatio: GET-pyyntö URL-parametrina (`?data=JSON`)
- Kirjoittaa tulokset Google Sheets -taulukkoon

### Tietokanta
- Google Sheets "Treeni": `https://docs.google.com/spreadsheets/d/1AJ1puqkNdG0RxgGid3fp244iwG1TzRJ8vRz3Jmi5PPo/edit`
- Aktiivinen välilehti: "Meso 3 / 26"

### Paikallinen tallennus
- localStorage: tallentaa kesken olevan treenin automaattisesti
- Sivu voidaan ladata uudelleen ilman datan menetystä
- Avain: `saliohjelma_treeni_[viikko]_[paiva]`
- Tallennetaan jokaisen setin jälkeen automaattisesti

---

## 3. Google Sheets -taulukon rakenne

### Meso 3/26 -välilehti — sarakerakenne
| Sarake | Sisältö | Esimerkki |
|--------|---------|-----------|
| A | Viikko (numero) | 1 |
| B | RIR tavoite | 2 |
| C | Päivä | Day 1 |
| D | Liike | Penkki |
| E | Raskas kg | 92.5 |
| F | Back-off kg | 75 tai "bw" |
| G | Suun. toistot raskas | 3-5 |
| H | Suun. toistot bo | 12 |
| I | Tot. set1 | 5 |
| J | Tot. set2 | 4 |
| K | Tot. set3 | 4 tai tyhjä/harmaa |
| L | Tot. bo | 12 |
| M | Epley max (kaava) | 107.9 |

### Tärkeät huomiot rakenteesta
- Jokainen rivi = yksi liike + yksi viikko + yksi päivä
- Rivi tunnistetaan yhdistelmällä: Viikko (A) + Päivä (C) + Liike (D)
- Tyhjät rivit erottelevat päiviä ja viikkoja toisistaan
- Leuat Day 3: sarake K on harmaa (vain 2 raskasta settiä, ei kolmatta)
- Apuliikkeillä (Olkapäät, Crunch jne.) ei ole back-off settiä (F ja H tyhjät)

### Ohjelmarakenne (Meso 3/26)
**3 viikkoa:**
- Viikko 1: RIR 2, 3 raskasta settiä + 1 back-off
- Viikko 2: RIR 1, 3 raskasta settiä + 1 back-off
- Viikko 3: RIR 0, 4 raskasta settiä + 1 back-off

**3 päivää per viikko:**

Day 1:
- Penkki (pääliike) — 92.5 / 97.5 / 102.5 kg, back-off 75 kg
- Kyykky (pääliike) — 92.5 / 97.5 / 102.5 kg, back-off 75 kg
- Leuat (pääliike) — 12.5 / 17.5 / 22.5 kg lisäpaino, back-off bw
- Olkapäät (apuliike) — 12 kg, ei back-off
- Crunch (apuliike) — bw, ei back-off

Day 2:
- Penkki, Kyykky, Leuat (samat kilot kuin Day 1)
- Olkapääkaapeli — 7.5 kg, ei back-off
- Ojentajat — 22.5 kg, ei back-off

Day 3:
- Penkki, Kyykky, Leuat (samat kilot)
- **Leuat: vain 2 raskasta settiä** (Day 3 -erikoisuus)
- Olkapääkaapeli — 14 kg, ei back-off
- Hauiskäännöt — 25 kg, ei back-off

---

## 4. Sovelluksen näkymät ja navigointi

### Navigointirakenne
Sovelluksessa on kolme päänäkymää jotka näkyvät alareunassa pysyvänä tab-palkkina (piilotettu aloitusnäkymässä):
1. 🏋️ **Treeni** — aktiivinen treeni
2. 📋 **Yhteenveto** — päivän tulokset
3. 📈 **Kehitys** — Epley-historia mesoittain

---

## 5. Näkymä 1: Aloitusnäkymä

### Toiminta
Sovellus avautuu aina aloitusnäkymään. Käyttäjä valitsee viikon ja päivän ennen treenin aloittamista.

### Sisältö
- Otsikko: "Saliohjelma" + "Meso 3 / 26"
- **Viikkovalinta (3 nappia):**
  - Viikko 1: "RIR 2 · 3+1"
  - Viikko 2: "RIR 1 · 3+1"
  - Viikko 3: "RIR 0 · 4+1"
  - Valittu nappi: sininen korostus, tumma tausta
- **Päivävalinta (3 nappia):**
  - Päivä 1, Päivä 2, Päivä 3
  - Valittu nappi: sininen korostus
- **"Aloita treeni →" -nappi:**
  - Epäaktiivinen (opacity 40%) kunnes molemmat valittu
  - Aktiivinen vasta kun viikko JA päivä valittu
  - Klikkaus siirtää treeni-näkymään

### Jatkuva tallennus
- Jos localStorage:ssa on kesken oleva treeni samalle viikolle/päivälle, sovellus tarjoaa "Jatka aiempaa treeniä" -vaihtoehtoa

---

## 6. Näkymä 2: Treeni — mini-header

### Pysyvä mini-header (sticky, top: 0)
Kun treeni on aloitettu, viikko/päivä-valinta katoaa ja tilalle tulee pieni header:
- Vasemmalla: "Meso 3/26" (pieni harmaa) + "Viikko 1 · Päivä 1" (iso valkoinen)
- Oikealla: "RIR 2 · 3+1 settiä" (keltainen)
- Tämä on ainoa paikka jossa viikko/päivä näkyy treenin aikana

---

## 7. Näkymä 2: Treeni — lepotaimeri

### Sijainti
Sticky-palkki heti mini-headerin alla (top: 49px). Näkyy vain kun taimeri on käynnissä tai juuri loppunut.

### Toiminta
- Käynnistyy **automaattisesti** aina kun käyttäjä painaa "Tehty"-nappia
- Kesto: **120 sekuntia** (2 minuuttia)
- Pysäytetään "Ohita"-napilla

### Visuaaliset elementit
- **Pyörivä rengas (SVG circle):** 40x40px, kierros rotate(-90deg)
  - Täyttyy vasemmalta myötäpäivään
  - Väri: sininen (>30s) → keltainen (10–30s) → punainen (<10s)
- **Laskuri keskellä:** "1:58" formaatissa
- **Tekstitiedot oikealla:** "Lepo käynnissä" + "Xs jäljellä"
- **Ohita-nappi:** pieni harmaa nappi oikeassa reunassa

### Kun taimeri loppuu
- Palkki muuttuu **vihreäksi** eikä katoa automaattisesti
- Teksti: "Lepo ohi — seuraava setti!" + "Napauta sulkeaksesi"
- Käyttäjä napauttaa palkkia sulkeakseen sen
- Palkki ei katoa itsestään — odottaa käyttäjän toimintaa

---

## 8. Näkymä 2: Treeni — edistymispalkki

### Sijainti
Suoraan sticky-alueiden alla, ennen liike-korttia.

### Toiminta
- Näyttää "Liike X/Y" ja prosenttiosuuden
- Palkki täyttyy liike kerrallaan
- Esim: Liike 2/5 = 40%

---

## 9. Näkymä 2: Treeni — liike-kortti

### Yksi liike kerrallaan
Näytöllä näkyy aina vain yksi liike kerrallaan. Navigointi liikkeiden välillä "← Edellinen" ja "Seuraava →" -napeilla.

### Kortin rakenne

#### Yläosa: liikkeen tiedot
- **Nimi:** iso fontti (22px, bold), esim. "Penkki"
- **Badge:** oikeassa yläkulmassa, värillinen pilli
  - Penkki: punainen badge "Pääliike"
  - Kyykky: keltainen badge "Pääliike"
  - Leuat: sininen badge "Pääliike"
  - Apuliikkeet: vihreä badge "Apuliike"
- **RIR-tavoite:** keltainen teksti badgen alla, esim. "RIR 2"

#### Infoboksit (3 kpl, grid)
Kolme tietolaatikkoa vierekkäin:

**Boksi 1 — Raskas kg:**
- Isolla: kg-arvo (esim. "92.5")
- Pienellä: toistotavoite (esim. "3–5 toistoa")

**Boksi 2 — Back-off (jos pääliike):**
- Isolla: back-off kg (esim. "75" tai "bw"), vihreällä värillä
- Pienellä: back-off toistotavoite (esim. "12 toistoa")
- Jos ei back-offia (apuliike): näyttää settimäärän

**Boksi 3 — Paras ±2.5kg:**
- Isolla: paras historiasetti lähimmällä painolla (esim. "95×4"), kullankeltainen
- Pienellä: Epley-arvio siitä setistä (esim. "≈107.7 kg")
- Hakee historiasta kaikki setit joiden paino on ±2.5 kg haetusta painosta
- Näyttää parhaan Epley-arvion tuottaneen setin
- Jos ei historiaa: "—"

---

## 10. Settien kirjaaminen

### Raskaiden settien alue
Otsikkorivi: "RASKAS · 92.5 KG · TAVOITE 3–5 TOISTOA" (pieni harmaa teksti)

Jokainen setti omalla rivillä, rakenne:
```
[S1] [92.5 kg] [−] [LUKU] [+] [TEHTY-NAPPI]
```

#### Settirivin elementit vasemmalta oikealle:

**Settinumero:** "S1", "S2", "S3" (pieni harmaa)

**Kg-label:** "92.5 kg" (harmaa, muuttuu valkoiseksi kun setti tehty)

**Minus-nappi (−):**
- 36×36px, pyöristetty (border-radius 10px)
- Tummanharmaa tausta (#333)
- Vähentää toistomäärää yhdellä
- Deaktivoituu (opacity 20%) kun setti merkitty tehdyksi
- Aktivoituu taas jos setti peruutetaan

**Numero (luku):**
- Iso, 34px, bold
- Oletuksena: suunniteltu tavoitetoistomäärän alaraja (esim. 3)
- Väri kertoo suhteen tavoitteeseen:
  - **Harmaa (#3a3a3a):** ei vielä syötetty (odotustila)
  - **Valkoinen (#e5e5e5):** tavoitealueella (esim. 3–5)
  - **Vihreä (#4ade80):** yli tavoitteen (esim. 6+)
  - **Punainen (#f87171):** alle tavoitteen (esim. 2 tai alle)
- Väri päivittyy reaaliajassa − ja + napeilla muuttaessa
- Numero ei deaktivoidu näkyvästi vaikka setti on merkitty — väri jää viimeiseen tilaan

**Plus-nappi (+):**
- Sama kuin minus-nappi
- Lisää toistomäärää yhdellä
- Deaktivoituu kun setti merkitty tehdyksi

**Tehty-nappi:**
- Ennen painamista: sininen nappi, teksti "Tehty"
- Painamisen jälkeen: vihreä nappi (#166534), teksti "✓ 5" (näyttää toistot)
- **Toggle-toiminto:** voidaan painaa uudelleen peruuttaakseen
  - Peruutus palauttaa setin harmaaksi alkutilaan
  - Luku palaa harmaaksi, + ja − aktivoituvat
  - Taimeri ei käynnisty peruutuksesta
- Painaminen merkitsee setin tehdyksi ja käynnistää 120s taimerin

#### Epley-rivi setin alla
- Pieni keltainen teksti: "1RM ≈ 107.9 kg"
- Ilmestyy vasta kun setti merkitty tehdyksi
- Lasketaan kaavalla: raskas_kg × (1 + toistot/30)
- Katoaa jos setti peruutetaan

### Back-off setin alue (vain pääliikkeillä)
Otsikkorivi: "BACK-OFF · 75 KG · TAVOITE 12 TOISTOA" (pieni vihreä teksti)

Rakenne identtinen raskaan setin kanssa:
```
[BO] [75 kg] [−] [LUKU] [+] [TEHTY-NAPPI]
```
- Settinumero on "BO" vihreällä
- Kg-label näyttää back-off kg:n
- Toistotavoite on back-off tavoite (esim. 12)
- Värilogiikka: vihreä jos ≥ tavoite, punainen jos alle, harmaa jos ei syötetty
- Epley-rivi ilmestyy myös back-offin alle (lasketaan back-off kg:lla)
- Taimeri käynnistyy myös back-offin merkitsemisestä

### Settimäärät eri viikoilla ja päivillä
- Viikko 1 ja 2: 3 raskasta settiä + 1 back-off
- Viikko 3: 4 raskasta settiä + 1 back-off
- Leuat Day 3: 2 raskasta settiä + 1 back-off (ei kolmatta raskasta)
- Apuliikkeet: 3 settiä, ei back-offia

### Apuliikkeiden kirjaaminen
Sama rakenne kuin raskailla seteillä mutta:
- Ei back-off osiota lainkaan
- Toistotavoite on kiinteä luku (esim. 22), ei vaihteluväli
- Värilogiikka: vihreä jos ≥ tavoite, punainen jos alle

---

## 11. Navigointi liikkeiden välillä

### Napit
- **"← Edellinen":** harmaa nappi, piilotettu ensimmäisellä liikkeellä
- **"Seuraava →":** sininen nappi kaikilla liikkeillä paitsi viimeisellä
- **"Yhteenveto →":** vihreä nappi viimeisellä liikkeellä

### Scrollaus
- Navigointi vierittää automaattisesti sivun ylös

### Tietojen säilyminen
- Kun navigoidaan takaisin aiempaan liikkeeseen, syötetyt tiedot säilyvät
- localStorage tallentaa jokaisen setin heti sen merkitsemisen jälkeen

---

## 12. Näkymä 3: Yhteenveto

### Navigointi
- Pääsee "Yhteenveto →" -napilla viimeisen liikkeen jälkeen
- Tai alareunaan tab-palkista koska haluat

### Sisältö
- Otsikko: "Päivän yhteenveto"
- Alaotsikko: "Päivä 1 · Viikko 1 · RIR 2"
- **Lista kaikista liikkeistä** korteissa:
  - Liikkeen nimi
  - Kg + toistot per setti (esim. "92.5 kg · 5 / 4 / 4 · bo: 12")
  - Paras Epley-arvio oikealla kullankeltaisella (esim. "107.9 kg")
  - Jos ei tuloksia: "—"

### Tallenna Sheetsiin -nappi
- Iso sininen nappi listan alla
- Klikkaus avaa **uuden välilehden** Apps Script URL:iin data-parametrilla
- Uusi välilehti näyttää vihreän onnistumissivun: "✓ Tallennettu! Viikko 1 · Day 1" + lista liikkeistä
- Uusi välilehti suljetaan käyttäjän toimesta
- Nappi muuttuu vihreäksi "✓ Tallennettu!" alle teksti "Tarkista Sheetsistä"
- Data lähetetään JSON-muodossa:
  ```json
  {
    "viikko": 1,
    "paiva": "Day 1",
    "tulokset": [
      {"liike": "Penkki", "set1": 5, "set2": 4, "set3": 4, "bo": 12},
      {"liike": "Kyykky", "set1": 6, "set2": 5, "set3": 5, "bo": 14},
      ...
    ]
  }
  ```

---

## 13. Näkymä 4: Kehitys (Epley-historia)

### Navigointi
- Tab-palkista "📈 Kehitys"

### Sisältö
Kolme erillistä taulukkoa, yksi per pääliike:
- Penkkipunnerrus
- Kyykky
- Leuat

### Jokainen taulukko
Sarakkeet: Meso | 1RM arvio | Paras setti | +/−

Esimerkkidata penkkipunnerrukselle:
| Meso | 1RM arvio | Paras setti | +/− |
|------|-----------|-------------|-----|
| M5/25 | 100.3 kg | 88.5×6 | — |
| M6/25 | 101.7 kg | 85×6 | +1.4 |
| M7/25 | 104.2 kg | 95×4 | +2.5 |
| M1/26 | 106.8 kg | 92.5×5 | +2.6 |
| M2/26 | 109.5 kg | 100×3 | +2.7 |
| M3/26 | — | ei dataa | — |

- Paras meso korostuu kullankeltaisella
- Positiivinen muutos vihreällä, negatiivinen punaisella
- M3/26 rivi päivittyy reaaliajassa kun treeniä tehdään

### Epley-kaava
`1RM = kg × (1 + toistot / 30)`

Tässä huomioitavaa:
- Leuat: käytetään lisäpainoa + kehonpaino (kehonpaino on vakio, syötetään sovellukseen kerran)
- Jos liike on "bw" eli pelkkä kehonpaino, Epley lasketaan kehonpainolla

---

## 14. Historian käyttö vertailuun

### "Paras ±2.5kg" -logiikka
Jokaisen liikkeen infoboksissa näytetään paras historiasetti:

1. Haetaan kaikki historialliset setit tälle liikkeelle
2. Filtteröidään: `|historiasetti.kg - nykyinen_kg| ≤ 2.5`
3. Lasketaan Epley jokaiselle sopivalle setille
4. Näytetään paras (korkein Epley)
5. Format: "95×4" + "≈107.7 kg"

### Historiadata
Tallennetaan sovellukseen tai haetaan Sheetsistä. Sisältää:
- Liike, kg, toistot
- Kaikki toteutuneet setit mesoista M5/25 eteenpäin

---

## 15. Visuaalinen tyyli

### Väripaletti
```
Tausta:          #0f0f0f (koko sivu)
Kortti:          #1a1a1a + 1px border #2a2a2a
Tummempi pinta:  #252525
Aktiivinen:      #1c3a5e (tummansininen)
Korostus sininen: #3b82f6
Vihreä:          #166534 (tausta), #4ade80 (teksti)
Punainen:        #7f1d1d (tausta), #f87171 (teksti)
Keltainen:       #fbbf24 (Epley, RIR)
Harmaa teksti:   #888 (sekundaari), #555 (tertiääri)
```

### Badge-värit liikkeille
- Penkki: #3d1f1f tausta, #f87171 teksti
- Kyykky: #2d2a10 tausta, #fbbf24 teksti
- Leuat: #1a2d3d tausta, #60a5fa teksti
- Apuliikkeet: #1f2d1f tausta, #4ade80 teksti

### Typografia
- Fontti: system-ui / -apple-system (natiivi)
- Liikkeen nimi: 22px, 700
- Iso luku (stepper): 34px, 800
- Kehon teksti: 14–16px, 400
- Pienet labelit: 10–12px

### Napit ja interaktiot
- Border-radius: 10–16px liukuva skaalaus
- Napin painaminen: scale(0.93–0.97) haptic-efekti
- Välimuutos: transition 0.15–0.2s

---

## 16. localStorage-tallennus

### Mitä tallennetaan
```javascript
// Avain muodostuu viikosta ja päivästä
`saliohjelma_treeni_${viikko}_${paiva}`

// Arvo (JSON)
{
  viikko: 1,
  paiva: 1,
  aikaleima: "2026-03-25T10:30:00",
  tulokset: [
    {
      liike: "Penkki",
      sets: [5, 4, 4],  // null = ei tehty
      bo: 12
    },
    ...
  ]
}
```

### Milloin tallennetaan
- Automaattisesti aina kun setti merkitään tehdyksi
- Automaattisesti aina kun setti peruutetaan

### Milloin luetaan
- Aloitusnäkymässä: tarkistetaan onko sama viikko/päivä tallennettuna
- Jos on: tarjotaan "Jatka aiempaa treeniä" -vaihtoehtoa

### Milloin tyhjennetään
- Kun käyttäjä onnistuneesti tallentaa Sheetsiin

---

## 17. Apps Script -integraatio

### Nykyinen toimiva rakenne
Apps Script -funktiot Treeni-taulukon Koodi.gs:ssä:

**`luoMeso3_26()`** — Luo uuden välilehden
**`tallennaTreeni(data)`** — Kirjoittaa tulokset soluihin
**`doGet(e)`** — Vastaanottaa GET-pyynnön datalla, kutsuu tallennaTreeni()
**`doPost(e)`** — Vastaanottaa POST-pyynnön (varasuunnitelma)

### Tallennuslogiikka
1. Sovellus kokoaa JSON-paketin kaikista päivän tuloksista
2. JSON URL-enkoodataan: `encodeURIComponent(JSON.stringify(data))`
3. Avataan uusi välilehti: `window.open(SHEETS_URL + '?data=' + encoded, '_blank')`
4. Apps Script hakee datan: `e.parameter.data`
5. Etsii oikean rivin: viikko + päivä + liike täsmäävät
6. Kirjoittaa sarakkeet I–L (Tot. set1–3, Tot. bo)

### Tulevaisuus: dynaaminen ohjelmaluku
Kun GitHub Pages -hosting on valmis, rakennetaan myös:
- `doGet()` ilman dataa: palauttaa aktiivisen meson kaikki ohjelmarivit JSON:na
- Sovellus hakee ohjelman automaattisesti käynnistyksen yhteydessä
- Ei enää kovakoodattuja kiloja ja liikkeitä

---

## 18. Puuttuvat ominaisuudet (backlog)

Nämä on suunniteltu mutta ei vielä toteutettu:

### Prioriteetti 1 — Kriittiset
- **localStorage:** Sivun lataus ei saa tuhota tietoja
- **GitHub Pages hosting:** Pysyvä URL puhelimelle
- **PWA-manifesti:** Lisättävissä kotinäytölle

### Prioriteetti 2 — Tärkeät
- **Dynaaminen ohjelmaluku Sheetsistä:** Kilot ja liikkeet haetaan automaattisesti
- **Kehonpaino-syöttö:** Tarvitaan leuoille joiden lisäpaino on "bw"
- **Epley-historia päivittyy reaaliajassa:** M3/26-rivi täyttyy treenin edetessä

### Prioriteetti 3 — Mukavat
- **Treenin kesto:** Aika aloituksesta
- **Visuaalinen edistyminen:** Montako settiä tehty vs. suunniteltu per liike
- **Äänimerkki:** Kun lepotaimeri loppuu (valinnainen)

---

## 19. Asioita joita EI tehdä

- Ei käyttäjähallintaa, kirjautumista tai rekisteröitymistä
- Ei sosiaalisia ominaisuuksia
- Ei kalenteria
- Ei ruokavalioseurantaa
- Ei sydämensykemittausta
- Ei videoita tai animaatioita liikkeistä
- Ei monen käyttäjän tukea
- Ei maksumuureja
- Ei mainoksia

---

## 20. Testaussuunnitelma

### Toiminnallisuus
1. Aloitusnäkymä: nappit aktivoituvat kun molemmat valittu
2. Treeni: setti merkitään tehdyksi → väri muuttuu, taimeri käynnistyy
3. Treeni: setti peruutetaan → kaikki palautuu alkutilaan
4. Treeni: navigointi liikkeiden välillä säilyttää tiedot
5. localStorage: sivu ladataan uudelleen → tiedot säilyvät
6. Yhteenveto: kaikki setit näkyvät oikein
7. Tallennus: Apps Script saa datan ja kirjoittaa Sheetsiin
8. Epley: tarkistetaan laskentakaava (kg × (1 + reps/30))

### Mobiili
- Testaus iPhonella Safarissa
- Testaus Androidilla Chromessa
- Napit riittävän isoja (min. 44×44px touch target)
- Teksti luettavaa ilman zoomia

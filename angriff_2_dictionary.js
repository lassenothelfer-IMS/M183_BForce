"use strict";

const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

const opferDaten = {
  vorname: "max",
  nachname: "muster",
  geburtsjahr: "2010",
  haustier: "rex",
};

const haeufigeZusaetze = ["", "1", "123", "!", "2010"];

function grossAnfang(wort) {
  return wort.charAt(0).toUpperCase() + wort.slice(1);
}

function erzeugeKandidaten(daten, zusaetze) {
  const bausteine = Object.values(daten);
  const kandidaten = [];

  for (const wort of bausteine) {
    const varianten = [wort, grossAnfang(wort)];

    for (const variante of varianten) {
      for (const zusatz of zusaetze) {
        kandidaten.push(variante + zusatz);
      }
    }
  }

  return kandidaten;
}

function erzeugeNutzer(klartextPasswort) {
  return {
    username: opferDaten.vorname,
    password: bcrypt.hashSync(klartextPasswort, SALT_ROUNDS),
  };
}

function login(nutzer, versuch) {
  return bcrypt.compareSync(versuch, nutzer.password);
}

function dictionaryAngriff(nutzer, kandidaten) {
  let versuche = 0;

  for (const kandidat of kandidaten) {
    versuche++;

    if (login(nutzer, kandidat)) {
      return { gefunden: kandidat, versuche };
    }
  }

  return { gefunden: null, versuche };
}

function main() {
  const nutzer = erzeugeNutzer("Rex2010");
  const kandidaten = erzeugeKandidaten(opferDaten, haeufigeZusaetze);

  console.log(`Angriffsziel:        username="${nutzer.username}" (bcrypt-Hash, ${SALT_ROUNDS} Salt-Rounds wie unsecure/backend/repositories/userRepository.js)`);
  console.log(`Erzeugte Kandidaten: ${kandidaten.length}`);

  const start = Date.now();
  const { gefunden, versuche } = dictionaryAngriff(nutzer, kandidaten);
  const dauerSekunden = (Date.now() - start) / 1000;

  console.log(`Passwort gefunden:   ${gefunden}`);
  console.log(`Anzahl Versuche:     ${versuche}`);
  console.log(`Dauer:               ${dauerSekunden.toFixed(3)} Sekunden`);
}

if (require.main === module) {
  main();
}

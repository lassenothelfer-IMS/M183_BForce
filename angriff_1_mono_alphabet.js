"use strict";

const bcrypt = require("bcrypt");

const ZIFFERN = "0123456789";
const SALT_ROUNDS = 10;

function erzeugeNutzer(klartextPasswort) {
  return {
    username: "monouser",
    password: bcrypt.hashSync(klartextPasswort, SALT_ROUNDS),
  };
}

function login(nutzer, versuch) {
  return bcrypt.compareSync(versuch, nutzer.password);
}

function* kombinationen(zeichensatz, laenge) {
  if (laenge === 0) {
    yield "";
    return;
  }

  for (const zeichen of zeichensatz) {
    for (const rest of kombinationen(zeichensatz, laenge - 1)) {
      yield zeichen + rest;
    }
  }
}

function bruteForceMono(nutzer, zeichensatz, maxLaenge) {
  let versuche = 0;

  for (let laenge = 1; laenge <= maxLaenge; laenge++) {
    for (const versuch of kombinationen(zeichensatz, laenge)) {
      versuche++;

      if (login(nutzer, versuch)) {
        return { gefunden: versuch, versuche };
      }
    }
  }

  return { gefunden: null, versuche };
}

function main() {
  const nutzer = erzeugeNutzer("73");

  const start = Date.now();
  const { gefunden, versuche } = bruteForceMono(nutzer, ZIFFERN, 2);
  const dauerSekunden = (Date.now() - start) / 1000;

  console.log(`Angriffsziel:      username="${nutzer.username}" (bcrypt-Hash, ${SALT_ROUNDS} Salt-Rounds wie unsecure/backend/repositories/userRepository.js)`);
  console.log(`Passwort gefunden: ${gefunden}`);
  console.log(`Anzahl Versuche:   ${versuche}`);
  console.log(`Dauer:             ${dauerSekunden.toFixed(3)} Sekunden`);
}

if (require.main === module) {
  main();
}

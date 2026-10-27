"use strict";

const crypto = require("crypto");
const bcrypt = require("bcrypt");

const ZIFFERN = "0123456789";
const SALT_ROUNDS = 10;

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
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

function baueRainbowTable(zeichensatz, maxLaenge) {
  const tabelle = new Map();

  for (let laenge = 1; laenge <= maxLaenge; laenge++) {
    for (const klartext of kombinationen(zeichensatz, laenge)) {
      tabelle.set(sha256(klartext), klartext);
    }
  }

  return tabelle;
}

function nachschlagen(tabelle, hash) {
  return tabelle.get(hash) ?? null;
}

function main() {
  const passwort = "1337";
  const tabelle = baueRainbowTable(ZIFFERN, 5);
  console.log(`Rainbow-Table gebaut: ${tabelle.size} Eintraege (SHA-256, unsalted)`);

  const naivHash = sha256(passwort);
  const naivStart = Date.now();
  const naivGefunden = nachschlagen(tabelle, naivHash);
  const naivMs = Date.now() - naivStart;

  console.log(`\nSzenario A: Passwoerter waeren mit unsalted SHA-256 gespeichert`);
  console.log(`Gestohlener Hash:  ${naivHash}`);
  console.log(`Nachschlagen:      ${naivMs} ms`);
  console.log(`Passwort gefunden: ${naivGefunden}`);

  const bcryptHash = bcrypt.hashSync(passwort, SALT_ROUNDS);
  const bcryptGefunden = nachschlagen(tabelle, bcryptHash);

  console.log(`\nSzenario B: Passwort ist bcrypt-gehasht (wie in unsecure/backend/repositories/userRepository.js, ${SALT_ROUNDS} Salt-Rounds)`);
  console.log(`Gestohlener Hash:  ${bcryptHash}`);
  console.log(`Passwort gefunden: ${bcryptGefunden}`);
  console.log(`Erklaerung:        bcrypt haengt pro Passwort einen zufaelligen Salt an, darum erzeugt derselbe Klartext jedes Mal einen anderen Hash. Eine vorberechnete Tabelle kann den Hash darum nicht treffen.`);
}

if (require.main === module) {
  main();
}

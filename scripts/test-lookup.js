const { lookup } = require("../src/lookup");

const testQueries = [
  "Bash",
  "Anger",
  "Burning Blood",
  "Fire Potion",
  "Akabeko",
  "Adroit",
  "nonexistent card",
];

async function main() {
  for (const query of testQueries) {
    const start = Date.now();
    const result = await lookup(query);
    const elapsed = Date.now() - start;

    if (result.found) {
      console.log(`✅ "${query}" → ${result.type}: ${result.name} (${elapsed}ms)`);
      console.log(`   ${result.description?.slice(0, 80)}`);
      if (result.descriptionUpgraded) {
        console.log(`   Upgraded: ${result.descriptionUpgraded.slice(0, 80)}`);
      }
    } else {
      console.log(`❌ "${query}" → not found (${elapsed}ms)`);
    }
    console.log();
  }
}

main().catch(console.error);

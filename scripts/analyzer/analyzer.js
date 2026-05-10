import fs from "fs";
import XLSX from "xlsx";

const INPUT = "data/raw/leads.json";
const OUTPUT_JSON = "data/processed/filtered-leads.json";
const OUTPUT_XLSX = "data/processed/filtered-leads.xlsx";

const raw = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

const analyzed = raw.map(lead => {
    let score = 0;

    if (!lead.website) score += 50;

    if (lead.website && lead.website.includes("facebook")) score += 25;

    if (lead.website && lead.website.includes("instagram")) score += 20;

    return {
        ...lead,
        score,
        needsWebsite: score >= 40
    };
});

const filtered = analyzed.filter(x => x.needsWebsite);

fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(filtered, null, 2)
);

const worksheet = XLSX.utils.json_to_sheet(filtered);
const workbook = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered");

XLSX.writeFile(workbook, OUTPUT_XLSX);

console.log(`Filtered ${filtered.length} leads`);
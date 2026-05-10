import fs from "fs";
import xlsx from "xlsx";

const JSON_FILE =
    "outputs/enriched-restaurants.json";

const XLSX_FILE =
    "outputs/filtered-leads.xlsx";

function sanitizeText(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return value;
    }

    if (typeof value !== "string") {
        return value;
    }

    return value
        // prywatne unicode glyphs
        .replace(/[\uE000-\uF8FF]/g, "")

        // zero width chars
        .replace(/[\u200B-\u200D\uFEFF]/g, "")

        // kontrolne unicode
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")

        // normalizacja spacji
        .replace(/\s+/g, " ")

        .trim();
}

function sanitizeObject(obj) {
    const cleaned = {};

    for (const key of Object.keys(obj)) {
        cleaned[key] =
            sanitizeText(obj[key]);
    }

    return cleaned;
}

function cleanJson() {
    console.log("\n[CLEAN] JSON");

    const raw =
        fs.readFileSync(
            JSON_FILE,
            "utf-8"
        );

    const data =
        JSON.parse(raw);

    const cleaned =
        data.map(sanitizeObject);

    fs.writeFileSync(
        JSON_FILE,
        JSON.stringify(cleaned, null, 2)
    );

    console.log(
        `[DONE] ${cleaned.length} cleaned`
    );

    return cleaned;
}

function cleanXlsx(data) {
    console.log("\n[CLEAN] XLSX");

    const workbook =
        xlsx.readFile(XLSX_FILE);

    const worksheet =
        workbook.Sheets[
        workbook.SheetNames[0]
        ];

    const rows =
        xlsx.utils.sheet_to_json(
            worksheet
        );

    const cleanedRows =
        rows.map(sanitizeObject);

    const newSheet =
        xlsx.utils.json_to_sheet(
            cleanedRows
        );

    workbook.Sheets[
        workbook.SheetNames[0]
    ] = newSheet;

    xlsx.writeFile(
        workbook,
        XLSX_FILE
    );

    console.log(
        `[DONE] ${cleanedRows.length} cleaned`
    );
}

async function main() {
    console.log("\n==========================");
    console.log("DATA CLEANER");
    console.log("==========================");

    const cleaned =
        cleanJson();

    cleanXlsx(cleaned);

    console.log("\n==========================");
    console.log("FINISHED");
    console.log("==========================");
}

main();
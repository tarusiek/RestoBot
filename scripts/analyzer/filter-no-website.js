import fs from "fs";
import xlsx from "xlsx";

const INPUT_FILE =
    "outputs/enriched-restaurants.json";

const OUTPUT_JSON =
    "outputs/no-website.json";

const OUTPUT_XLSX =
    "outputs/no-website.xlsx";

const BLOCKED_NAMES = [
    "mcdonald",
    "kfc",
    "burger king",
    "subway",
    "pizza hut",
    "dominos",
    "starbucks",
    "shell",
    "orlen",
    "bp",
    "amic",
    "auchan",
    "carrefour",
    "zabka",
    "żabka",
    "lidl",
    "biedronka"
];

function normalize(text) {
    if (!text) return "";

    return text
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function isBlockedName(name) {
    const normalized =
        normalize(name);

    return BLOCKED_NAMES.some(
        blocked =>
            normalized.includes(blocked)
    );
}

function isValidRestaurant(record) {
    if (!record) {
        return false;
    }

    if (!record.name) {
        return false;
    }

    if (!record.mapsUrl) {
        return false;
    }

    if (
        typeof record.name !== "string"
    ) {
        return false;
    }

    const name =
        normalize(record.name);

    if (name.length < 2) {
        return false;
    }

    if (
        isBlockedName(name)
    ) {
        return false;
    }

    return true;
}

function removeDuplicates(records) {
    const unique =
        new Map();

    for (const record of records) {
        const key =
            normalize(record.name);

        if (!unique.has(key)) {
            unique.set(key, record);
        }
    }

    return Array.from(
        unique.values()
    );
}

function filterNoWebsite(records) {
    return records.filter(record => {
        return (
            record.needsWebsite === true ||
            !record.website
        );
    });
}

function main() {
    console.log("\n==========================");
    console.log("FILTER NO WEBSITE");
    console.log("==========================");

    const raw =
        fs.readFileSync(
            INPUT_FILE,
            "utf-8"
        );

    const data =
        JSON.parse(raw);

    console.log(
        `[INPUT] ${data.length}`
    );

    const valid =
        data.filter(
            isValidRestaurant
        );

    console.log(
        `[VALID] ${valid.length}`
    );

    const deduplicated =
        removeDuplicates(valid);

    console.log(
        `[DEDUPLICATED] ${deduplicated.length}`
    );

    const filtered =
        filterNoWebsite(
            deduplicated
        );

    console.log(
        `[NO WEBSITE] ${filtered.length}`
    );

    fs.writeFileSync(
        OUTPUT_JSON,
        JSON.stringify(
            filtered,
            null,
            2
        )
    );

    const workbook =
        xlsx.utils.book_new();

    const worksheet =
        xlsx.utils.json_to_sheet(
            filtered
        );

    xlsx.utils.book_append_sheet(
        workbook,
        worksheet,
        "NoWebsite"
    );

    xlsx.writeFile(
        workbook,
        OUTPUT_XLSX
    );

    console.log(
        `[JSON] ${OUTPUT_JSON}`
    );

    console.log(
        `[XLSX] ${OUTPUT_XLSX}`
    );

    console.log("\n==========================");
    console.log("DONE");
    console.log("==========================");
}

main();
import fs from "fs";
import xlsx from "xlsx";

const INPUT_FILE =
    "outputs/contactable-leads.json";

const OUTPUT_JSON =
    "outputs/premium-leads.json";

const OUTPUT_XLSX =
    "outputs/premium-leads.xlsx";

const PREMIUM_KEYWORDS = [
    "sushi",
    "ramen",
    "steak",
    "burger",
    "pizza",
    "wine",
    "cocktail",
    "bar",
    "grill",
    "bistro",
    "italian",
    "japanese",
    "korean",
    "premium",
    "modern",
    "craft",
    "cafe",
    "brunch",
    "bakery",
    "dessert"
];

const LOW_QUALITY_KEYWORDS = [
    "kebab",
    "bar mleczny",
    "chińczyk",
    "zapiekanki",
    "hot dog",
    "food truck",
    "kurczak",
    "gyros"
];

function normalize(text) {
    if (!text) return "";

    return text
        .toLowerCase()
        .trim();
}

function scoreLead(record) {
    let score = 0;

    const name =
        normalize(record.name);

    const instagram =
        normalize(record.instagram);

    const facebook =
        normalize(record.facebook);

    const website =
        normalize(record.website);

    // brak strony = bardzo ważne
    if (!website) {
        score += 40;
    }

    // instagram mocno zwiększa wartość
    if (instagram) {
        score += 35;
    }

    // facebook lekki bonus
    if (facebook) {
        score += 10;
    }

    // premium keywords
    for (const keyword of PREMIUM_KEYWORDS) {
        if (name.includes(keyword)) {
            score += 20;
        }
    }

    // low quality
    for (const keyword of LOW_QUALITY_KEYWORDS) {
        if (name.includes(keyword)) {
            score -= 40;
        }
    }

    // krótkie clean nazwy często są premium
    if (
        name.length > 3 &&
        name.length < 18
    ) {
        score += 10;
    }

    // domena własna = mniej potrzebują strony
    if (website) {
        score -= 20;
    }

    return score;
}

function classify(score) {
    if (score >= 70) {
        return "premium";
    }

    if (score >= 45) {
        return "good";
    }

    return "low";
}

function main() {
    console.log("\n==========================");
    console.log("PREMIUM LEADS ANALYZER");
    console.log("==========================");

    if (!fs.existsSync(INPUT_FILE)) {
        console.log(
            `[ERROR] Missing ${INPUT_FILE}`
        );

        process.exit(1);
    }

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

    const scored =
        data.map(record => {
            const score =
                scoreLead(record);

            return {
                ...record,
                score,
                tier:
                    classify(score)
            };
        });

    scored.sort(
        (a, b) =>
            b.score - a.score
    );

    const premium =
        scored.filter(
            r => r.tier === "premium"
        );

    console.log(
        `[PREMIUM] ${premium.length}`
    );

    fs.writeFileSync(
        OUTPUT_JSON,
        JSON.stringify(
            premium,
            null,
            2
        )
    );

    const workbook =
        xlsx.utils.book_new();

    const worksheet =
        xlsx.utils.json_to_sheet(
            premium
        );

    xlsx.utils.book_append_sheet(
        workbook,
        worksheet,
        "PremiumLeads"
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

    console.log("\nTOP 10:");

    premium
        .slice(0, 10)
        .forEach((lead, index) => {
            console.log(
                `${index + 1}. ${lead.name} (${lead.score})`
            );
        });

    console.log("\n==========================");
    console.log("DONE");
    console.log("==========================");
}

main();
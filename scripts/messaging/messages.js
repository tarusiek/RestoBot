import fs from "fs";
import xlsx from "xlsx";

const INPUT_FILE =
    "outputs/premium-leads.json";

const OUTPUT_JSON =
    "outputs/ready-outreach.json";

const OUTPUT_XLSX =
    "outputs/ready-outreach.xlsx";

function detectRestaurantType(name) {
    const n =
        name.toLowerCase();

    if (
        n.includes("pizza")
    ) {
        return "pizzeria";
    }

    if (
        n.includes("sushi")
    ) {
        return "sushi";
    }

    if (
        n.includes("burger")
    ) {
        return "burgerownia";
    }

    if (
        n.includes("cocktail") ||
        n.includes("bar")
    ) {
        return "cocktail bar";
    }

    return "restauracja";
}

function generatePrice(score) {
    if (score >= 100) {
        return "2500–4000 zł";
    }

    if (score >= 85) {
        return "2000–3500 zł";
    }

    return "1500–3000 zł";
}

function generateMessage(lead) {
    const type =
        detectRestaurantType(
            lead.name
        );

    const price =
        generatePrice(
            lead.score
        );

    return `Dzień dobry,

trafiłem na ${lead.name} podczas przeglądania restauracji w okolicy.

Zauważyłem, że lokal ma bardzo dobry potencjał wizualny i brandingowy, natomiast prawdopodobnie nie posiada nowoczesnej strony internetowej dopasowanej pod urządzenia mobilne oraz aktualne standardy wyszukiwania Google.

Obecnie dla wielu klientów pierwszym kontaktem z restauracją jest właśnie strona internetowa — jeszcze przed wizytą na miejscu czy sprawdzeniem menu. Profesjonalna strona znacząco zwiększa wiarygodność lokalu, poprawia pierwsze wrażenie i pomaga przyciągać nowych klientów, szczególnie z Google Maps i wyszukiwania mobilnego.

Projektuję nowoczesne strony premium dla lokali gastronomicznych:
- menu online,
- galerie dań/drinków,
- integracja z Instagramem,
- nowoczesny design,
- szybkie ładowanie,
- pełna wersja mobilna,
- możliwość późniejszego dodawania promocji lub aktualizacji menu.

Najczęściej realizuję projekty dla lokali typu ${type} w budżetach około ${price}, zwykle poniżej standardowych cen agencji interaktywnych.

Mogę przygotować projekt dopasowany konkretnie pod charakter Państwa lokalu — tak, aby całość wyglądała nowocześnie, profesjonalnie i wyróżniała restaurację na tle konkurencji.

Pozdrawiam
Michał Tarka
`;
}

function main() {
    console.log("\n========================");
    console.log("MESSAGES GENERATOR");
    console.log("========================");

    const raw =
        fs.readFileSync(
            INPUT_FILE,
            "utf-8"
        );

    const leads =
        JSON.parse(raw);

    console.log(
        `[INPUT] ${leads.length}`
    );

    const results =
        leads.map(lead => {
            return {
                city: lead.city,
                name: lead.name,
                score: lead.score,

                instagram:
                    lead.instagram,

                facebook:
                    lead.facebook,

                phone:
                    lead.phone,

                address:
                    lead.address,

                primaryContact:
                    lead.primaryContact,

                message:
                    generateMessage(
                        lead
                    )
            };
        });

    fs.writeFileSync(
        OUTPUT_JSON,
        JSON.stringify(
            results,
            null,
            2
        )
    );

    const workbook =
        xlsx.utils.book_new();

    const worksheet =
        xlsx.utils.json_to_sheet(
            results
        );

    xlsx.utils.book_append_sheet(
        workbook,
        worksheet,
        "Outreach"
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

    console.log("\n========================");
    console.log("DONE");
    console.log("========================");
}

main();
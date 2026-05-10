import fs from "fs";

const INPUT = "data/processed/enriched-leads.json";
const OUTPUT = "data/exports/messages.txt";

const leads = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

function generateMessage(lead) {
    return `
========================================
RESTAURACJA: ${lead.query}
========================================

Dzień dobry,

trafiłem na ${lead.query} podczas analizy restauracji w Państwa okolicy.

Zauważyłem, że marka ma potencjał wizualny, natomiast obecność online mogłaby znacznie lepiej oddawać klimat restauracji i skuteczniej konwertować nowych klientów — szczególnie na urządzeniach mobilnych.

Projektuję nowoczesne strony internetowe premium dla restauracji:
- nowoczesny design dopasowany do charakteru lokalu
- pełna optymalizacja mobilna
- szybkie działanie i SEO
- integracje rezerwacji oraz social media
- spójny branding z Instagramem i materiałami wizualnymi

W wielu przypadkach dobrze zaprojektowana strona znacząco poprawia:
- liczbę rezerwacji
- wiarygodność marki
- pozycjonowanie lokalne
- skuteczność reklam i Instagrama

Jeżeli temat byłby dla Państwa interesujący, mogę przygotować niezobowiązujący przykładowy koncept wizualny dopasowany konkretnie pod ${lead.query}.

Pozdrawiam
`;
}

const messages = leads.map(generateMessage);

fs.writeFileSync(
    OUTPUT,
    messages.join("\n\n")
);

console.log(`Generated ${messages.length} professional messages`);
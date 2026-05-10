import fs from "fs";

const INPUT = "data/processed/enriched-leads.json";
const OUTPUT = "data/exports/messages.txt";

const leads = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

const messages = leads.map(lead => {
    return `
========================
${lead.query}

Cześć,
trafiłem na ${lead.query} i zauważyłem, że restauracja ma duży potencjał brandingowy, ale obecna obecność online mogłaby wyglądać dużo nowocześniej.

Projektuję ultra-nowoczesne strony restauracyjne premium:
- szybkie mobilnie
- nowoczesny design
- integracje rezerwacji
- SEO
- Instagram-first branding

Mogę przygotować przykładowy koncept pod Waszą restaurację.

Pozdrawiam
`;
});

fs.writeFileSync(
    OUTPUT,
    messages.join("\n")
);

console.log(`Generated ${messages.length} messages`);
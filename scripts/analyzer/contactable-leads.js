import fs from "fs";
import xlsx from "xlsx";

const INPUT_FILE =
    "outputs/no-website.json";

const OUTPUT_JSON =
    "outputs/contactable-leads.json";

const OUTPUT_XLSX =
    "outputs/contactable-leads.xlsx";

function normalize(value) {
    if (!value) return null;

    if (typeof value !== "string") {
        return null;
    }

    const cleaned =
        value.trim();

    if (!cleaned.length) {
        return null;
    }

    return cleaned;
}

function hasContact(record) {
    const instagram =
        normalize(record.instagram);

    const facebook =
        normalize(record.facebook);

    const phone =
        normalize(record.phone);

    const website =
        normalize(record.website);

    const email =
        normalize(record.email);

    return (
        instagram ||
        facebook ||
        phone ||
        website ||
        email
    );
}

function detectPrimaryContact(record) {
    const instagram =
        normalize(record.instagram);

    const facebook =
        normalize(record.facebook);

    const phone =
        normalize(record.phone);

    const website =
        normalize(record.website);

    const email =
        normalize(record.email);

    if (instagram) {
        return "instagram";
    }

    if (facebook) {
        return "facebook";
    }

    if (email) {
        return "email";
    }

    if (phone) {
        return "phone";
    }

    if (website) {
        return "website";
    }

    return null;
}

function buildContactSummary(record) {
    const contacts = [];

    if (record.instagram) {
        contacts.push("instagram");
    }

    if (record.facebook) {
        contacts.push("facebook");
    }

    if (record.email) {
        contacts.push("email");
    }

    if (record.phone) {
        contacts.push("phone");
    }

    if (record.website) {
        contacts.push("website");
    }

    return contacts.join(", ");
}

function removeDuplicates(records) {
    const unique =
        new Map();

    for (const record of records) {
        const key =
            (
                record.name || ""
            )
                .toLowerCase()
                .trim();

        if (!unique.has(key)) {
            unique.set(key, record);
        }
    }

    return Array.from(
        unique.values()
    );
}

function main() {
    console.log("\n==========================");
    console.log("CONTACTABLE LEADS");
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

    const filtered =
        data.filter(hasContact);

    console.log(
        `[WITH CONTACT] ${filtered.length}`
    );

    const deduplicated =
        removeDuplicates(filtered);

    console.log(
        `[DEDUPLICATED] ${deduplicated.length}`
    );

    const finalData =
        deduplicated.map(record => {
            return {
                city: record.city,
                name: record.name,

                instagram:
                    normalize(
                        record.instagram
                    ),

                facebook:
                    normalize(
                        record.facebook
                    ),

                email:
                    normalize(
                        record.email
                    ),

                phone:
                    normalize(
                        record.phone
                    ),

                website:
                    normalize(
                        record.website
                    ),

                address:
                    normalize(
                        record.address
                    ),

                mapsUrl:
                    normalize(
                        record.mapsUrl
                    ),

                primaryContact:
                    detectPrimaryContact(
                        record
                    ),

                availableContacts:
                    buildContactSummary(
                        record
                    )
            };
        });

    fs.writeFileSync(
        OUTPUT_JSON,
        JSON.stringify(
            finalData,
            null,
            2
        )
    );

    const workbook =
        xlsx.utils.book_new();

    const worksheet =
        xlsx.utils.json_to_sheet(
            finalData
        );

    xlsx.utils.book_append_sheet(
        workbook,
        worksheet,
        "ContactableLeads"
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
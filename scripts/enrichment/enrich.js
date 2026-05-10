import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import xlsx from "xlsx";

const RAW_DIR = "data/raw";
const OUTPUT_DIR = "outputs";

const INPUT_FILES = [
    "warszawa.json",
    "pruszkow.json",
    "otwock.json",
    "piaseczno.json",
    "legionowo.json"
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function ensureDirectories() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, {
            recursive: true
        });
    }
}

function loadRestaurants() {
    const restaurants = [];

    for (const file of INPUT_FILES) {
        const filePath = path.join(
            RAW_DIR,
            file
        );

        if (!fs.existsSync(filePath)) {
            console.log(`[SKIP] Missing ${file}`);

            continue;
        }

        try {
            const raw =
                fs.readFileSync(
                    filePath,
                    "utf-8"
                );

            const parsed =
                JSON.parse(raw);

            console.log(
                `[LOAD] ${file} -> ${parsed.length}`
            );

            for (const restaurant of parsed) {
                restaurants.push({
                    city: file.replace(".json", ""),
                    ...restaurant
                });
            }
        } catch (err) {
            console.log(
                `[ERROR] Cannot parse ${file}`
            );
        }
    }

    return restaurants;
}

async function extractWebsite(page) {
    const selectors = [
        'a[data-item-id="authority"]',
        'a[aria-label*="Strona internetowa"]',
        'a[aria-label*="Website"]'
    ];

    for (const selector of selectors) {
        try {
            const element =
                page.locator(selector).first();

            const count =
                await element.count();

            if (!count) continue;

            const href =
                await element.getAttribute("href");

            if (!href) continue;

            const blockedDomains = [
                "google.",
                "/maps/",
                "instagram.com",
                "facebook.com",
                "tiktok.com",
                "youtube.com",
                "linkedin.com"
            ];

            const isBlocked =
                blockedDomains.some(domain =>
                    href.includes(domain)
                );

            if (isBlocked) {
                continue;
            }

            return href;
        } catch { }
    }

    return null;
}

async function extractPhone(page) {
    try {
        const phoneButton =
            page
                .locator(
                    'button[data-item-id*="phone"]'
                )
                .first();

        const count =
            await phoneButton.count();

        if (!count) return null;

        const text =
            await phoneButton.textContent();

        if (!text) return null;

        return text.trim();
    } catch {
        return null;
    }
}

async function extractAddress(page) {
    try {
        const addressButton =
            page
                .locator(
                    'button[data-item-id="address"]'
                )
                .first();

        const count =
            await addressButton.count();

        if (!count) return null;

        const text =
            await addressButton.textContent();

        if (!text) return null;

        return text.trim();
    } catch {
        return null;
    }
}

async function extractInstagram(page) {
    try {
        const links =
            await page
                .locator(
                    'a[href*="instagram.com"]'
                )
                .all();

        for (const link of links) {
            const href =
                await link.getAttribute("href");

            if (
                href &&
                href.includes("instagram.com")
            ) {
                return href;
            }
        }
    } catch { }

    return null;
}

async function extractFacebook(page) {
    try {
        const links =
            await page
                .locator(
                    'a[href*="facebook.com"]'
                )
                .all();

        for (const link of links) {
            const href =
                await link.getAttribute("href");

            if (
                href &&
                href.includes("facebook.com")
            ) {
                return href;
            }
        }
    } catch { }

    return null;
}

async function enrichRestaurant(
    page,
    restaurant,
    index,
    total
) {
    console.log("\n================================");
    console.log(
        `[${index + 1}/${total}] ${restaurant.name}`
    );
    console.log("================================");

    try {
        await page.goto(
            restaurant.mapsUrl,
            {
                waitUntil: "domcontentloaded",
                timeout: 60000
            }
        );

        await sleep(5000);

        const website =
            await extractWebsite(page);

        const phone =
            await extractPhone(page);

        const address =
            await extractAddress(page);

        const instagram =
            await extractInstagram(page);

        const facebook =
            await extractFacebook(page);

        const enriched = {
            city: restaurant.city,
            name: restaurant.name,
            mapsUrl: restaurant.mapsUrl,

            website,
            instagram,
            facebook,

            phone,
            address,

            hasWebsite: !!website,
            needsWebsite: !website
        };

        console.log(
            `[WEBSITE] ${website || "NONE"}`
        );

        console.log(
            `[INSTAGRAM] ${instagram || "NONE"}`
        );

        console.log(
            `[FACEBOOK] ${facebook || "NONE"}`
        );

        console.log(
            `[PHONE] ${phone || "NONE"}`
        );

        console.log(
            `[ADDRESS] ${address || "NONE"}`
        );

        console.log(
            `[NEEDS WEBSITE] ${!website}`
        );

        return enriched;
    } catch (err) {
        console.log(
            `[ERROR] ${restaurant.name}`
        );

        return {
            city: restaurant.city,
            name: restaurant.name,
            mapsUrl: restaurant.mapsUrl,

            website: null,
            instagram: null,
            facebook: null,

            phone: null,
            address: null,

            hasWebsite: false,
            needsWebsite: true,
            error: true
        };
    }
}

async function saveResults(results) {
    const jsonPath = path.join(
        OUTPUT_DIR,
        "enriched-restaurants.json"
    );

    fs.writeFileSync(
        jsonPath,
        JSON.stringify(results, null, 2)
    );

    const worksheet =
        xlsx.utils.json_to_sheet(results);

    const workbook =
        xlsx.utils.book_new();

    xlsx.utils.book_append_sheet(
        workbook,
        worksheet,
        "Restaurants"
    );

    const xlsxPath = path.join(
        OUTPUT_DIR,
        "filtered-leads.xlsx"
    );

    xlsx.writeFile(
        workbook,
        xlsxPath
    );

    console.log(`\n[SAVED] ${jsonPath}`);
    console.log(`[SAVED] ${xlsxPath}`);
}

async function main() {
    console.log("\n================================");
    console.log("ENRICH START");
    console.log("================================");

    ensureDirectories();

    const restaurants =
        loadRestaurants();

    console.log(
        `[TOTAL INPUT] ${restaurants.length}`
    );

    const browser =
        await chromium.launch({
            headless: false
        });

    const context =
        await browser.newContext({
            viewport: {
                width: 1600,
                height: 1000
            },
            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36"
        });

    const page =
        await context.newPage();

    const results = [];

    for (
        let i = 0;
        i < restaurants.length;
        i++
    ) {
        const enriched =
            await enrichRestaurant(
                page,
                restaurants[i],
                i,
                restaurants.length
            );

        results.push(enriched);

        if (i % 10 === 0) {
            await saveResults(results);
        }

        await sleep(
            3000 +
            Math.random() * 2000
        );
    }

    await saveResults(results);

    const noWebsite =
        results.filter(
            r => r.needsWebsite
        );

    console.log("\n================================");
    console.log(
        `[DONE] ${results.length}`
    );

    console.log(
        `[NO WEBSITE] ${noWebsite.length}`
    );
    console.log("================================");

    await browser.close();
}

main();
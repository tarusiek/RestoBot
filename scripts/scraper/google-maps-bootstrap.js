import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const cities = [
    "Warszawa",
    "Pruszków",
    "Piaseczno",
    "Otwock",
    "Legionowo"
];

const OUTPUT_DIR = "data";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function acceptCookies(page) {
    console.log("[INFO] Checking cookies popup...");

    const selectors = [
        'button:has-text("Zaakceptuj wszystko")',
        'button:has-text("Accept all")',
        'button:has-text("I agree")',
        'button[aria-label*="Accept"]',
        'button[aria-label*="Zaakceptuj"]'
    ];

    for (const selector of selectors) {
        try {
            const button = page.locator(selector).first();

            if (await button.isVisible({ timeout: 3000 })) {
                console.log("[INFO] Accepting cookies...");

                await button.click({
                    force: true
                });

                await sleep(3000);

                console.log("[OK] Cookies accepted");

                return true;
            }
        } catch { }
    }

    console.log("[INFO] No cookies popup detected");

    return false;
}

async function waitForFeed(page) {
    console.log("[INFO] Waiting for Google Maps results feed...");

    const selectors = [
        'div[role="feed"]',
        '[aria-label*="Results for"]',
        '[aria-label*="Wyniki dla"]'
    ];

    for (const selector of selectors) {
        try {
            const feed = page.locator(selector).first();

            await feed.waitFor({
                timeout: 15000
            });

            console.log(`[OK] Feed found using: ${selector}`);

            return feed;
        } catch { }
    }

    throw new Error("Google Maps results feed not found");
}

async function collectRestaurants(page) {
    const restaurants = new Set();

    const selectors = [
        'a[href*="/place/"]',
        'div[role="article"] a[href*="/place/"]'
    ];

    for (const selector of selectors) {
        const cards = await page.locator(selector).all();

        console.log(`[INFO] Selector ${selector} -> ${cards.length} cards`);

        for (const card of cards) {
            try {
                let name =
                    await card.getAttribute("aria-label") ||
                    await card.textContent();

                if (!name) continue;

                name = name.trim();

                if (
                    name.length < 2 ||
                    name.length > 120 ||
                    name.includes("Google") ||
                    name.includes("Sponsorowane") ||
                    name.includes("Sponsored") ||
                    name.includes("\n")
                ) {
                    continue;
                }

                restaurants.add(name);

                console.log(`[FOUND] ${name}`);
            } catch { }
        }
    }

    return restaurants;
}

async function scrapeCity(browser, city) {
    console.log("\n==================================");
    console.log(`[CITY] ${city}`);
    console.log("==================================");

    const page = await browser.newPage({
        viewport: {
            width: 1440,
            height: 1000
        }
    });

    const url = `https://www.google.com/maps/search/restauracje+${encodeURIComponent(city)}`;

    console.log(`[OPENING] ${url}`);

    await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    await sleep(5000);

    await acceptCookies(page);

    await sleep(5000);

    const feed = await waitForFeed(page);

    const restaurants = new Set();

    for (let i = 0; i < 40; i++) {
        console.log(`\n[SCROLL] ${i + 1}/40`);

        await feed.evaluate(el => {
            el.scrollBy(0, 5000);
        });

        await sleep(2500);

        const current = await collectRestaurants(page);

        current.forEach(r => restaurants.add(r));

        console.log(`[INFO] Unique restaurants: ${restaurants.size}`);

        const endText = await page
            .locator('text="To już wszystkie wyniki."')
            .isVisible()
            .catch(() => false);

        if (endText) {
            console.log("[INFO] Reached end of results");
            break;
        }
    }

    const cleaned = [...restaurants]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

    const fileName = city
        .toLowerCase()
        .replace(/ą/g, "a")
        .replace(/ć/g, "c")
        .replace(/ę/g, "e")
        .replace(/ł/g, "l")
        .replace(/ń/g, "n")
        .replace(/ó/g, "o")
        .replace(/ś/g, "s")
        .replace(/ż/g, "z")
        .replace(/ź/g, "z");

    const outputPath = path.join(
        OUTPUT_DIR,
        `${fileName}.txt`
    );

    fs.writeFileSync(
        outputPath,
        cleaned.join("\n"),
        "utf-8"
    );

    console.log(`\n[SAVED] ${cleaned.length} restaurants`);
    console.log(`[FILE] ${outputPath}`);

    await page.close();

    return cleaned.length;
}

async function main() {
    console.log("\n==================================");
    console.log("GOOGLE MAPS RESTAURANT SCRAPER");
    console.log("==================================\n");

    const browser = await chromium.launch({
        headless: false,
        slowMo: 100
    });

    let total = 0;

    try {
        for (const city of cities) {
            try {
                const count = await scrapeCity(browser, city);

                total += count;
            } catch (err) {
                console.log(`\n[ERROR] ${city}`);
                console.log(err.message);
            }
        }
    } finally {
        await browser.close();
    }

    console.log("\n==================================");
    console.log(`[DONE] Total restaurants: ${total}`);
    console.log("==================================\n");
}

main();
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const OUTPUT_DIR = "data/raw";

const cities = [
    "warszawa",
    "pruszkow",
    "piaseczno",
    "otwock",
    "legionowo"
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function acceptCookies(page) {
    const selectors = [
        'button:has-text("Zaakceptuj wszystko")',
        'button:has-text("Akceptuję")',
        'button:has-text("Accept all")'
    ];

    for (const selector of selectors) {
        try {
            const button = page.locator(selector).first();

            if (await button.isVisible({ timeout: 3000 })) {
                await button.click();

                console.log("[COOKIES] Accepted");

                await sleep(4000);

                return;
            }
        } catch { }
    }
}

async function scrapeCity(page, city) {
    console.log("\n========================");
    console.log(`[CITY] ${city.toUpperCase()}`);
    console.log("========================");

    const url =
        `https://www.google.com/maps/search/restauracje+${encodeURIComponent(city)}`;

    console.log(`[OPEN] ${url}`);

    await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    await sleep(8000);

    const feed = page.locator('div[role="feed"]').first();

    await feed.waitFor({
        timeout: 30000
    });

    console.log("[OK] Feed found");

    const restaurants = new Map();

    let previousCount = 0;

    for (let scroll = 1; scroll <= 50; scroll++) {
        console.log(`\n[SCROLL] ${scroll}/50`);

        await feed.evaluate(el => {
            el.scrollBy(0, 6000);
        });

        await sleep(4000);

        const cards = await page.locator(
            'div[role="feed"] > div > div > a'
        ).all();

        console.log(`[FOUND] ${cards.length} cards`);

        for (const card of cards) {
            try {
                const href =
                    await card.getAttribute("href");

                if (
                    !href ||
                    !href.includes("/maps/place/")
                ) {
                    continue;
                }

                let name = "";

                try {
                    name =
                        (
                            await card.getAttribute(
                                "aria-label"
                            )
                        ) || "";
                } catch { }

                if (!name) {
                    try {
                        name =
                            (
                                await card.textContent()
                            ) || "";
                    } catch { }
                }

                name = name
                    .replace(/\s+/g, " ")
                    .trim();

                if (
                    !name ||
                    name.length < 2
                ) {
                    continue;
                }

                if (
                    restaurants.has(href)
                ) {
                    continue;
                }

                restaurants.set(href, {
                    name,
                    mapsUrl: href
                });

                console.log(`[ADD] ${name}`);
            } catch { }
        }

        console.log(
            `[UNIQUE] ${restaurants.size}`
        );

        if (
            restaurants.size === previousCount
        ) {
            console.log(
                "[STOP] No new restaurants"
            );

            break;
        }

        previousCount =
            restaurants.size;
    }

    const results =
        Array.from(restaurants.values());

    const outputPath = path.join(
        OUTPUT_DIR,
        `${city}.json`
    );

    fs.writeFileSync(
        outputPath,
        JSON.stringify(results, null, 2)
    );

    console.log(`\n[SAVED] ${outputPath}`);
    console.log(
        `[TOTAL] ${results.length}`
    );

    return results;
}

async function main() {
    if (
        !fs.existsSync(OUTPUT_DIR)
    ) {
        fs.mkdirSync(OUTPUT_DIR, {
            recursive: true
        });
    }

    const browser =
        await chromium.launch({
            headless: false
        });

    const context =
        await browser.newContext({
            viewport: {
                width: 1600,
                height: 1000
            }
        });

    const page =
        await context.newPage();

    await page.goto(
        "https://google.com"
    );

    await sleep(3000);

    await acceptCookies(page);

    const allRestaurants = [];

    for (const city of cities) {
        try {
            const restaurants =
                await scrapeCity(
                    page,
                    city
                );

            allRestaurants.push(
                ...restaurants
            );
        } catch (err) {
            console.log(
                `[ERROR CITY] ${city}`
            );

            console.log(err.message);
        }
    }

    fs.writeFileSync(
        path.join(
            OUTPUT_DIR,
            "all-restaurants.json"
        ),
        JSON.stringify(
            allRestaurants,
            null,
            2
        )
    );

    console.log("\n========================");
    console.log(
        `[DONE] ${allRestaurants.length}`
    );
    console.log("========================");

    await browser.close();
}

main();
const { VIVA_REAL_URL } = require("../constants");
const wait = require("./wait");
const fs = require("fs");
const { sendEmail, sendWpp } = require("./sendNotification");

const checkVivaReal = async (browser) => {
  try {
    const { vivaReal: listings, ...rest } = JSON.parse(fs.readFileSync("houses.json", "utf-8"));

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    await page.goto(VIVA_REAL_URL, { waitUntil: "domcontentloaded" });
    await wait(10000);

    const recentListings = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span")).filter((span) =>
        span.textContent?.includes("Casa para alugar em")
      );

      const seen = new Set();
      const results = [];

      for (const span of spans) {
        const parent = span.parentElement;
        const link = span.closest("a");

        const text = parent?.textContent?.trim();
        const href = link?.href;

        if (text && !seen.has(text)) {
          results.push({
            name: text,
            link: href || ZAP_URL,
          });
          seen.add(text);
        }

        if (results.length >= 5) break;
      }

      return results;
    });

    let newFoundCount = 0;

    for (const listing of recentListings) {
      const alreadySaved = listings.some((item) => item.name === listing.name);

      if (!alreadySaved) {
        console.log("Novo anuncio encontrado:", listing.name, '✅');
        const { success: emailSuccess } = await sendEmail(
          'Novo anuncio encontrado no Viva Real',
          listing.name,
          listing.link || ZAP_URL
        );
        const { success } = await sendWpp(
          'Viva Real',
          listing.name,
          listing.link
        );
        if (success || emailSuccess) {
          listings.push(listing);
          newFoundCount++;
        }
      }
    }

    if (newFoundCount > 0) {
      fs.writeFileSync("houses.json", JSON.stringify({
        ...rest,
        vivaReal: listings,
      }, null, 2));
    } else {
      console.log("Nenhum novo anuncio encontrado ❌");
    }
  } catch (error) {
    console.log('Erro ao executar checkVivaReal:', error);
  }
};

module.exports = checkVivaReal;
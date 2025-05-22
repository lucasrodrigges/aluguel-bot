const { LEGISLAR_URL } = require("../constants");
const wait = require("./wait");
const fs = require("fs");
const { sendEmail, sendWpp } = require("./sendNotification");

const checkLegislar = async (browser) => {
  try {
    const { legislar: listings, ...rest } = JSON.parse(fs.readFileSync("houses.json", "utf-8"));

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    await page.goto(LEGISLAR_URL, { waitUntil: "domcontentloaded" });
    await wait(10000);

    const recentListings = await page.evaluate(() => {
      const listings = Array.from(document.querySelectorAll("div.listing-title"));

      const seen = new Set();
      const results = [];

      for (const listing of listings) {
        const h4Link = listing.querySelector("h4 > a");
        const locationLink = listing.querySelector("a.iziopen");

        if (!h4Link || !locationLink) continue;

        const h4Text = h4Link.innerText.trim();
        const locationText = locationLink.innerText.trim();
        const href = h4Link.getAttribute("href") || '';

        const combinedText = `${h4Text} - ${locationText}`;

        if (combinedText && !seen.has(combinedText)) {
          results.push({
            name: combinedText,
            link: href,
          });
          seen.add(combinedText);
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
          'Novo anuncio encontrado no Legislar',
          listing.name,
          listing.link || ZAP_URL
        );
        const { success } = await sendWpp(
          'Legislar',
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
        legislar: listings,
      }, null, 2));
    } else {
      console.log("Nenhum novo anuncio encontrado ❌");
    }
  } catch (error) {
    console.error("Erro ao executar checkLegislar:", error);
  }
};

module.exports = checkLegislar;
const wait = require("./wait");
const fs = require("fs");
const { sendEmail, sendWpp } = require("./sendNotification");
const { COHAB_PREMIUM_URL } = require("../constants");

const checkCohabPremium = async (browser) => {
  try {
    const data = fs.readFileSync("houses.json", "utf-8");
    const { cohab: listings, ...rest } = JSON.parse(data);

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    await page.goto(COHAB_PREMIUM_URL, { waitUntil: "domcontentloaded" });
    await wait(10000);

    const recentListings = await page.evaluate(() => {
      const listingElements = Array.from(document.querySelectorAll("h2.card-titulo.corta-card-titulo"));
      const seen = new Set();
      const results = [];

      for (const listing of listingElements) {
        const name = listing.getAttribute("title");

        const mudaCard3 = listing.closest('.muda_card3');
        const mudaCard2 = mudaCard3 ? mudaCard3.previousElementSibling : null;
        const linkElement = mudaCard2 ? mudaCard2.querySelector('.carousel a') : null;

        const href = linkElement ? linkElement.href : null;

        if (name && !seen.has(name)) {
          results.push({
            name,
            link: href,
          });
          seen.add(name);
        }

        if (results.length >= 5) break;
      }

      return results;
    });

    let newFoundCount = 0;

    for (const listing of recentListings) {
      const alreadySaved = listings.some((item) => item.name === listing.name);

      if (!alreadySaved) {
        console.log("Novo anúncio encontrado:", listing.name, '✅');

        const { success: emailSuccess } = await sendEmail(
          'Novo anúncio encontrado no Cohab Premium',
          listing.name,
          listing.link || ''
        );

        const { success: wppSuccess } = await sendWpp(
          'Cohab Premium',
          listing.name,
          listing.link
        );

        if (emailSuccess || wppSuccess) {
          listings.push(listing);
          newFoundCount++;
        }
      }
    }

    if (newFoundCount > 0) {
      console.log(`${newFoundCount} novo(s) anúncio(s) salvo(s)! ✅`);
      fs.writeFileSync("houses.json", JSON.stringify({
        ...rest,
        cohab: listings,
      }, null, 2));
    } else {
      console.log("Nenhum novo anúncio encontrado ❌");
    }
  } catch (error) {
    console.error("Erro ao executar checkCohabPremium:", error);
  }
};

module.exports = checkCohabPremium;

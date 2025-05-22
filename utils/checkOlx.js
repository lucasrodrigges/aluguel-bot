const fs = require("fs");
const { OLX_URL } = require("../constants");
const wait = require("./wait");
const { sendEmail, sendWpp } = require("./sendNotification");

const checkOlx = async (browser) => {
  try {
    const { olx: listings, ...rest } = JSON.parse(fs.readFileSync("houses.json", "utf-8"));

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    await page.goto(OLX_URL, { waitUntil: "domcontentloaded" });

    await wait(10000);

    const recentListings = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('[data-testid="adcard-link"]'));
      const results = [];

      for (const link of links) {
        const title = link.getAttribute("title");
        const href = link.getAttribute("href");

        if (title && href) {
          results.push({
            name: title.trim(),
            link: href.startsWith("http") ? href : `https://www.olx.com.br${href}`,
          });
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
          'Novo anuncio encontrado na OLX',
          listing.name,
          listing.link
        );
        const { success } = await sendWpp(
          'OLX',
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
        olx: listings,
      }, null, 2));
    } else {
      console.log("Nenhum novo anuncio encontrado ❌");
    }
  } catch (error) {
    console.log('Ero ao executar o checkOlx:', error);
  }
};

module.exports = checkOlx;
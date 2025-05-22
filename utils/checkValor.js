const wait = require("./wait");
const fs = require("fs");
const { sendEmail, sendWpp } = require("./sendNotification");
const { VALOR_URL } = require("../constants");

const checkValor = async (browser) => {
  try {
    const data = fs.readFileSync("houses.json", "utf-8");
    const { valor: listings, ...rest } = JSON.parse(data);

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    await page.goto(VALOR_URL, { waitUntil: "domcontentloaded" });
    await wait(10000);

    const recentListings = await page.evaluate(() => {
      const linkElements = Array.from(document.querySelectorAll("a"));
      const seen = new Set();
      const results = [];

      for (const link of linkElements) {
        const titleElement = link.querySelector("div.tSImovelTitle");
        if (titleElement) {
          const name = titleElement.getAttribute("title") || titleElement.textContent.trim();
          const href = link.href;

          if (name && !seen.has(name)) {
            results.push({
              name,
              link: href,
            });
            seen.add(name);
          }

          if (results.length >= 5) break;
        }
      }

      return results;
    });

    let newFoundCount = 0;

    for (const listing of recentListings) {
      const alreadySaved = listings.some((item) => item.name === listing.name);

      if (!alreadySaved) {
        console.log("Novo anúncio encontrado:", listing.name, '✅');

        const { success: emailSuccess } = await sendEmail(
          'Novo anúncio encontrado no Valor',
          listing.name,
          listing.link || ''
        );

        const { success: wppSuccess } = await sendWpp(
          'Valor',
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
        valor: listings,
      }, null, 2));
    } else {
      console.log("Nenhum novo anúncio encontrado ❌");
    }

    await page.close();

  } catch (error) {
    console.error("Erro ao executar checkValor:", error);
  }
};

module.exports = checkValor;

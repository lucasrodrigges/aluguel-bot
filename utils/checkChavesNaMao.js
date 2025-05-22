const { CHAVES_NA_MAO_URL } = require("../constants");
const wait = require("./wait");
const fs = require("fs");
const { sendEmail, sendWpp } = require("./sendNotification");

const checkChavesNaMao = async (browser) => {
  try {
    const { chavesNaMao: listings, ...rest } = JSON.parse(fs.readFileSync("houses.json", "utf-8"));

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    await page.goto(CHAVES_NA_MAO_URL, { waitUntil: "domcontentloaded" });
    await wait(10000);

    const recentListings = await page.evaluate(() => {
      const paragrphs = Array.from(document.querySelectorAll(
        '[aria-label="Preço"]'
      )).filter((span) =>
        span.closest("a")?.href?.includes("https://www.chavesnamao.com.br/imovel/")
      );

      const seen = new Set();
      const results = [];

      for (const paragraph of paragrphs) {
        const parent = paragraph.parentElement;
        const link = paragraph.closest("a");

        const rawString = parent?.textContent?.trim();

        const jsonStart = rawString.indexOf('{');
        const jsonEnd = rawString.lastIndexOf('}') + 1;
        const jsonSubstring = rawString.substring(jsonStart, jsonEnd);
        const obj = JSON.parse(jsonSubstring);
        const name = obj.object.name;
        const href = obj.object.url;

        if (name && !seen.has(name)) {
          results.push({
            name,
            link: href || ZAP_URL,
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
        console.log("Novo anuncio encontrado:", listing.name, '✅');
        const { success: emailSuccess } = await sendEmail(
          'Novo anúncio encontrado no Chaves na Mão',
          listing.name,
          listing.link || ZAP_URL
        );
        const { success } = await sendWpp(
          'Chaves na Mão',
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
        chavesNaMao: listings,
      }, null, 2));
    } else {
      console.log("Nenhum novo anuncio encontrado ❌");
    }

  } catch (error) {
    console.log('Erro ao executar checkChavesNaMao:', error);
  }
};

module.exports = checkChavesNaMao;
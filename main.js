const puppeteer = require("puppeteer");
const checkChavesNaMao = require("./utils/checkChavesNaMao");
const checkVivaReal = require("./utils/checkViaReal");
const checkZapImoveis = require("./utils/checkZapImoveis");
const checkOlx = require("./utils/checkOlx");
const checkLegislar = require("./utils/checkLegislar");
const checkCohabPremium = require("./utils/checkCohabPremium");
const checkValor = require("./utils/checkValor");

const checkAll = async () => {
  console.log(`>>>>>>>>>>>>>>>> ${new Date().toLocaleString("pt-BR")} <<<<<<<<<<<<<<<<`);

  const browser = await puppeteer.launch({
    headless: 'old'
    // headless: false,
  });

  try {

    console.log(`Checando imóveis no Valor... 🔍`);
    await checkValor(browser);

    console.log(`\nChecando imóveis no Legislar... 🔍`);
    await checkLegislar(browser);

    console.log(`\nChecando imóveis no Cohab Premium... 🔍`);
    await checkCohabPremium(browser);

    console.log(`\nChecando imóveis na OLX... 🔍`);
    await checkOlx(browser);

    console.log(`\nChecando imóveis no Zap Imóveis... 🔍`);
    await checkZapImoveis(browser);

    console.log(`\nChecando imóveis no Viva Real... 🔍`);
    await checkVivaReal(browser);

    console.log(`\nChecando imóveis no Chaves na Mão... 🔍`);
    await checkChavesNaMao(browser);

    console.log(`\nChecagem concluida! \n\n\n\n`);
    await browser.close();

  } catch (error) {
    console.error("Erro ao executar checkAll:", error);
    await browser.close();
  }
};

checkAll();
setInterval(checkAll, 5 * 60 * 1000);

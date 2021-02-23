const AliExpressScrapeHandler = require("./aliexpress-scrapping-handler");

class ScrapeHandler {
  constructor(fetch, cheerio) {
    this.scrapeAliExpress = new AliExpressScrapeHandler(fetch, cheerio).scrape;
    // this.scrapeChinabrand = new ChinabrandScrapeHandler(fetch, cheerio).scrape;
  }
  handle(url) {
    //  check if the url is aliexpress.com and based on the website call the function that scrape that website
    // if (url is aliexpress) return this.scrapeAliExpress(url);
    // if (url is chinabrand) return this.scrapeChinabrand(url);
    console.log(url);
    return { number: "h37r8yb" };
  }
}

module.exports = ScrapeHandler;

const ScrapeHandler = require("./scrape-handler");

const fetch = require("node-fetch");
const $ = require("cheerio");

const url = "https://en.wikipedia.org/wiki/List_of_Presidents_of_the_United_States";

// (async () => {
//   try {
//     const html = await fetch(url).then((res) => res.text());
//     const page = $.load(html);
//     const result = page("tr > td > span[data-sort-value]");
//     // console.log(result.text()); // way 1

//     result.each(function () {
//       console.log($(this).text());
//     });
//   } catch (error) {
//     console.log(error);
//   }
// })();

class AliExpressScrapeHandler {
  constructor(fetch, cheerio) {}

  handle(url) {
    console.log("AliExpressScrapeHandler");
  }
}

module.exports = AliExpressScrapeHandler;

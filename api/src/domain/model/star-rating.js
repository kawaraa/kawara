const { Validator } = require("k-utilities");

class StarRating {
  constructor(starRating) {
    this.productNumber = starRating.number;
    this.user = starRating.user;
    this._stars = starRating.stars;
  }

  set _stars(value) {
    if (Validator.isNumber(value, 0, 5)) throw new Error("Invalid input 'Star Rating' (!)");
    this.stars = Number.parseFloat(value);
  }
}
module.exports = StarRating;

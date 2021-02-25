const { Validator } = require("k-utilities");

class StarRating {
  constructor(user, item, stars) {
    this.user = user;
    this.item = item;
    this._stars = stars;
  }

  set _stars(value) {
    if (!Validator.isNumber(value, 0, 5)) throw new Error("Invalid input 'Star Rating' (!)");
    this.stars = Number.parseFloat(value);
  }
}
module.exports = StarRating;

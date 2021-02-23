const { Validator, countries } = require("k-utilities");

class Shipping {
  constructor(shipping) {
    this._country = shipping.country;
    this._estimatedTime = shipping.estimatedTime;
    this._cost = shipping.cost;
  }

  set _country(value) {
    if (!countries[value]) throw new Error("Invalid input 'Country' (!)");
    this.country = value;
  }
  set _estimatedTime(value) {
    if (Validator.isNumber(value, 1)) this.estimatedTime = Number.parseInt(value);
    else throw new Error("Invalid input 'Estimated Time' must be positive number (!)");
  }
  set _cost(value) {
    if (Validator.isNumber(value, 0)) this.cost = Number.parseInt(value);
    else throw new Error("Invalid input 'Estimated Cost' must be positive number (!)");
  }
}
module.exports = Shipping;

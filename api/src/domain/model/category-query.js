const { Validator } = require("k-utilities");

class CategoryQuery {
  constructor(category) {
    this.country = category.country;
    this._name = category.name;
    this._limit = category.limit;
    this._offset = category.offset;
  }

  set _name(value) {
    if (!Validator.isString(value, 4, 40)) throw new Error("Invalid input 'Category Name' (!)");
    this.name = value;
  }

  set _offset(value) {
    this.offset = !Validator.isNumber(value) ? 0 : Number.parseInt(value);
  }

  set _limit(value) {
    this.limit = !Validator.isNumber(value, 1, 20) ? 20 : Number.parseInt(value);
  }
}
module.exports = CategoryQuery;

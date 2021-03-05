const { Validator, CustomError } = require("k-utilities");

class Specification {
  constructor(attribute) {
    this._title = attribute.title;
    this._description = attribute.description;
  }

  set _title(value) {
    if (Validator.isString(value, 3, 100)) this.title = value;
    else throw new CustomError("Invalid input 'Specification Title' is long");
  }
  set _description(value) {
    if (Validator.isString(value, 1, 250)) this.description = value;
    else throw new CustomError("Invalid input 'Specification Description'");
  }
}
module.exports = Specification;

const { Validator, CustomError } = require("k-utilities");

class Specification {
  constructor(attribute) {
    this._title = attribute.title;
    this._description = attribute.description;
  }

  set _title(value) {
    if (!Validator.isString(value, 3, 30)) throw new CustomError("Invalid input 'Specification Title'");
    this.title = value;
  }
  set _description(value) {
    if (!Validator.isString(value, 1, 30)) throw new CustomError("Invalid input 'Specification Description'");
    this.description = value;
  }
}
module.exports = Specification;

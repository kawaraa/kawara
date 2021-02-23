const { Validator, CustomError } = require("k-utilities");

class UpdateQuantityCommand {
  constructor(product) {
    this.owner = product.owner;
    this.number = product.number;
    this._type = product.type;
    this._size = product.size;
    this._quantity = product.quantity;
  }

  set _type(value) {
    if (!Validator.isString(value, 1)) throw new CustomError("Invalid input 'Type'");
    this.type = value;
  }
  set _size(value) {
    if (!Validator.isString(value, 1)) throw new CustomError("Invalid input 'Size'");
    this.size = value;
  }
  set _quantity(value) {
    if (!Validator.isNumber(value, 1))
      throw new CustomError("Invalid input 'Quantity' must be positive number");
    this.quantity = Number.parseInt(value);
  }
}
module.exports = UpdateQuantityCommand;

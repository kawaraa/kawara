const { Validator } = require("k-utilities");

class Size {
  constructor(size) {
    this._size = size.size;
    this._price = size.price;
    this._inStock = size.quantity;
  }
  set _size(value) {
    if (Validator.isString(value, 1)) this.size = value;
    else throw new Error("Invalid input 'Product Size' (!)");
  }
  set _price(value) {
    if (Validator.isNumber(value, 0.1)) this.price = Number.parseInt(value);
    else throw new Error("Invalid input 'Product Price' must be positive number (!)");
  }
  set _inStock(value) {
    if (Validator.isNumber(value, 1)) this.inStock = Number.parseInt(value);
    else throw new Error("Invalid input 'Product Quantity' must be positive number (!)");
  }
}
module.exports = Size;

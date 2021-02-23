const { Validator, Formatter } = require("k-utilities");
const Size = require("./size");

class Type {
  constructor(type) {
    this.id = Formatter.newId();
    this._type = type.type;
    this._size = type.sizes;
  }

  set _type(value) {
    if (Validator.isString(value, 1)) this.type = value;
    else throw new Error("Invalid input 'Type' (!)");
  }
  set _size(value) {
    if (!Array.isArray(value)) throw new Error("Invalid input 'Product Size' format (!)");
    this.sizes = value.map((size) => new Size(size));
  }
}
module.exports = Type;

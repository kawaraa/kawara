const { Validator, CustomError } = require("k-utilities");

class SoldItem {
  constructor(item) {
    this.id = crypto.randomUUID();
    this.orderId = null;
    this.shipmentId = null;
    this._productNumber = item.number;
    this._name = item.name;
    this._picture = item.picture;
    this._type = item.type;
    this._size = item.size;
    this._price = item.price;
    this._shippingCost = item.shippingCost;
    this._quantity = item.quantity;
  }

  set _productNumber(value) {
    if (!Validator.isString(value, 5, 250)) throw CustomError("Invalid input 'Product Number'");
    this.productNumber = value;
  }
  set _name(value) {
    if (!Validator.isString(value, 5, 250)) throw CustomError("Invalid input 'Product Name'");
    this.name = value;
  }
  set _picture(value) {
    if (!Validator.isUrl(value)) throw CustomError("Invalid input 'Product Picture'");
    this.picture = value;
  }
  set _type(value) {
    if (!Validator.isUrl(value) && !Validator.isString(value, 1, 150))
      throw CustomError("Invalid input 'Product Type'");
    this.type = value;
  }
  set _size(value) {
    if (!Validator.isString(value, 1, 250)) throw CustomError("Invalid input 'Product Size'");
    this.size = value;
  }
  set _price(value) {
    if (!Validator.isNumber(value, 0.1)) throw CustomError("Invalid input 'Product Price'");
    this.price = Number.parseInt(value);
  }
  set _shippingCost(value) {
    if (!Validator.isNumber(value, 0)) throw CustomError("Invalid input 'Product Shipping Cost'");
    this.shippingCost = Number.parseInt(value);
  }
  set _quantity(value) {
    if (!Validator.isNumber(value, 1)) throw CustomError("Invalid input 'Product Quantity'");
    this.quantity = value;
  }
}

module.exports = SoldItem;

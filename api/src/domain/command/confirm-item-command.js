const { Validator, Formatter, CustomError } = require("k-utilities");

class ConfirmItemCommand {
  constructor(item) {
    this.owner = item.owner;
    this._itemId = item.itemId || item.itemid;
    this._orderId = item.orderId || item.orderid;
    this.deliveryDate = Formatter.dateToString(new Date());
  }

  set _itemId(value) {
    if (!Validator.isString(value, 3)) throw new CustomError("Invalid input 'Item ID'");
    this.itemId = value;
  }
  set _orderId(value) {
    if (!Validator.isString(value, 3)) throw new CustomError("Invalid input 'Order ID'");
    this.orderId = value;
  }
}
module.exports = ConfirmItemCommand;

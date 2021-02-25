const { Formatter } = require("k-utilities");

class ConfirmOrderDeliveryCommand {
  constructor(owner, item) {
    this.buyerId = owner || "";
    this.itemId = item;
    this.deliveryDate = Formatter.dateToString(new Date());
  }
}
module.exports = ConfirmOrderDeliveryCommand;

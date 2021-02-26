const { Formatter } = require("k-utilities");

class ConfirmOrderDeliveryCommand {
  constructor(owner, soldItemId) {
    this.buyerId = owner || "";
    this.itemId = soldItemId;
    this.deliveryDate = Formatter.dateToString(new Date());
  }
}
module.exports = ConfirmOrderDeliveryCommand;

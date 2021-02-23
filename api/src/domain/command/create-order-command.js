class CreateOrderCommand {
  constructor(owner, addressId, paymentId, paymentMethod, total, currency, note) {
    this.id = paymentId;
    this.owner = owner;
    this.addressId = addressId;
    this.paymentMethod = paymentMethod;
    this.total = total;
    this.currency = currency;
    this.orderDate = null;
    this.completed = 0;
    this.note = note || "";
  }
}

module.exports = CreateOrderCommand;

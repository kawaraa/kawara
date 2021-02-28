class CreateOrderCommand {
  constructor(owner, addressId, paymentId, paymentMethod, total, currency, note) {
    this.id = paymentId;
    this.owner = owner;
    this.addressId = addressId;
    this.paymentMethod = paymentMethod;
    this.total = total;
    this.currency = currency;
    this.completed = 0;
  }
}

module.exports = CreateOrderCommand;

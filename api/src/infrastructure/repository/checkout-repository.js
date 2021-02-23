class CheckoutRepository {
  constructor(mySqlProvider) {
    this.mySqlProvider = mySqlProvider;
    this.error = "This item can not be shipped to xx (!)";
  }

  async checkItem(item, country) {
    const { productNumber, name, type, size } = item;
    const query = `SELECT t2.price, t3.cost AS shippingCost, t3.country FROM store.product t1 JOIN store.type t2 ON t1.number = t2.productNumber JOIN store.shipping t3 ON t1.number = t3.productNumber WHERE t1.number = ? AND t1.name = ? AND t2.type = ? AND t2.size = ? GROUP BY t3.country`;

    const products = await this.mySqlProvider.query(query, [productNumber, name, type, size, country]);
    if (!products[0]) throw new Error("Invalid input item (!)");

    const product = products.find((product) => product.country === country);
    if (!product) throw new Error(this.error.replace("xx", country));

    item.price = product.price;
    item.shippingCost = product.shippingCost;
    return item;
  }

  async createSoldItems(soldItems) {
    const marks = (arr) => "(?),".repeat(arr.length).slice(0, -1);
    const soldItemValues = [];

    soldItems.forEach((t) => {
      const { id, orderId, productNumber, name, picture, type, size, price, shippingCost, quantity } = t;
      let v = [id, orderId, null, productNumber, name, picture, type, size, price, shippingCost, quantity];
      soldItemValues.push(v);
    });

    const query = `INSERT INTO store.soldItem (id, orderId, shipmentId, productNumber, name, picture, type, size, price, shippingCost, quantity) VALUES`;

    await this.mySqlProvider.query(query + marks(soldItemValues), soldItemValues);
  }

  async createAddress(address) {
    await this.mySqlProvider.query(`INSERT INTO user.address SET ?`, address);
  }

  async createOrder(order) {
    await this.mySqlProvider.query(`INSERT INTO store.order SET ?`, order);
  }

  async confirmPayment(orderId) {
    await this.mySqlProvider.query(`UPDATE store.order SET completed = 1 WHERE id = ?`, orderId);
  }
  async setPaymentError(orderId, error) {
    await this.mySqlProvider.query(`UPDATE store.order SET note = ? WHERE id = ?`, [error, orderId]);
  }
  async getPayment(orderId) {
    const result = await this.mySqlProvider.query(`SELECT total FROM store.order WHERE id = ?`, orderId);
    return result[0];
  }
}

module.exports = CheckoutRepository;

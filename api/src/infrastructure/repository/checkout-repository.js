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
    const query = `INSERT INTO store.soldItem VALUES ${marks(soldItemValues)}`;
    await this.mySqlProvider.query(query, soldItemValues);
  }

  async createAddress(address) {
    await this.mySqlProvider.query(`INSERT INTO user.address SET ?`, address);
  }

  async createOrder(order) {
    await this.mySqlProvider.query(`INSERT INTO store.order SET ?`, order);
  }

  async confirmPayment(orderId) {
    await this.mySqlProvider.query(`UPDATE store.order SET completed = 1 WHERE id = ?`, orderId);
    return this.getOrder(orderId);
  }
  async setPaymentError(orderId, error) {
    await this.mySqlProvider.query(`UPDATE store.order SET note = ? WHERE id = ?`, [error, orderId]);
  }

  async getOrder(orderId) {
    let query = `SELECT t1.total, t2.fullName, t2.street, t2.city, t2.postalCode, t2.state, t2.country, t2.email FROM store.order t1 JOIN user.address t2 ON t2.id = t1.addressId WHERE t1.id = ?`;
    const orderResult = await this.mySqlProvider.query(query, orderId);

    query = `SELECT name, picture, productNumber, quantity, type, size, price, shippingCost, (price + shippingCost) * quantity AS total FROM store.soldItem WHERE orderId = ?`;
    orderResult[0].items = await this.mySqlProvider.query(query, orderId);

    return orderResult[0];
  }
}

module.exports = CheckoutRepository;

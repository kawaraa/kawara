const { Formatter, CustomError } = require("k-utilities");

class CheckoutRepository {
  constructor(mySqlProvider) {
    this.mySqlProvider = mySqlProvider;
    this.error = "Sorry there are items can not be shipped to xx";
  }

  async checkItem(item, country) {
    const { productNumber, name, type, size } = item;
    const query = `SELECT t1.pictures, t2.price, t3.cost AS shippingCost, t3.country FROM store.product t1 JOIN store.type t2 ON t1.number = t2.productNumber JOIN store.shipping t3 ON t1.number = t3.productNumber WHERE t1.number = ? AND t1.name = ? AND t2.type = ? AND t2.size = ? GROUP BY t3.country`;

    const products = await this.mySqlProvider.query(query, [productNumber, name, type, size, country]);
    if (!products[0]) throw new CustomError("Invalid input item");

    if (products[0].country != country) throw new CustomError(this.error.replace("xx", country));

    item.picture = Formatter.stringToArray(products[0].pictures)[0];
    item.price = products[0].price;
    item.shippingCost = products[0].shippingCost;
    return item;
  }

  async createSoldItems(soldItems) {
    const marks = (arr) => "(?),".repeat(arr.length).slice(0, -1);
    const soldItemValues = [];

    soldItems.forEach((item) => {
      const { id, orderId, productNumber, name, picture, type, size, price, shippingCost, quantity } = item;
      let v = [id, orderId, null, productNumber, name, picture, type, size, price, shippingCost, quantity];
      soldItemValues.push(v);
    });
    const query = `INSERT INTO store.soldItem VALUES ${marks(soldItemValues)}`;
    await this.mySqlProvider.query(query, soldItemValues);
  }

  async createAddress(address) {
    const { id, owner, email, phone, fullName, street, city, postalCode, state, country } = address;

    const query = `SELECT id FROM user.address WHERE owner = ? AND email LIKE '%${email}%' AND phone LIKE '%${phone}%' AND fullName LIKE '%${fullName}%' AND street LIKE '%${street}%' AND city LIKE '%${city}%' AND postalCode LIKE '%${postalCode}%' AND state LIKE '%${state}%' AND country LIKE '%${country}%' `;
    const addressResult = await this.mySqlProvider.query(query, owner);

    if (addressResult[0]) return addressResult[0].id;
    await this.mySqlProvider.query(`INSERT INTO user.address SET ?`, address);
    return id;
  }

  async createOrder(order) {
    await this.mySqlProvider.query(`INSERT INTO store.order SET ?`, order);
  }

  async confirmPayment(orderId) {
    let query = `SELECT t1.orderId, t2.number, t1.type, t1.size, (SELECT SUM(quantity) FROM store.soldItem WHERE orderId = t1.orderId AND productNumber = t2.number) AS quantity FROM store.soldItem t1 JOIN store.product t2 ON t2.number = t1.productNumber WHERE t1.orderId = ? GROUP BY t2.number`;
    const soldItems = await this.mySqlProvider.query(query, orderId);
    await Promise.all(
      soldItems.map(({ quantity, number, type, size }) => {
        query = `UPDATE store.type SET inStock = inStock - ? WHERE productNumber = ? AND type = ? AND size = ?`;
        return this.mySqlProvider.query(query, [quantity, number, type, size]);
      })
    );
    await this.mySqlProvider.query(`UPDATE store.order SET completed = 1 WHERE id = ?`, orderId);
    return this.getOrder(orderId);
  }
  async setPaymentError(orderId, error) {
    console.log({ orderId, error });
    const log = { owner: orderId, content: error, type: "payment-error" };
    await this.mySqlProvider.query(`REPLACE INTO archive.log SET ?`, log);
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

const { CustomError } = require("k-utilities");

class CustomerRepository {
  constructor(mySqlProvider) {
    this.mySqlProvider = mySqlProvider;
  }

  async createContact(contact) {
    await this.mySqlProvider.query(`INSERT INTO user.contact SET ?`, contact);
  }

  async confirmOrderDelivery({ buyerId, itemId, deliveryDate }) {
    const marks = (arr) => "(?),".repeat(arr.length).slice(0, -1);

    let query = `SELECT t2.owner, t1.shipmentId, t4.deliveryDate FROM store.soldItem t1 JOIN store.product t2 ON t2.number = t1.productNumber JOIN store.order t3 ON t3.id = t1.orderId JOIN store.shipment t4 ON t4.id = t1.shipmentId WHERE t4.id = ? AND t3.owner = ?`;

    const itemResult = await this.mySqlProvider.query(query, [itemId, buyerId]);
    if (!itemResult[0]) throw new CustomError("Looks like there is no items to confirm ");

    if (itemResult[0].deliveryDate) throw new CustomError("The items delivery is already confirmed");

    query = `UPDATE store.shipment SET deliveryDate = ? WHERE id = ?`;
    await this.mySqlProvider.query(query, [deliveryDate, itemResult[0].shipmentId]);

    query = `SELECT id FROM store.soldItem WHERE shipmentId = ?`;
    const items = await this.mySqlProvider.query(query, itemResult[0].shipmentId);

    const values = items.map((item) => [itemResult[0].owner, item.id, 0, null]);
    query = `INSERT INTO store.sale (owner, soldItemId, payout, payoutDate) VALUES ${marks(values)}`;
    await this.mySqlProvider.query(query, values);
  }

  async rateUs(starRating) {
    await this.mySqlProvider.query(`REPLACE INTO store.starRating SET ?`, starRating);
  }
}

module.exports = CustomerRepository;

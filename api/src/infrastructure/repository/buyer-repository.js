const { CustomError } = require("k-utilities");

class BuyerRepository {
  constructor(mySqlProvider) {
    this.mySqlProvider = mySqlProvider;
  }

  getOrders({ owner, limit, offset, searchText, sortBy, status }) {
    let search = !searchText ? "" : `AND t1.name LIKE %${searchText}%`;
    let query = `SELECT t1.id AS itemId, t1.name, t1.picture, t1.productNumber, t1.quantity, t1.type, t1.size, t1.price, t1.shippingCost, t2.id, t2.orderDate, t1.shipmentId AS shippingDate, t3.fullName, t3.street, t3.city, t3.postalCode, t3.state, t3.country FROM store.soldItem t1 JOIN store.order t2 ON t2.id = t1.orderId JOIN user.address t3 ON t3.id = t2.addressId WHERE t2.completed = 1 AND t2.owner = ? AND t1.shipmentId IS NULL ${search} ORDER BY t2.orderDate ${sortBy} LIMIT ? OFFSET ?`;

    if (status === "shipped") {
      query = `SELECT t1.id AS itemId, t1.name, t1.picture, t1.productNumber, t1.quantity, t1.type, t1.size, t1.price, t1.shippingCost, t2.id, t2.orderDate, t3.fullName, t3.street, t3.city, t3.postalCode, t3.state, t3.country, t4.shippingDate, t4.carrier, t4.trackNumber FROM store.soldItem t1 JOIN store.order t2 ON t2.id = t1.orderId JOIN user.address t3 ON t3.id = t2.addressId JOIN store.shipment t4 ON t4.id = t1.shipmentId WHERE t2.completed = 1 AND t2.owner = ? AND t4.deliveryDate IS NULL ${search} ORDER BY t4.shippingDate ${sortBy} LIMIT ? OFFSET ?`;
    } else if (status === "delivered") {
      query = `SELECT t1.id AS itemId, t1.name, t1.picture, t1.productNumber, t1.quantity, t1.type, t1.size, t1.price, t1.shippingCost, t2.id, t2.orderDate, t3.fullName, t3.street, t3.city, t3.postalCode, t3.state, t3.country, t4.shippingDate, t4.deliveryDate, t4.carrier, t4.trackNumber FROM store.soldItem t1 JOIN store.order t2 ON t2.id = t1.orderId JOIN user.address t3 ON t3.id = t2.addressId JOIN store.shipment t4 ON t4.id = t1.shipmentId WHERE t2.completed = 1 AND t2.owner = ? AND t4.deliveryDate IS NOT NULL ${search} ORDER BY t4.deliveryDate ${sortBy} LIMIT ? OFFSET ?`;
    }

    return this.mySqlProvider.query(query, [owner, limit, offset]);
  }

  async confirmItemDelivery({ buyerId, itemId, deliveryDate }) {
    let query = `SELECT t2.owner, t1.shipmentId, t4.deliveryDate FROM store.soldItem t1 JOIN store.product t2 ON t2.number = t1.productNumber JOIN store.order t3 ON t3.id = t1.orderId JOIN store.shipment t4 ON t4.id = t1.shipmentId WHERE t1.id = ? AND t3.owner = ?`;
    const itemResult = await this.mySqlProvider.query(query, [itemId, buyerId]);
    if (!itemResult[0]) throw new CustomError("Unauthorized operation");
    if (itemResult[0].deliveryDate) throw new CustomError("The items delivery is already confirmed");

    query = `UPDATE store.shipment SET deliveryDate = ? WHERE id = ?`;
    await this.mySqlProvider.query(query, [deliveryDate, itemResult[0].shipmentId]);

    const sale = { owner: itemResult[0].owner, soldItemId: itemId, payout: 0, payoutDate: null };

    await this.mySqlProvider.query(`INSERT INTO store.sale SET ?`, sale);
  }
}

module.exports = BuyerRepository;

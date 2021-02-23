const { Formatter, CustomError } = require("k-utilities");

class AdminRepository {
  constructor(mySqlProvider) {
    this.mySqlProvider = mySqlProvider;
    this.fee = env.fee;
  }

  async getAccounts({ type, limit, offset, searchText }) {
    const search = !searchText ? "" : `AND fullName LIKE %${searchText}%`;
    let query = `SELECT id, CONCAT(firstName, ' ', lastName) AS fullName, email, created, confirmed FROM user.account WHERE type = ? ${search} ORDER BY created DESC LIMIT ? OFFSET ?`;
    return await this.mySqlProvider.query(query, [type, limit, offset]);
  }

  async getBanks({ status, limit, offset, searchText, sortBy }) {
    const search = !searchText ? "" : `AND accountHolder LIKE %${searchText}%`;
    let query = `SELECT owner AS ownerId, accountHolder AS ownerName, country, type, routingNumber, accountNumber, bic, status, created FROM user.bank WHERE status = ? ${search} ORDER BY created ${sortBy} LIMIT ? OFFSET ?`;
    return await this.mySqlProvider.query(query, [status, limit, offset]);
  }
  async setConfirmationAmounts({ owner, amount1, amount2 }) {
    let query = `UPDATE user.bank SET status = 'pending', confirmationAmount1 = ?, confirmationAmount2 = ? WHERE owner = ?`;
    await this.mySqlProvider.query(query, [amount1, amount2, owner]);
  }
  async getProducts({ limit, offset, searchText }) {
    const search = !searchText ? "" : `AND t1.name LIKE %${searchText}%`;
    let query = `SELECT t1.number, t1.name, source, t1.owner, CONCAT(t2.firstName, ' ', t2.lastName) AS fullName, t2.confirmed AS accountConfirmed FROM store.product t1 JOIN user.account t2 ON t1.owner = t2.id WHERE t1.reviewed = 0 ${search} ORDER BY t1.created DESC LIMIT ? OFFSET ?`;
    return await this.mySqlProvider.query(query, [limit, offset]);
  }

  async notShippedOrders({ limit, offset, searchText, sortBy }) {
    const search = !searchText ? "" : `AND t2.name LIKE %${searchText}%`;
    let query = `SELECT t1.owner, t1.id AS id, t1.orderDate, t2.fullName, t2.street, t2.city, t2.postalCode, t2.state, t2.country, t2.email, t2.phone FROM store.order t1 JOIN user.address t2 ON t2.id= t1.addressId WHERE t1.id IN (SELECT t2.orderId FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber WHERE t2.shipmentId IS NULL ${search}) AND t1.completed = 1 ORDER BY t1.orderDate ${sortBy} LIMIT ? OFFSET ?`;

    const orders = await this.mySqlProvider.query(query, [limit, offset]);

    query = `SELECT t1.owner AS sellerId, t2.id, t2.name, t2.picture, t2.productNumber, t2.quantity, t2.type, t2.size FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber WHERE t2.shipmentId IS NULL AND t2.orderId = ?`;

    await Promise.all(orders.map(async (odr) => (odr.items = await this.mySqlProvider.query(query, odr.id))));
    return orders;
  }

  async shippedOrders({ limit, offset, searchText, sortBy }) {
    const search = !searchText ? "" : `AND t3.name LIKE %${searchText}%`;
    let query = `SELECT t1.owner, t1.id AS id, t1.orderDate, t2.fullName, t2.street, t2.city, t2.postalCode, t2.state, t2.country, t2.email, t2.phone, t4.shippingDate, t4.carrier, t4.trackNumber FROM store.order t1 JOIN user.address t2 ON t2.id = t1.addressId JOIN store.soldItem t3 ON t3.orderId = t1.id JOIN store.shipment t4 ON t4.id = t3.shipmentId WHERE t4.deliveryDate IS NULL ${search} AND t1.completed = 1 ORDER BY t4.shippingDate ${sortBy} LIMIT ? OFFSET ?`;

    const orders = await this.mySqlProvider.query(query, [limit, offset]);

    query = `SELECT t1.owner AS sellerId, t2.id, t2.name, t2.picture, t2.productNumber, t2.quantity, t2.type, t2.size FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber JOIN store.shipment t3 ON t3.id = t2.shipmentId WHERE t2.orderId = ?`;

    await Promise.all(orders.map(async (odr) => (odr.items = await this.mySqlProvider.query(query, odr.id))));
    return orders;
  }

  async confirmItemDelivery({ itemId, orderId, deliveryDate }) {
    let query = `SELECT t1.shipmentId, t2.owner AS productOwner FROM store.soldItem t1 JOIN store.product t2 ON t1.productNumber = t2.number JOIN store.order t3 ON t1.orderId = t3.id WHERE t1.id = ? AND t3.id = ?`;
    const itemResult = await this.mySqlProvider.query(query, [itemId, orderId]);
    const { shipmentId, productOwner } = itemResult[0];

    query = `UPDATE store.shipment SET deliveryDate = ? WHERE id = ?`;
    await this.mySqlProvider.query(query, [deliveryDate, shipmentId]);

    const sale = { owner: productOwner, soldItemId: itemId, payout: 0, payoutDate: null };

    await this.mySqlProvider.query(`INSERT INTO store.sale SET ?`, sale);
  }

  async getSales({ limit, offset, searchText, payout }) {
    const search = !searchText ? "" : `AND t1.name LIKE %${searchText}%`;
    payout = payout == "true" ? "NOT NULL" : "NULL";

    let query = `SELECT t1.picture, t1.price, t1.shippingCost, t1.quantity FROM store.soldItem t1 JOIN store.shipment t2 ON t2.id = t1.shipmentId JOIN store.sale t3 ON t3.soldItemId = t1.id WHERE t3.payoutDate IS ${payout} ${search} ORDER BY t2.deliveryDate LIMIT ? OFFSET ?`;

    const sales = await this.mySqlProvider.query(query, [limit, offset]);
    sales.forEach((sale) => {
      sale.fee = (((sale.price + sale.shippingCost) * sale.quantity) / 10) * this.fee;
      sale.payout = (sale.price + sale.shippingCost) * sale.quantity - sale.fee;
    });

    query = `SELECT SUM((t1.price + t1.shippingCost) * t1.quantity) AS sold, SUM(payout) AS paidOut FROM store.soldItem t1 JOIN store.sale t2 ON t2.soldItemId = t1.id`;
    const balance = await this.mySqlProvider.query(query);
    let { sold, paidOut } = balance[0];
    if (!sold) sold = 0;
    if (!paidOut) paidOut = 0;
    const fee = (sold / 10) * this.fee;
    return { sold, fee, paidOut, payouts: sold - (fee + paidOut), items: sales };
  }

  async markProductAsReviewedAccounts(productNumber) {
    const query = `UPDATE store.product SET reviewed = 1 WHERE number = ?`;
    await this.mySqlProvider.query(query, productNumber);
  }

  async getPayouts({ limit, offset, searchText }) {
    //  const search = !searchText ? "" : `AND t1.firstName LIKE %${searchText}% OR  t1.lastName LIKE %${searchText}%`;
    let query = `SELECT id AS sellerId, CONCAT(firstName, ' ', lastName) AS sellerName FROM user.account t1 JOIN store.sale t2 ON t2.owner = t1.id WHERE t2.payout = 0 AND t2.payoutDate IS NULL GROUP BY sellerId LIMIT ? OFFSET ?`;
    const sellers = await this.mySqlProvider.query(query, [limit, offset]);

    query = `SELECT SUM((t1.price + t1.shippingCost) * t1.quantity) AS sales, SUM(t1.quantity) AS sold FROM store.soldItem t1 JOIN store.sale t2 ON t1.id = t2.soldItemId WHERE t2.payout = 0 AND t2.owner = ?`;

    const bankQuery = `SELECT country, type, accountHolder, routingNumber, accountNumber, bic, status, created FROM user.bank WHERE owner = ?`;

    return Promise.all(
      sellers.map(async (seller) => {
        const sellerSales = await this.mySqlProvider.query(query, seller.sellerId);
        const bankResult = await this.mySqlProvider.query(bankQuery, seller.sellerId);
        const { sales, sold } = sellerSales[0];

        seller.sold = sold;
        seller.sales = sales;
        seller.fee = (sales / 10) * this.fee;
        seller.payout = sales - seller.fee;
        seller.bank = bankResult[0] ? bankResult[0] : null;
        return seller;
      })
    );
  }

  async makePayout(owner) {
    const todayDate = Formatter.dateToString(new Date());

    const bank = await this.mySqlProvider.query(`SELECT status FROM user.bank WHERE owner = ?`, owner);
    if (!bank[0]) throw new CustomError("The seller has no payment method yet");
    if (bank[0].status !== "confirmed") throw new CustomError("The seller's payment must be confirmed");

    let query = `SELECT * FROM store.sale WHERE payoutDate IS NULL AND owner = ?`;
    const sales = await this.mySqlProvider.query(query, owner);

    query = `UPDATE store.sale SET payout = ?, payoutDate = ? WHERE owner = ? AND soldItemId = ?`;

    return Promise.all(
      sales.map((sale) => {
        const total = sale.price + sale.shippingCost;
        const values = [total - (total / 10) * this.fee, todayDate, owner, sale.soldItemId];
        return this.mySqlProvider.query(query, values);
      })
    );
  }
}

module.exports = AdminRepository;

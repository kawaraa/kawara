const { Formatter, CustomError, Hashing } = require("k-utilities");

class DeleteAccountAndProductHandler {
  constructor(mySqlProvider, storageProvider) {
    this.mySqlProvider = mySqlProvider;
    this.storageProvider = storageProvider;
    this.config = env.DeleteAccountAndProductHandler;
    this.hashing = new Hashing();
  }
  async deleteAccount({ id, password }) {
    password = this.hashing.hash(password);

    let query = `SELECT * FROM user.account WHERE id = ? AND password =?`;
    const result = await this.mySqlProvider.query(query, [id, password]);
    if (!result[0]) throw new CustomError("Invalid input 'Password'");

    query = `SELECT t1.number FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber WHERE t1.owner = ? AND t2.shipmentId IS NULL`;
    const notShippedItems = await this.mySqlProvider.query(query, id);

    if (notShippedItems[0]) throw new CustomError(this.config.notShippedItemError);

    query = `SELECT t3.deliveryDate FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber JOIN store.shipment t3 ON t3.id = t2.shipmentId WHERE t1.owner = ? AND t3.deliveryDate IS NULL`;
    const notDeliveredItems = await this.mySqlProvider.query(query, id);
    if (notDeliveredItems[0]) throw new CustomError(this.config.notDeliveredItemError);

    query = `SELECT SUM((t1.price + t1.shippingCost) * t1.quantity) AS balance FROM store.soldItem t1 JOIN store.sale t2 ON t1.id = t2.soldItemId WHERE t2.owner = ? AND t2.payout = 0`;
    const balance = await this.mySqlProvider.query(query, id);
    if (balance[0] && balance[0].balance > 0) throw new CustomError(this.config.balanceRemainError);

    const products = await this.mySqlProvider.query(`SELECT number FROM store.product WHERE owner = ?`, id);
    await Promise.all(products.map((p) => this.deleteProduct(id, p.number)));

    await this.mySqlProvider.query(`DELETE FROM user.bank WHERE owner = ?`, id);
    await this.mySqlProvider.query(`DELETE FROM user.address WHERE owner = ?`, id);
    await this.mySqlProvider.query(`DELETE FROM user.account WHERE id = ?`, id);
  }

  async deleteProduct(owner, productNumber) {
    let query = `SELECT number FROM store.product WHERE owner = ? AND number = ? `;
    let product = await this.mySqlProvider.query(query, [owner, productNumber]);
    if (!product[0]) throw new CustomError("Unauthorized operation");

    query = `SELECT t1.number FROM store.product t1 JOIN store.soldItem t2 ON t2.productNumber = t1.number WHERE t1.owner = ? AND t1.number = ? AND t2.shipmentId IS NULL`;
    product = await this.mySqlProvider.query(query, [owner, productNumber]);
    if (product[0]) {
      throw new CustomError("Sorry, you can delete this product, it has been ordered but not shipped yet");
    }

    query = `SELECT t1.number FROM store.product t1 JOIN store.soldItem t2 ON t2.productNumber = t1.number JOIN store.shipment t3 ON t3.id = t2.shipmentId WHERE t1.owner = ? AND t1.number = ? AND t3.deliveryDate IS NULL`;
    product = await this.mySqlProvider.query(query, [owner, productNumber]);
    if (product[0]) throw new CustomError("Sorry, you can delete this product, it's still not delivered yet");

    query = `SELECT t3.deliveryDate FROM store.product t1 JOIN store.soldItem t2 ON t2.productNumber = t1.number JOIN store.shipment t3 ON t3.id = t2.shipmentId JOIN store.sale t4 ON t4.soldItemId = t2.id WHERE t1.owner = ? AND t1.number = ? AND t4.payout = 0 ORDER BY t3.deliveryDate DESC LIMIT 1 OFFSET 0`;
    product = await this.mySqlProvider.query(query, [owner, productNumber]);
    if (product[0]) throw new CustomError(this.config.deleteProductPeriodError);

    query = `SELECT pictures, video FROM store.product WHERE number = ?`;
    let picturesUrls = await this.mySqlProvider.query(query, productNumber);
    if (picturesUrls[0].video) picturesUrls[0].pictures += picturesUrls[0].video;
    picturesUrls = Formatter.stringToArray(picturesUrls[0].pictures);

    await Promise.all(
      picturesUrls.map(async (url) => {
        const res = await this.storageProvider.storage.file(url.replace(this.config.domain, ""));
        if ((await res.exists())[0]) res.delete();
      })
    );

    query = `DELETE FROM store.product WHERE number = ?`;
    await this.mySqlProvider.query(query, productNumber);

    query = `DELETE FROM store.type WHERE productNumber = ?`;
    await this.mySqlProvider.query(query, productNumber);

    query = `DELETE FROM store.shipping WHERE productNumber = ?`;
    await this.mySqlProvider.query(query, productNumber);

    query = `DELETE FROM store.specification WHERE productNumber = ?`;
    await this.mySqlProvider.query(query, productNumber);

    query = `DELETE FROM store.soldItem WHERE productNumber = ?`;
    await this.mySqlProvider.query(query, productNumber);

    query = `DELETE FROM store.category WHERE productNumber = ?`;
    await this.mySqlProvider.query(query, productNumber);

    query = `DELETE FROM store.subCategory WHERE productNumber = ?`;
    await this.mySqlProvider.query(query, productNumber);

    query = `DELETE FROM store.starRating WHERE item = ?`;
    await this.mySqlProvider.query(query, productNumber);
  }
}

module.exports = DeleteAccountAndProductHandler;

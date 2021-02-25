class SellerRepository {
  constructor(mySqlProvider) {
    this.mySqlProvider = mySqlProvider;
    this.fee = env.fee;
  }

  async createProduct(product) {
    let { owner, number, name, pictures, video, description, source, category, specifications } = product;
    const values = [owner, number, name, pictures, video, description, source, null, 0];
    const marks = (arr) => "(?),".repeat(arr.length).slice(0, -1);

    let query = `INSERT INTO store.product VALUES(?,?,?,?,?,?,?,?,?)`;

    await this.mySqlProvider.query(query, values);

    let specs = specifications.map(({ title, description }) => [number, title, description]);
    query = `INSERT INTO store.specification (productNumber, title, description) VALUES ${marks(specs)}`;

    await this.mySqlProvider.query(query, specs);

    const typesValues = [];
    product.types.forEach(({ type, sizes }) => {
      sizes.forEach(({ size, price, inStock }) => typesValues.push([number, type, size, price, inStock]));
    });

    query = `INSERT INTO store.type (productNumber, type, size, price, inStock) VALUES ${marks(typesValues)}`;
    await this.mySqlProvider.query(query, typesValues);

    const shippings = product.shippings.map(({ country, estimatedTime, cost }) => {
      query = `INSERT INTO store.shipping (productNumber, country, estimatedTime, cost) VALUES `;
      return [number, country, estimatedTime, cost];
    });
    await this.mySqlProvider.query(query + marks(shippings), shippings);

    query = `INSERT INTO store.category SET ?`;
    await this.mySqlProvider.query(query, { productNumber: number, name: category });

    return product;
  }

  async updateQuantity({ owner, number, type, size, quantity }) {
    let query = `SELECT number FROM store.product WHERE number = ? AND owner = ?`;
    const result = await this.mySqlProvider.query(query, [number, owner]);
    if (!result[0]) throw new Error("Unauthorized operation (!)");

    query = `UPDATE store.type SET inStock = ? WHERE productNumber = ? AND type = ? AND size = ?`;
    await this.mySqlProvider.query(query, [quantity, number, type, size]);
  }

  async delete(productNumber, owner) {
    let query = `SELECT number FROM store.product WHERE number = ? AND owner = ?`;
    const product = await this.mySqlProvider.query(query, [productNumber, owner]);
    if (!product[0]) throw new Error("Unauthorized operation (!)");

    query = `DELETE FROM store.product WHERE number = ? AND owner = ?`;
    await this.mySqlProvider.query(query, [productNumber, owner]);

    query = `DELETE FROM store.type WHERE productNumber = ?`;
    await this.mySqlProvider.query(query, [productNumber, owner]);

    query = `DELETE FROM store.shipping WHERE productNumber = ?`;
    await this.mySqlProvider.query(query, [productNumber, owner]);

    query = `DELETE FROM store.specification WHERE productNumber = ?`;
    await this.mySqlProvider.query(query, [productNumber, owner]);

    query = `DELETE FROM store.category WHERE productNumber = ?`;
    await this.mySqlProvider.query(query, [productNumber, owner]);

    query = `DELETE FROM store.subCategory WHERE productNumber = ?`;
    await this.mySqlProvider.query(query, [productNumber, owner]);

    query = `DELETE FROM store.starRating WHERE item = ?`;
    await this.mySqlProvider.query(query, [productNumber, owner]);
  }

  async getProducts({ ownerId, limit, offset, searchText }) {
    const search = !searchText ? "" : `AND name LIKE %${searchText}%`;
    let query = `SELECT number, name, pictures, source, reviewed FROM store.product WHERE owner = ? ${search} ORDER BY created DESC LIMIT ? OFFSET ?`;
    const productsResult = await this.mySqlProvider.query(query, [ownerId, limit, offset]);
    if (!productsResult[0]) return [];

    query = `SELECT country, estimatedTime, cost FROM store.shipping WHERE productNumber = ?`;

    const products = await Promise.all(
      productsResult.map(async (product) => {
        product.picture = product.pictures.split(",")[0];
        delete product.pictures;
        product.types = await this.getProductTypes(product.number);
        product.shippings = await this.mySqlProvider.query(query, product.number);
        return product;
      })
    );
    return products;
  }
  async getProductTypes(productNumber) {
    const query = `SELECT type, size, inStock, price FROM store.type WHERE productNumber = ? ORDER BY price ASC`;
    const typesResult = await this.mySqlProvider.query(query, productNumber);
    const types = [];
    typesResult.forEach(({ type, size, price, inStock }) => {
      const t = types.find((t) => t.type === type);
      if (t) t.sizes.push({ size, price, inStock });
      else types.push({ type, sizes: [{ size, price, inStock }] });
    });
    return types;
  }

  async createShipment(shipment) {
    const productsOwner = shipment.productsOwner;
    const soldItemIds = shipment.soldItemIds;
    delete shipment.productsOwner;
    delete shipment.soldItemIds;

    let query = `SELECT number FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber WHERE owner = ? And t2.orderId = ?`;
    const res = await this.mySqlProvider.query(query, [productsOwner, shipment.orderId]);
    if (!res[0]) throw new Error("Unauthorized operation (!)");

    await this.mySqlProvider.query(`REPLACE INTO store.shipment SET ?`, shipment);

    query = `UPDATE store.soldItem SET shipmentId = ? WHERE id IN (?)`;
    await this.mySqlProvider.query(query, [shipment.id, soldItemIds]);

    query = `SELECT t1.id, t1.carrier, t1.trackNumber, t2.owner AS userId, t3.fullName, t3.street, t3.city, t3.postalCode, t3.state, t3.country, t3.email FROM store.shipment t1 JOIN store.order t2 ON t2.id = t1.orderId JOIN user.address t3 ON t3.id = t2.addressId WHERE t1.id = ?`;
    const shipmentResult = await this.mySqlProvider.query(query, shipment.id);

    query = `SELECT productNumber, name, picture, type, size, quantity FROM store.soldItem WHERE shipmentId = ?`;
    shipmentResult[0].items = await this.mySqlProvider.query(query, shipment.id);

    return shipmentResult[0];
  }

  async getNotShippedOrders({ sellerId, limit, offset, searchText, sortBy }) {
    let search = !searchText ? "" : `AND t2.name LIKE %${searchText}%`;
    let query = `SELECT t1.owner, t1.id AS id, t1.orderDate, t2.fullName, t2.street, t2.city, t2.postalCode, t2.state, t2.country, t2.email, t2.phone FROM store.order t1 JOIN user.address t2 ON t2.id= t1.addressId WHERE t1.id IN (SELECT t2.orderId FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber WHERE t1.owner = ? AND t2.shipmentId IS NULL ${search}) AND t1.completed = 1 ORDER BY t1.orderDate ${sortBy} LIMIT ? OFFSET ?`;

    const orders = await this.mySqlProvider.query(query, [sellerId, limit, offset]);

    query = `SELECT t1.owner AS sellerId, t2.id, t2.name, t2.picture, t2.productNumber, t2.quantity, t2.type, t2.size FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber WHERE t1.owner = ? AND t2.shipmentId IS NULL AND t2.orderId = ?`;

    await Promise.all(
      orders.map(async (odr) => (odr.items = await this.mySqlProvider.query(query, [sellerId, odr.id])))
    );
    return orders;
  }

  async getShippedOrders({ sellerId, limit, offset, searchText, sortBy }) {
    const search = !searchText ? "" : `AND t3.name LIKE %${searchText}%`;
    let query = `SELECT t1.owner, t1.id, t1.orderDate, t2.fullName, t2.street, t2.city, t2.postalCode, t2.state, t2.country, t2.email, t2.phone, t5.shippingDate, t5.carrier, t5.trackNumber FROM store.order t1 JOIN user.address t2 ON t2.id = t1.addressId JOIN store.soldItem t3 ON t3.orderId = t1.id JOIN store.product t4 ON t4.number = t3.productNumber JOIN store.shipment t5 ON t5.id = t3.shipmentId WHERE t4.owner = ? AND t1.completed = 1 AND t5.deliveryDate IS NULL ${search} ORDER BY t5.shippingDate ${sortBy} LIMIT ? OFFSET ?`;

    const orders = await this.mySqlProvider.query(query, [sellerId, limit, offset]);
    query = `SELECT t1.owner AS sellerId, t2.id, t2.name, t2.picture, t2.productNumber, t2.quantity, t2.type, t2.size FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber JOIN store.shipment t3 ON t3.id = t2.shipmentId WHERE t1.owner = ? AND t2.orderId = ?`;

    await Promise.all(
      orders.map(async (odr) => (odr.items = await this.mySqlProvider.query(query, [sellerId, odr.id])))
    );
    return orders;
  }

  async getSellerBalance(sellerId) {
    const balance = { sold: 0, fee: 0, total: 0 };
    let query = `SELECT SUM((t1.price + t1.shippingCost) * t1.quantity) AS sold FROM store.soldItem t1 JOIN store.sale t2 ON t1.id = t2.soldItemId WHERE t2.owner = ? AND t2.payout = 0`;

    const result = await this.mySqlProvider.query(query, sellerId);

    if (!result[0] || !result[0].sold) return balance;
    balance.sold = result[0].sold;
    balance.fee = (result[0].sold / 10) * this.fee;
    balance.total = result[0].sold - balance.fee;
    return balance;
  }

  async getSellerSales(sellerId) {
    let query = `SELECT t1.picture, t1.price, t1.shippingCost, t1.quantity FROM store.soldItem t1 JOIN store.shipment t2 ON t2.id = t1.shipmentId JOIN store.sale t3 ON t3.soldItemId = t1.id WHERE t3.owner = ? AND t3.payout = 0 AND t3.payoutDate IS NULL`;

    const sales = await this.mySqlProvider.query(query, sellerId);

    sales.forEach((sale) => {
      sale.fee = (((sale.price + sale.shippingCost) * sale.quantity) / 10) * this.fee;
      sale.payout = (sale.price + sale.shippingCost) * sale.quantity - sale.fee;
    });
    return sales;
  }

  async getSellerSalesHistory({ owner, limit, offset, searchText, sortBy }) {
    const search = !searchText ? "" : `AND t1.name LIKE %${searchText}%`;
    let query = `SELECT t1.picture, t1.price, t1.shippingCost, t1.quantity, t3.payoutDate FROM store.soldItem t1 JOIN store.shipment t2 ON t2.id = t1.shipmentId JOIN store.sale t3 ON t3.soldItemId = t1.id WHERE t3.owner = ? AND t3.payout > 0 AND t3.payoutDate IS NOT NULL ${search} ORDER BY t3.payoutDate ${sortBy} LIMIT ? OFFSET ?`;

    const salesHistory = await this.mySqlProvider.query(query, [owner, limit, offset]);

    salesHistory.forEach((sale) => {
      sale.fee = (((sale.price + sale.shippingCost) * sale.quantity) / 10) * this.fee;
      sale.received = (sale.price + sale.shippingCost) * sale.quantity - sale.fee;
    });
    return salesHistory;
  }
}

module.exports = SellerRepository;

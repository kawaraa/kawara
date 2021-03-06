const Product = require("../../domain/model/product");
const ProductDetails = require("../../domain/model/product-details");

class ProductRepository {
  constructor(mySqlProvider) {
    this.mySqlProvider = mySqlProvider;
  }
  async getProducts({ searchText, country, limit, offset }) {
    //  const values = ("%" + text + "% ").repeat(5).trim().split(" ");
    let search = !searchText ? "" : `AND MATCH(t1.name) AGAINST('${searchText}' IN NATURAL LANGUAGE MODE)`;
    let query = `SELECT t1.number, t1.name, t1.description, t1.pictures, t2.country, t2.estimatedTime, t2.cost, t3.type, t3.size, t3.price, (SELECT  AVG(stars) FROM store.starRating WHERE item = t1.number) AS stars, (SELECT SUM(quantity) FROM store.soldItem WHERE productNumber = t1.number) AS sold FROM store.product t1 JOIN store.shipping t2 ON t1.number = t2.productNumber JOIN store.type t3 ON t3.productNumber = t1.number WHERE t1.reviewed = 1 AND t2.country = ? AND t3.inStock > 0 ${search} GROUP BY t1.number LIMIT ? OFFSET ?`;

    const result = await this.mySqlProvider.query(query, [country, limit, offset]);
    return result.map((product) => new Product(product));
  }

  async rateProduct(starRating) {
    let query = `SELECT productNumber FROM store.soldItem WHERE shipmentId = ? GROUP BY productNumber`;
    const soldItems = await this.mySqlProvider.query(query, starRating.item);
    if (!soldItems[0]) await this.mySqlProvider.query(`REPLACE INTO store.starRating SET ?`, starRating);
    else {
      const marks = (arr) => "(?),".repeat(arr.length).slice(0, -1);
      const values = soldItems.map(({ productNumber }) => [starRating.user, productNumber, starRating.stars]);
      query = `REPLACE INTO store.starRating VALUES ${marks(values)}`;
      await this.mySqlProvider.query(query, values);
    }
  }

  async getProductByNumber(productNumber, user) {
    let query = `SELECT t1.owner, t1.number, t1.name, t1.description, t1.pictures, t1.created, t2.country, t2.estimatedTime, t2.cost, (SELECT  AVG(stars) FROM store.starRating WHERE item = t1.number) AS stars, (SELECT SUM(quantity) FROM store.soldItem WHERE productNumber = t1.number) AS sold FROM store.product t1 JOIN store.shipping t2 ON t1.number = t2.productNumber JOIN store.type t3 ON t3.productNumber = t1.number WHERE t1.reviewed > 0 AND t1.number = ? OR MATCH(t1.name) AGAINST('${productNumber}' IN NATURAL LANGUAGE MODE) AND t2.country = ? AND t3.inStock > 0 GROUP BY t1.number`;
    if (user.type == "seller" || user.type == "admin") {
      query = `SELECT t1.owner, t1.number, t1.name, t1.description, t1.pictures, t1.created, t2.country, t2.estimatedTime, t2.cost, (SELECT  AVG(stars) FROM store.starRating WHERE item = t1.number) AS stars, (SELECT SUM(quantity) FROM store.soldItem WHERE productNumber = t1.number) AS sold FROM store.product t1 JOIN store.shipping t2 ON t1.number = t2.productNumber JOIN store.type t3 ON t3.productNumber = t1.number WHERE t1.number = ? GROUP BY t1.number`;
    }

    const product = await this.mySqlProvider.query(query, [productNumber, user.country]);
    if (!product[0]) return null;

    query = `SELECT title, description FROM store.specification WHERE productNumber = ?`;
    const specifications = await this.mySqlProvider.query(query, product[0].number);

    const types = await this.getProductTypes(product[0].number);

    return new ProductDetails({ ...product[0], types, specifications });
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

  async getCollection(country) {
    const query = { country, searchText: "", limit: 20, offset: 0 };
    const healthBeauty = await this.getByCategory({ ...query, searchText: "health-beauty" });
    const jewelryWatches = await this.getByCategory({ ...query, searchText: "jewelry-watches" });
    const sports = await this.getByCategory({ ...query, searchText: "sports" });
    const hotSale = await this.getHotSale({ country, limit: 20, offset: 0 });
    const random = await this.getRandom({ country, limit: 20, offset: 0 });

    return [hotSale, healthBeauty, jewelryWatches, sports, random];
  }

  async getByCategory({ country, searchText, limit, offset }) {
    let query = `SELECT t1.number, t1.name, t1.description, t1.pictures, t2.country, t2.estimatedTime, t2.cost, t3.type, t3.size, t3.price, (SELECT  AVG(stars) FROM store.starRating WHERE item = t1.number) AS stars, (SELECT SUM(quantity) FROM store.soldItem WHERE productNumber = t1.number) AS sold FROM store.product t1 JOIN store.shipping t2 ON t1.number = t2.productNumber JOIN store.type t3 ON t3.productNumber = t1.number JOIN store.category t4 ON t4.productNumber = t1.number WHERE t1.reviewed = 1 AND t2.country = ? AND t4.name = ? AND t3.inStock > 0 GROUP BY t1.number LIMIT ? OFFSET ?`;

    const result = await this.mySqlProvider.query(query, [country, searchText, limit, offset]);
    const products = result.map((product) => new Product(product));

    return { products, name: products[0] ? searchText : "" };
  }

  async getHotSale({ country, limit, offset }) {
    const query = `SELECT t1.number, t1.name, t1.description, t1.pictures, t2.country, t2.estimatedTime, t2.cost, t3.type, t3.size, t3.price, (SELECT  AVG(stars) FROM store.starRating WHERE item = t1.number) AS stars, (SELECT SUM(quantity) FROM store.soldItem WHERE productNumber = t1.number) AS sold FROM store.product t1 JOIN store.shipping t2 ON t1.number = t2.productNumber JOIN store.type t3 ON t3.productNumber = t1.number JOIN store.category t4 ON t4.productNumber = t1.number WHERE t1.reviewed = 1 AND t2.country = ? AND t3.inStock > 0 GROUP BY t1.number ORDER BY sold DESC LIMIT ? OFFSET ?`;

    const result = await this.mySqlProvider.query(query, [country, limit, offset]);
    const products = result.map((product) => new Product(product));
    return { products, name: "hot-sale" };
  }
  async getRandom({ country, limit, offset }) {
    const query = `SELECT t1.number, t1.name, t1.description, t1.pictures, t2.country, t2.estimatedTime, t2.cost, t3.type, t3.size, t3.price, (SELECT  AVG(stars) FROM store.starRating WHERE item = t1.number) AS stars, (SELECT SUM(quantity) FROM store.soldItem WHERE productNumber = t1.number) AS sold FROM store.product t1 JOIN store.shipping t2 ON t1.number = t2.productNumber JOIN store.type t3 ON t3.productNumber = t1.number WHERE t1.reviewed = 1 AND t2.country = ? AND t3.inStock > 0 GROUP BY t1.number LIMIT ? OFFSET ?`;

    const result = await this.mySqlProvider.query(query, [country, limit, offset]);
    const products = result.map((product) => new Product(product));
    return { products, name: "explore" };
  }
}

module.exports = ProductRepository;

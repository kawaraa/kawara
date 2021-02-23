const Product = require("../../domain/model/product");
const ProductDetails = require("../../domain/model/product-details");

class ProductRepository {
  constructor(mySqlProvider) {
    this.mySqlProvider = mySqlProvider;
  }

  async rateProduct(starRating) {
    await this.mySqlProvider.query(`INSERT INTO store.starRating SET ?`, starRating);
  }

  async getProducts({ searchText, country, limit, offset }) {
    //  const values = ("%" + text + "% ").repeat(5).trim().split(" ");
    const search = !searchText ? "" : `AND t1.name LIKE %${searchText}%`;
    let query = `SELECT t1.number, t1.name, t1.description, t1.pictures, t2.country, t2.estimatedTime, t2.cost, (SELECT  AVG(stars) FROM store.starRating WHERE productNumber = t1.number) AS stars, (SELECT SUM(quantity) FROM store.soldItem WHERE productNumber = t1.number) AS sold, (SELECT type FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS type, (SELECT size FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS size, (SELECT price FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS price FROM store.product t1 JOIN store.shipping t2 ON t1.number = t2.productNumber WHERE t1.reviewed = 1 AND t2.country = ? ${search} LIMIT ? OFFSET ?`;

    const result = await this.mySqlProvider.query(query, [country, limit, offset]);
    return result.map((product) => new Product(product));
  }

  async getProductByNumber(productNumber, user) {
    let query = `SELECT owner, number, name, description, pictures, reviewed, (SELECT  AVG(stars) FROM store.starRating WHERE productNumber = number) AS stars, (SELECT SUM(quantity) FROM store.soldItem WHERE productNumber = number) AS sold FROM store.product WHERE number = ?`;

    const product = await this.mySqlProvider.query(query, productNumber);
    if (!product[0]) return null;
    if (product[0].reviewed === 0 && product[0].owner !== user.id && user.type !== "admin") return null;

    query = `SELECT title, description FROM store.specification WHERE productNumber = ?`;
    const specifications = await this.mySqlProvider.query(query, product[0].number);

    const types = await this.getProductTypes(product[0].number);

    query = `SELECT country, estimatedTime, cost FROM store.shipping WHERE productNumber = ? AND country = ?`;
    let shipping = await this.mySqlProvider.query(query, [product[0].number, user.country]);
    shipping = shipping[0] ? shipping[0] : {};

    return new ProductDetails({ ...product[0], types, ...shipping, specifications });
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
    const healthBeauty = await this.getByCategory({ ...query, searchText: "Health-Beauty" });
    const jewelryWatches = await this.getByCategory({ ...query, searchText: "Jewelry-Watches" });
    const sports = await this.getByCategory({ ...query, searchText: "Sports" });
    const hotSale = await this.getHotSale({ country, limit: 20, offset: 0 });
    const random = await this.getRandom({ country, limit: 20, offset: 0 });

    return [hotSale, healthBeauty, jewelryWatches, sports, random];
  }

  async getByCategory({ country, searchText, limit, offset }) {
    const query = `SELECT t1.number, t1.name, t1.description, t1.pictures, t2.country, t2.estimatedTime, t2.cost, (SELECT  AVG(stars) FROM store.starRating WHERE productNumber = t1.number) AS stars, (SELECT SUM(quantity) FROM store.soldItem WHERE productNumber = t1.number) AS sold,(SELECT type FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS type, (SELECT size FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS size, (SELECT price FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS price FROM store.product t1 JOIN store.shipping t2 ON t1.number = t2.productNumber JOIN store.category t3 ON t1.number = t3.productNumber WHERE t1.reviewed = 1 AND t2.country = ? AND t3.name = ? LIMIT ? OFFSET ?`;

    const result = await this.mySqlProvider.query(query, [country, searchText, limit, offset]);
    const products = result.map((product) => new Product(product));

    return { products, name: products[0] ? searchText : "" };
  }

  async getHotSale({ country, limit, offset }) {
    const query = `SELECT t1.number, t1.name, t1.description, t1.pictures, t2.country, t2.estimatedTime, t2.cost, (SELECT  AVG(stars) FROM store.starRating WHERE productNumber = t1.number) AS stars, (SELECT SUM(quantity) FROM store.soldItem WHERE productNumber = t1.number) AS sold, (SELECT type FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS type, (SELECT size FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS size, (SELECT price FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS price FROM store.product t1 JOIN store.shipping t2 ON t1.number = t2.productNumber WHERE t1.reviewed = 1 AND t2.country = ? ORDER BY sold DESC LIMIT ? OFFSET ?`;

    const result = await this.mySqlProvider.query(query, [country, limit, offset]);
    const products = result.map((product) => new Product(product));
    return { products, name: "Hot-Sale" };
  }
  async getRandom({ country, limit, offset }) {
    const query = `SELECT t1.number, t1.name, t1.description, t1.pictures, t2.country, t2.estimatedTime, t2.cost, (SELECT  AVG(stars) FROM store.starRating WHERE productNumber = t1.number) AS stars, (SELECT SUM(quantity) FROM store.soldItem WHERE productNumber = t1.number) AS sold, (SELECT type FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS type, (SELECT size FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS size, (SELECT price FROM store.type WHERE productNumber = t1.number ORDER BY price ASC LIMIT 1) AS price FROM store.product t1 JOIN store.shipping t2 ON t1.number = t2.productNumber WHERE t1.reviewed = 1 AND t2.country = ? LIMIT ? OFFSET ?`;

    const result = await this.mySqlProvider.query(query, [country, limit, offset]);
    const products = result.map((product) => new Product(product));
    return { products, name: "Explore" };
  }
}

module.exports = ProductRepository;

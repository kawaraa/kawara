const { CustomError } = require("k-utilities");
const SearchCriteria = require("../../domain/model/search-criteria");
const CategoryQuery = require("../../domain/model/category-query");
const StarRating = require("../../domain/model/star-rating");

class ProductResolver {
  constructor(server, firewall, productRepository) {
    this.server = server;
    this.firewall = firewall;
    this.productRepository = productRepository;
  }

  resolve() {
    this.server.use("/product", this.firewall.checkRequestInfo);
    this.server.get("/product", this.getProductsBySearchQuery.bind(this));
    this.server.get("/product/collection", this.getProductCollection.bind(this));
    this.server.get("/product/category/:search", this.getProductsByCategory.bind(this));
    this.server.get("/product/:number", this.getProductByNumber.bind(this));
    this.server.post("/product/rate", this.rateProduct.bind(this));
  }

  async getProductsBySearchQuery({ query, user: { country, currency, rate } }, response) {
    try {
      query = { ...new SearchCriteria(query), country };
      const products = await this.productRepository.getProducts(query);
      response.json({ currency, rate, products });
    } catch (error) {
      response.status(500).end(CustomError.toJson(error));
    }
  }

  async getProductByNumber({ user, params }, response) {
    try {
      const product = await this.productRepository.getProductByNumber(params.number, user);
      response.json({ currency: user.currency, rate: user.rate, product });
    } catch (error) {
      response.status(500).end(CustomError.toJson(error));
    }
  }

  async getProductCollection({ user: { country, currency, rate } }, response) {
    try {
      const collections = await this.productRepository.getCollection(country);
      response.json({ currency, rate, collections });
    } catch (error) {
      response.status(500).end(CustomError.toJson(error));
    }
  }

  async getProductsByCategory({ user, query, params }, response) {
    try {
      query = { ...new SearchCriteria({ ...query, ...params }), country: user.country };
      const category = await this.productRepository.getByCategory(query);
      category.currency = user.currency;
      category.rate = user.rate;
      response.json(category);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async rateProduct({ user: { id }, query: { user, item, rate }, country }, response) {
    try {
      await this.productRepository.rateProduct(new StarRating(user || id, item, rate));
      response.send({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
}

module.exports = ProductResolver;

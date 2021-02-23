const { Formatter } = require("k-utilities");
// Todos: change the currency based on the country
class Product {
  constructor(product) {
    this.number = product.number;
    this.name = product.name;
    this.type = product.type;
    this.size = product.size;
    this.description = product.description;
    this.pictures = Formatter.stringToArray(product.pictures);
    this.price = product.price;
    this.quantity = 1;
    this.country = product.country;
    this.estimatedTime = product.estimatedTime;
    this.shippingCost = product.cost;
    this.stars = product.stars || 0;
    this.sold = product.sold || 0;
  }
}
module.exports = Product;

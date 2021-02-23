const { Formatter } = require("k-utilities");

class ProductDetails {
  constructor(product) {
    this.number = product.number;
    this.name = product.name;
    this.description = product.description;
    this.pictures = Formatter.stringToArray(product.pictures);
    this.country = product.country;
    this.estimatedTime = product.estimatedTime;
    this.shippingCost = product.cost;
    this.stars = product.stars || 0;
    this.sold = product.sold || 0;
    this.specifications = product.specifications;
    this.types = product.types || [];
  }
}
module.exports = ProductDetails;

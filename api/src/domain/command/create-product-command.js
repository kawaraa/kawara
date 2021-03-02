const { Validator, Formatter, CustomError } = require("k-utilities");
const Specification = require("../model/specification");
const Type = require("../model/type");
const Shipping = require("../model/shipping");

class CreateProductCommand {
  constructor(product) {
    this.owner = product.owner;
    this.number = Formatter.newId();
    this._name = product.name;
    this.pictures = !product.pictureUrls ? "" : product.pictureUrls + ",";
    this.video = product.video || null;
    this._description = product.description;
    this._category = product.category;
    this.source = product.source;
    this._specifications = product.specifications;
    this._types = product.types;
    this._shippings = product.shippings;
  }

  set _name(value) {
    if (Validator.isString(value, 50, 250)) this.name = value;
    else throw new CustomError("Invalid input 'Product Name' length must be between 50 and 250 letters");
  }
  set _description(value) {
    if (Validator.isString(value, 50)) this.description = value;
    else throw new CustomError("Invalid input 'Product Description' length must be at least 50 letters");
  }
  set _category(value) {
    if (Validator.isString(value, 4, 50)) this.category = value;
    else this.category = "other";
  }
  set _specifications(value) {
    try {
      this.specifications = JSON.parse(value).map((specification) => new Specification(specification));
    } catch (error) {
      this.specifications = [];
    }
  }
  set _types(value) {
    try {
      this.types = JSON.parse(value).map((type) => new Type(type));
    } catch (error) {
      if (/\([!]+\)/i.test(error.message)) throw error;
      throw new CustomError("Invalid input 'Product Types' format");
    }
  }
  set _shippings(value) {
    try {
      this.shippings = JSON.parse(value).map((shipping) => new Shipping(shipping));
    } catch (error) {
      if (/\([!]+\)/i.test(error.message)) throw error;
      throw new CustomError("Invalid input 'Product Shippings' format");
    }
  }
}

module.exports = CreateProductCommand;

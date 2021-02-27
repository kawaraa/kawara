const CreateProductHandler = require("../../application/handler/create-product-handler");
const { CustomError, countries } = require("k-utilities");
const SearchCriteria = require("../../domain/model/search-criteria");
const UpdateQuantityCommand = require("../../domain/command/update-quantity-command");
const CreateShipmentCommand = require("../../domain/command/create-shipment-command");

class SellerResolver {
  constructor(server, firewall, sellerRepo, deleteProHandler, storageProvider, mailHandler, scrapeHandler) {
    this.server = server;
    this.firewall = firewall;
    this.sellerRepository = sellerRepo;
    this.deleteProductHandler = deleteProHandler;
    this.storageProvider = storageProvider;
    this.mailHandler = mailHandler;
    this.scrapeHandler = scrapeHandler;
    this.errorMessage = env.sellerResolver;
  }

  resolve() {
    this.server.use("/seller", this.firewall.checkRequestInfo, this.firewall.sellerRequired);
    this.server.post("/seller/product", this.createProduct.bind(this));
    this.server.post("/seller/scrape-product", this.scrapeProductUrl.bind(this));
    this.server.put("/seller/product", this.updateProductQuantity.bind(this));
    this.server.delete("/seller/product/:number", this.deleteProduct.bind(this));
    this.server.post("/seller/shipment", this.createShipment.bind(this));
    this.server.get("/seller/products", this.getProducts.bind(this));
    this.server.get("/seller/orders", this.getOrders.bind(this));
    this.server.get("/seller/shipments", this.getShipments.bind(this));
    this.server.get("/seller/balance", this.getBalance.bind(this));
    this.server.get("/seller/sales", this.getSales.bind(this));
    this.server.get("/seller/sales-history", this.getSalesHistory.bind(this));
  }

  async createProduct(request, response) {
    try {
      const confirmed = await this.sellerRepository.isAccountConfirmed(request.user.id);
      if (!confirmed) throw new CustomError(this.errorMessage);
      const handler = new CreateProductHandler(this.sellerRepository, this.storageProvider);
      const product = await handler.handle(request, response);
      response.json(product);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async scrapeProductUrl({ query }, response) {
    try {
      const scrapedProduct = await this.scrapeHandler.handle(query.url);
      response.json(scrapedProduct);
    } catch (error) {
      response.status(500).end(CustomError.toJson(error));
    }
  }
  async updateProductQuantity({ user, body }, response) {
    try {
      await this.sellerRepository.updateQuantity(new UpdateQuantityCommand({ ...body, owner: user.id }));
      response.json({ success: true });
    } catch (error) {
      response.status(500).end(CustomError.toJson(error));
    }
  }
  async deleteProduct({ user, params }, response) {
    try {
      await this.deleteProductHandler.deleteProduct(user.id, params.number);
      response.json({ success: true });
    } catch (error) {
      response.status(500).end(CustomError.toJson(error));
    }
  }
  async createShipment({ user, body }, response) {
    try {
      body.productOwner = user.id;
      const shipment = await this.sellerRepository.createShipment(new CreateShipmentCommand(body));
      this.mailHandler.sendShipmentEmail(shipment);
      response.json({ success: true });
    } catch (error) {
      response.status(500).end(CustomError.toJson(error));
    }
  }
  async getProducts({ user, query }, response) {
    try {
      query = { ...new SearchCriteria(query), ownerId: user.id };
      const products = await this.sellerRepository.getProducts(query);
      response.json(products);
    } catch (error) {
      response.status(500).end(CustomError.toJson(error));
    }
  }

  async getOrders({ user, query }, response) {
    try {
      query = { ...new SearchCriteria(query), sellerId: user.id };
      const orders = await this.sellerRepository.getOrders(query);
      orders.forEach((order) => (order.country = countries[order.country.toUpperCase()][0]));
      response.json(orders);
    } catch (error) {
      console.log(error);
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getShipments({ user, query }, response) {
    try {
      query = { ...new SearchCriteria(query), sellerId: user.id };
      const shipments = await this.sellerRepository.getShipments(query);
      shipments.forEach((shipment) => (shipment.country = countries[shipment.country.toUpperCase()][0]));
      response.json(shipments);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getBalance({ user }, response) {
    try {
      const balance = await this.sellerRepository.getBalance(user.id);
      response.json(balance);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getSales({ user }, response) {
    try {
      const sales = await this.sellerRepository.getSales(user.id);
      response.json(sales);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getSalesHistory({ user, query }, response) {
    try {
      query = { ...new SearchCriteria(query), owner: user.id };
      const salesHistory = await this.sellerRepository.getSalesHistory(query);
      response.json(salesHistory);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
}

module.exports = SellerResolver;

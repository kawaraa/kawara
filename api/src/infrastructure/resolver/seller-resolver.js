const CreateProductHandler = require("../../application/handler/create-product-handler");
const { CustomError, countries } = require("k-utilities");
const SearchCriteria = require("../../domain/model/search-criteria");
const UpdateQuantityCommand = require("../../domain/command/update-quantity-command");
const CreateShipmentCommand = require("../../domain/command/create-shipment-command");

class SellerResolver {
  constructor(server, firewall, sellerRepository, accountRepository, storageProvider, scrapeHandler) {
    this.server = server;
    this.firewall = firewall;
    this.sellerRepository = sellerRepository;
    this.accountRepository = accountRepository;
    this.storageProvider = storageProvider;
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
      const account = await this.accountRepository.checkAccount(null, null, request.user.id);
      if (account.confirmed < 1) throw new CustomError(this.errorMessage);
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
      await this.sellerRepository.delete(params.number, user.id);
      response.json({ success: true });
    } catch (error) {
      response.status(500).end(CustomError.toJson(error));
    }
  }
  async createShipment({ user, body }, response) {
    try {
      body.productsOwner = user.id;
      await this.sellerRepository.createShipment(new CreateShipmentCommand(body));
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
      const orders = await this.sellerRepository.getNotShippedOrders(query);
      orders.forEach((order) => (order.country = countries[order.country.toUpperCase()][0]));
      response.json(orders);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getShipments({ user, query }, response) {
    try {
      query = { ...new SearchCriteria(query), sellerId: user.id };
      const shipments = await this.sellerRepository.getShippedOrders(query);
      shipments.forEach((shipment) => (shipment.country = countries[shipment.country.toUpperCase()][0]));
      response.json(shipments);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getBalance({ user }, response) {
    try {
      const balance = await this.sellerRepository.getSellerBalance(user.id);
      response.json(balance);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getSales({ user }, response) {
    try {
      const sales = await this.sellerRepository.getSellerSales(user.id);
      response.json(sales);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getSalesHistory({ user, query }, response) {
    try {
      query = { ...new SearchCriteria(query), owner: user.id };
      const salesHistory = await this.sellerRepository.getSellerSalesHistory(query);
      response.json(salesHistory);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
}

module.exports = SellerResolver;

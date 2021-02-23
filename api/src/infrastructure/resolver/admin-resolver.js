const { CustomError } = require("k-utilities");
const SearchCriteria = require("../../domain/model/search-criteria");
const BankConfirmationAmounts = require("../../domain/model/bank-confirmation-amounts");
const ConfirmItemCommand = require("../../domain/command/confirm-item-command");

class BuyerResolver {
  constructor(server, firewall, adminRepository) {
    this.server = server;
    this.firewall = firewall;
    this.adminRepository = adminRepository;
  }

  resolve() {
    this.server.use(
      "/admin",
      this.firewall.checkRequestInfo,
      this.firewall.adminRequired,
      this.firewall.authRequired
    );
    this.server.get("/admin/accounts", this.getAccounts.bind(this));
    this.server.get("/admin/banks", this.getBanks.bind(this));
    this.server.put("/admin/bank", this.setConfirmationAmounts.bind(this));
    this.server.get("/admin/products", this.getProducts.bind(this));
    this.server.get("/admin/orders", this.geOrders.bind(this));
    this.server.post("/admin/order/item", this.confirmItemDelivery.bind(this));
    this.server.get("/admin/sales", this.getSales.bind(this));
    this.server.post("/admin/product/approve/:number", this.approveProduct.bind(this));
    this.server.get("/admin/payouts", this.getPayouts.bind(this));
    this.server.post("/admin/payout/:owner", this.payout.bind(this));
  }

  async getAccounts({ query }, response) {
    try {
      query = { ...new SearchCriteria(query), type: query.type || "seller" };
      const accounts = await this.adminRepository.getAccounts(query);
      response.send(accounts);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getBanks({ query }, response) {
    try {
      query = { ...new SearchCriteria(query), status: query.status };
      const banks = await this.adminRepository.getBanks(query);
      response.send(banks);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async setConfirmationAmounts({ body }, response) {
    try {
      await this.adminRepository.setConfirmationAmounts(new BankConfirmationAmounts(body));
      response.send({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }

  async getProducts({ query }, response) {
    try {
      const products = await this.adminRepository.getProducts(new SearchCriteria(query));
      response.send(products);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async geOrders({ query }, response) {
    try {
      const sipped = query.shipped === "true";
      let orders = null;
      if (sipped) orders = await this.adminRepository.shippedOrders(new SearchCriteria(query));
      else orders = await this.adminRepository.notShippedOrders(new SearchCriteria(query));
      response.send(orders);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async confirmItemDelivery({ query }, response) {
    try {
      await this.adminRepository.confirmItemDelivery(new ConfirmItemCommand(query));
      response.json({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getSales({ query }, response) {
    try {
      query = { ...new SearchCriteria(query), payout: query.payout };
      const sales = await this.adminRepository.getSales(query);
      response.send(sales);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async approveProduct({ params }, response) {
    try {
      await this.adminRepository.markProductAsReviewedAccounts(params.number);
      response.send({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getPayouts({ query }, response) {
    try {
      const payouts = await this.adminRepository.getPayouts(new SearchCriteria(query));
      response.send(payouts);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async payout({ params }, response) {
    try {
      await this.adminRepository.makePayout(params.owner);
      response.send({ success: true });
    } catch (error) {
      console.log(error);
      response.status(400).end(CustomError.toJson(error));
    }
  }
}

module.exports = BuyerResolver;

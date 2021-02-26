const { CustomError } = require("k-utilities");
const SearchCriteria = require("../../domain/model/search-criteria");
const BankConfirmationAmounts = require("../../domain/model/bank-confirmation-amounts");
const ConfirmOrderDeliveryCommand = require("../../domain/command/confirm-order-delivery-command");

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
    this.server.get("/admin/orders", this.getOrders.bind(this));
    this.server.get("/admin/shipments", this.getShipments.bind(this));
    this.server.get("/admin/orders/reminder-email", this.sendOrderReminderEmails.bind(this));
    this.server.get("/admin/shipments/reminder-email", this.sendDeliveryReminderEmails.bind(this));
    this.server.delete("/admin/order", this.cancelItem.bind(this));
    this.server.post("/admin/shipment", this.confirmItemDelivery.bind(this));
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
  async getOrders({ query }, response) {
    try {
      const orders = await this.adminRepository.getOrders(new SearchCriteria(query));
      response.send(orders);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getShipments({ query }, response) {
    try {
      const shipments = await this.adminRepository.getShipments(new SearchCriteria(query));
      response.send(shipments);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async sendOrderReminderEmails(request, response) {
    try {
      console.log("Hello from sendOrderReminderEmails");
      // todos: send an Email to reminder the sellers to ship the items before it get canceled
      // this can be a handler that query all the items that has been 24 hours ordered but not shipped items yet
      response.json({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async sendDeliveryReminderEmails(request, response) {
    try {
      console.log("Hello from sendDeliveryReminderEmails");
      // todos: send an Email to reminder the customers to confirm the item delivery
      // this can be a handler that query all the items that has been shipped more than 5 days but not confirmed
      response.json({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async cancelItem({ query: { item } }, response) {
    try {
      // todos: cancel the item.
      //  await this.adminRepository.cancelItem(item);
      response.json({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async confirmItemDelivery({ query: { user, item } }, response) {
    try {
      await this.adminRepository.confirmItemDelivery(new ConfirmOrderDeliveryCommand(user, item));
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

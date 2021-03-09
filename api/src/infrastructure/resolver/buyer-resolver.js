"use strict";
const { CustomError } = require("k-utilities");
const SearchCriteria = require("../../domain/model/search-criteria");
const ConfirmOrderDeliveryCommand = require("../../domain/command/confirm-order-delivery-command");

class BuyerResolver {
  constructor(server, firewall, buyerRepository) {
    this.server = server;
    this.firewall = firewall;
    this.buyerRepository = buyerRepository;
  }

  resolve() {
    this.server.use("/buyer", this.firewall.checkRequestInfo, this.firewall.authRequired);
    this.server.get("/buyer/address", this.getAddresses.bind(this));
    this.server.get("/buyer/orders", this.getOrders.bind(this));
    this.server.post("/buyer/order", this.confirmItemDelivery.bind(this));
  }

  async getAddresses({ user }, response) {
    try {
      const addresses = await this.buyerRepository.getAddresses(user.id);
      response.json(addresses);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getOrders({ user, query }, response) {
    try {
      query = { ...new SearchCriteria(query), owner: user.id, status: (query.status + "").toLowerCase() };
      const orders = await this.buyerRepository.getOrders(query);
      response.json(orders);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async confirmItemDelivery({ user: { id }, query: { sold } }, response) {
    try {
      await this.buyerRepository.confirmItemDelivery(new ConfirmOrderDeliveryCommand(id, sold));
      response.json({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
}

module.exports = BuyerResolver;

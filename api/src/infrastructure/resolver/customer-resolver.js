"use strict";
const { CustomError } = require("k-utilities");
const CreateContactCommand = require("../../domain/command/create-contact-command");
const ConfirmOrderDeliveryCommand = require("../../domain/command/confirm-order-delivery-command");

class ContactResolver {
  constructor(server, firewall, customerRepository) {
    this.server = server;
    this.firewall = firewall;
    this.customerRepository = customerRepository;
  }

  resolve() {
    this.server.use("/customer", this.firewall.checkRequestInfo);
    this.server.post("/customer", this.createContact.bind(this));
    this.server.get("/customer/confirm-order-delivery", this.confirmOrderDelivery.bind(this));
  }

  async createContact({ user, body }, response) {
    try {
      const command = new CreateContactCommand({ ...body, ...user });
      await this.customerRepository.createContact(command);
      response.json({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async confirmOrderDelivery({ query: { user, shipment } }, response) {
    try {
      await this.customerRepository.confirmOrderDelivery(new ConfirmOrderDeliveryCommand(user, shipment));
      response.json({ success: true });
    } catch (error) {
      console.log(error);
      response.status(400).end(CustomError.toJson(error));
    }
  }
}

module.exports = ContactResolver;

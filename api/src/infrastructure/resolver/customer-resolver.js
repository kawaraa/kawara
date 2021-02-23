"use strict";
const { CustomError } = require("k-utilities");
const CreateContactCommand = require("../../domain/command/create-contact-command");

class ContactResolver {
  constructor(server, firewall, contactRepository) {
    this.server = server;
    this.firewall = firewall;
    this.contactRepository = contactRepository;
  }

  resolve() {
    this.server.use("/customer", this.firewall.checkRequestInfo);
    this.server.post("/customer", this.createContact.bind(this));
  }

  async createContact({ user, body }, response) {
    try {
      const command = new CreateContactCommand({ ...body, ...user });
      await this.contactRepository.createContact(command);
      response.json({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
}

module.exports = ContactResolver;

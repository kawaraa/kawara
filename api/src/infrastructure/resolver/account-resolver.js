const { CustomError } = require("k-utilities");
const UpdatePasswordCommand = require("../../domain/command/update-password-command");
const UpdateFullNameCommand = require("../../domain/command/update-full-name-command");
const UpdateAddressCommand = require("../../domain/command/update-address-command");
const UpdateBankCommand = require("../../domain/command/update-bank-command");
const UpdatePaypalCommand = require("../../domain/command/update-paypal-command");
const BankConfirmationAmounts = require("../../domain/model/bank-confirmation-amounts");

class AccountResolver {
  constructor(server, firewall, accountRepository, deleteAccountHandler) {
    this.server = server;
    this.firewall = firewall;
    this.accountRepository = accountRepository;
    this.deleteAccountHandler = deleteAccountHandler;
    this.isConfirmed = this.checkAccountConfirmation.bind(this);
    this.config = env.accountResolver;
  }

  resolve() {
    this.server.use("/account", this.firewall.checkRequestInfo, this.firewall.authRequired);
    this.server.use("/account/bank", this.isConfirmed, this.firewall.sellerRequired);
    this.server.get("/account", this.getAccount.bind(this));
    this.server.post("/account/password", this.isConfirmed, this.updatePassword.bind(this));
    this.server.post("/account/full-name", this.isConfirmed, this.updateFullName.bind(this));
    this.server.post("/account/address", this.isConfirmed, this.updateAddress.bind(this));
    this.server.delete("/account/address/:id", this.isConfirmed, this.deleteAddress.bind(this));
    this.server.get("/account/seller/bank", this.getBank.bind(this));
    this.server.post("/account/seller/bank", this.addBank.bind(this));
    this.server.post("/account/seller/paypal", this.addPaypal.bind(this));
    this.server.put("/account/seller/bank", this.confirmBank.bind(this));
    this.server.delete("/account/seller/bank", this.removeBank.bind(this));
    this.server.delete("/account", this.isConfirmed, this.deleteAccount.bind(this));
  }

  async checkAccountConfirmation({ user }, response, next) {
    try {
      if (await this.accountRepository.isAccountConfirmed(user.id)) return next();
      response.status(400).end(CustomError.toJson(this.config.confirmationError));
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }

  async getAccount({ user }, response) {
    try {
      const accounts = await this.accountRepository.getAccountByOwner(user.id);
      response.send(accounts);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async updatePassword({ user, body }, response) {
    try {
      await this.accountRepository.updatePassword(new UpdatePasswordCommand({ ...body, ...user }));
      response.send({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async updateFullName({ user, body }, response) {
    try {
      const command = new UpdateFullNameCommand({ ...body, ...user });
      await this.accountRepository.updateFullName(command);
      response.send({ success: true });
    } catch (error) {
      console.log(error);
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async updateAddress({ user, body }, response) {
    try {
      const command = new UpdateAddressCommand({ ...body, owner: user.id });
      await this.accountRepository.updateAddress(command);
      response.send(command);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async deleteAddress({ user, params }, response) {
    try {
      await this.accountRepository.deleteAddress({ id: params.id, owner: user.id });
      response.send({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async getBank({ user }, response) {
    try {
      const bank = await this.accountRepository.getBankByOwner(user.id);
      response.send(bank);
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async addBank({ user, body }, response) {
    try {
      const command = new UpdateBankCommand({ ...body, owner: user.id, type: "bank", status: "initial" });
      await this.accountRepository.updateBank(command);
      response.send({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async addPaypal({ user, body }, response) {
    try {
      const command = new UpdatePaypalCommand({ ...body, owner: user.id, type: "paypal", status: "initial" });
      await this.accountRepository.updateBank(command);
      response.send({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async confirmBank({ user, body }, response) {
    try {
      body.owner = user.id;
      await this.accountRepository.confirmBank(new BankConfirmationAmounts(body));
      response.send({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async removeBank({ user }, response) {
    try {
      await this.accountRepository.deleteBank(user.id);
      response.send({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async deleteAccount({ user, body }, response) {
    try {
      await this.deleteAccountHandler.deleteAccount({ id: user.id, password: body.password });
      response.send({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
}

module.exports = AccountResolver;

"use strict";
const { CustomError } = require("k-utilities");

const CreateSellerAccountCommand = require("../../domain/command/create-seller-account-command");
const CreateBuyerAccountCommand = require("../../domain/command/create-buyer-account-command");
const UpdateAddressCommand = require("../../domain/command/update-address-command");
const LoginInfo = require("../../domain/model/login-info");
const User = require("../../domain/model/user");

class AuthResolver {
  constructor(server, firewall, accountRepository, mailHandler) {
    this.server = server;
    this.firewall = firewall;
    this.accountRepository = accountRepository;
    this.mailHandler = mailHandler;
    this.config = env.FIREWALL.cookieOption;
  }

  resolve() {
    this.server.use("/auth", this.firewall.checkRequestInfo);
    this.server.get("/auth/exchange-rates", this.getExchangeRates.bind(this));
    this.server.post("/auth/signup/seller", this.createSeller.bind(this));
    this.server.post("/auth/signup", this.createBuyer.bind(this));
    // this.server.get("/auth/signup/confirm/:token", this.confirmAccount.bind(this));
    // this.server.post("/auth/password/", this.updatePassword.bind(this));
    this.server.use("/auth/check-user-state", this.checkUserState.bind(this));
    this.server.post("/auth/login", this.onLogin.bind(this));
    this.server.use("/auth/logout", this.onLogout.bind(this));
  }

  async createSeller({ user: { ip, country }, body }, response) {
    try {
      const account = new CreateSellerAccountCommand({ ...body });
      const { id, type, email, firstName, lastName } = account;
      const fullName = firstName + " " + lastName;
      const address = new UpdateAddressCommand({ ...body, owner: id, country, fullName });
      await this.accountRepository.updateAddress(address);
      await this.accountRepository.createAccount(account);
      const userInfo = new User({ ip, id, type, email, displayName: fullName });
      const token = this.firewall.createToken(userInfo);
      if (!token) return response.status(500).end(CustomError.toJson());
      // const result = await this.mailHandler.sendConfirmationByEmail(email, token);
      response.cookie("userToken", token, this.config);
      response.json({ success: true });
    } catch (error) {
      response.clearCookie("userToken");
      response.status(400).end(CustomError.toJson(error));
    }
  }

  async createBuyer({ user: { ip }, body }, response) {
    try {
      const account = new CreateBuyerAccountCommand(body);
      const { id, type, email, firstName, lastName } = account;
      await this.accountRepository.createAccount(account);
      const userInfo = new User({ ip, id, type, email, displayName: firstName + " " + lastName });
      const token = this.firewall.createToken(userInfo);
      if (!token) return response.status(500).end(CustomError.toJson());
      // const result = await this.mailHandler.sendConfirmationLink(email, token);
      response.cookie("userToken", token, this.config);
      response.json({ success: true });
    } catch (error) {
      response.clearCookie("userToken");
      response.status(400).end(CustomError.toJson(error));
    }
  }

  async onLogin({ user: { ip }, body }, response) {
    try {
      const { email, password } = new LoginInfo(body);
      const account = await this.accountRepository.checkAccount(email, password);
      if (!account) throw new CustomError("Incorrect combination of Username / Password");
      const user = new User({ ip: ip, ...account, displayName: account.firstName + " " + account.lastName });
      const token = await this.firewall.createToken(user);
      if (!token) return response.status(500).end(CustomError.toJson());
      // if (account.confirmed < 1) await this.mailHandler.sendConfirmationLink(account.email, token);
      response.cookie("userToken", token, this.config);
      response.json({ success: true });
    } catch (error) {
      response.clearCookie("userToken");
      response.status(400).end(CustomError.toJson(error));
    }
  }
  checkUserState({ user }, response) {
    response.json(user);
  }
  onLogout(request, response) {
    response.clearCookie("userToken");
    response.json({ success: true });
  }
  getExchangeRates(request, response) {
    response.json(this.firewall.rates);
  }
}

module.exports = AuthResolver;

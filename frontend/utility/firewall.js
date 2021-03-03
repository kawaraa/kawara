const { countries } = require("k-utilities");

class Firewall {
  constructor(cookie, jwt, fetch, notFoundPage) {
    this.cookie = cookie;
    this.jwt = jwt;
    this.fetch = fetch;
    this.notFoundPage = notFoundPage;
    this.config = { ...env.FIREWALL, api: env.API };
    this.checkRequestInfo = this.checkRequest.bind(this);
    this.authRequired = this.authenticationRequired.bind(this);
    this.authNotRequired = this.authenticationNotRequired.bind(this);
    this.adminRequired = this.isAdmin.bind(this);
    this.sellerRequired = this.isSeller.bind(this);
    this.updateExchangeRates();
  }

  async checkRequest(request, response, next) {
    const { ip, country } = await this.checkGeo(request.headers["x-forwarded-for"]);
    const { symbol, code, rate } = this.checkCurrency(country);
    request.user = { ip, country, currency: symbol, rate, type: "visitor", displayName: "Guest" };
    const token = this.cookie.parse(request.headers.cookie || "")["userToken"];
    if (token) request.user = await this.validateToken(request, response);
    if (this.config.adminIPs.find((IP) => IP === ip)) request.user.type = "admin";
    next();
  }
  // This is a middleware for "/admin"
  isAdmin(request, response, next) {
    request.user.type === "admin" ? next() : response.status(404).end(this.notFoundPage(request.user));
  }
  // This is a middleware for "/seller"
  isSeller(request, response, next) {
    const { type, id } = request.user;
    if (type === "seller" || (type === "admin" && id)) return next();
    response.redirect("/auth/login");
  }
  // This middleware for any page need auth to access
  authenticationRequired(request, response, next) {
    if (!request.user.id) return response.redirect("/auth/login");
    next();
  }
  authenticationNotRequired(request, response, next) {
    if (request.user.id) return response.redirect("/");
    next();
  }
  async checkGeo(ip) {
    try {
      const res = await this.fetch(this.config.geoApi.replace("xxx", ip)).then((res) => res.json());
      return res && res.country ? res : { ip, country: "" };
    } catch (error) {
      return { ip, country: "" };
    }
  }
  checkCurrency(country) {
    const currInfo = { symbol: "€", code: "EUR", rate: 1 };
    if (!country || !countries[country] || countries[country][1] === "EU") return currInfo;
    return !this.rates.USD ? currInfo : { symbol: "$", code: "USD", rate: this.rates.USD };
  }
  async updateExchangeRates(url = this.config.api + "/auth/exchange-rates") {
    const exchangeInfo = await this.fetch(url).then((res) => res.json());
    this.rates = { ...exchangeInfo.rates };
    setTimeout(() => this.updateExchangeRates(), 1000 * 60 * 60 * 24);
  }
  async validateToken({ method, headers, user }, response) {
    try {
      const url = this.config.api + "/auth/check-user-state";
      const aUser = await this.fetch(url, { method, headers }).then((res) => res.json());
      if (aUser && aUser.id) return aUser;
      response.clearCookie("userToken");
      return user;
    } catch (error) {
      return user;
    }
  }
}

module.exports = Firewall;

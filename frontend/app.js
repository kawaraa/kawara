"use strict";

require("./config/get-config")();
const http = require("http");
const express = require("express");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const Firewall = require("./utility/firewall");
const notFoundPage = require("./pages/not-found.hbs");
const routes = require("./config/routes.json");

(async () => {
  try {
    Array.prototype.render = function (cb) {
      return this.reduce((init, item, i) => init + cb(item, i), "");
    };
    Object.prototype.render = function (cb) {
      return Object.keys(this).reduce((init, key) => init + cb(key, this[key]), "");
    };
    Number.prototype.priceToString = function (rate, currency = "") {
      return currency + ((this * rate) / 100).toFixed(2);
    };

    const app = express();
    const server = http.createServer(app);

    const firewall = new Firewall(cookie, jwt, fetch, notFoundPage);
    app.disable("x-powered-by");
    app.set("trust proxy", true);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(env.publicDir));
    app.use("/", firewall.checkRequestInfo);
    app.use("/admin", firewall.adminRequired, firewall.authRequired);
    app.use("/seller", firewall.sellerRequired);
    app.use("/account", firewall.authRequired);
    app.use("/orders", firewall.authRequired);
    app.use("/auth", firewall.authNotRequired);

    routes.forEach(({ method, path, filePath }) => {
      const view = require("./pages" + filePath);
      if (!/.js$/gim.test(filePath)) return app[method](path, (req, res) => res.send(view(req)));
      app[method](path, view.bind({ fetch, apiService: env.API, notFoundPage }));
    });

    app.use("*", (req, res) => res.status(404).end(notFoundPage(req.user)));

    server.listen(env.PORT, () => console.log("Running on: http://localhost:" + env.PORT));
  } catch (error) {
    console.error("ServerError: ", error);
  }
})();

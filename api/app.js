"use strict";
require("./config/get-config")();
const http = require("http");
const express = require("express");
const getApiRouter = require("./src/index.js");

(async () => {
  try {
    const app = express();
    const server = http.createServer(app);

    app.set("trust proxy", true);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/api", getApiRouter(express.Router()));

    app.use("*", (request, response) => response.status(404).end('{"error":"Not Found(!)"}'));

    server.listen(env.PORT, () => console.log("Running on: http://localhost:" + env.PORT));
  } catch (error) {
    console.error("ServerError: ", error);
  }
})();

"use strict";
const { CustomError } = require("k-utilities");
const SoldItem = require("../../domain/model/sold-item");
const UpdateAddressCommand = require("../../domain/command/update-address-command");
const CreateOrderCommand = require("../../domain/command/create-order-command");

class CheckoutResolver {
  constructor(server, firewall, checkoutRepository, mailHandler, stripe, paypal) {
    this.server = server;
    this.firewall = firewall;
    this.checkoutRepository = checkoutRepository;
    this.mailHandler = mailHandler;
    this.config = { ...env.CHECKOUT, origin: env.ORIGIN };
    this.stripe = stripe(this.config.stripeSecretKey);
    this.paypal = paypal;
  }

  resolve() {
    this.server.use("/checkout", this.firewall.checkRequestInfo);
    this.server.post("/checkout/card", this.createCardPaymentIntent.bind(this));
    this.server.post("/checkout/ideal", this.createIdealPaymentIntent.bind(this));
    this.server.post("/checkout/paypal", this.createPaypalPaymentIntent.bind(this));
    this.server.get("/checkout/complete", this.confirmPayment.bind(this));
    this.paypal.configure(this.config.paypal);
  }

  async createCardPaymentIntent({ user, body: { shipping, items } }, response) {
    try {
      const country = shipping.address.country;
      const { currency } = this.config;

      items = items.map((item) => new SoldItem(item));

      items = await Promise.all(items.map((item) => this.checkoutRepository.checkItem(item, country)));

      const total = items.reduce((init, item) => init + (item.price + item.shippingCost) * item.quantity, 0);
      const address = new UpdateAddressCommand({ ...shipping, ...shipping.address, owner: user.id });

      const { id, client_secret } = await this.stripe.paymentIntents.create({
        amount: total,
        currency,
        payment_method_types: ["card"],
        metadata: { integration_check: "accept_a_payment" },
      });

      items.forEach((item) => (item.orderId = id));

      const order = new CreateOrderCommand(address.owner, address.id, id, "card", total, currency);

      await this.checkoutRepository.createSoldItems(items);
      await this.checkoutRepository.createAddress(address);
      await this.checkoutRepository.createOrder(order);

      response.json({ clientSecret: client_secret });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async createIdealPaymentIntent({ user, body: { shipping, items } }, response) {
    try {
      const country = shipping.address.country;
      const { currency } = this.config;

      items = items.map((item) => new SoldItem(item));
      items = await Promise.all(items.map((item) => this.checkoutRepository.checkItem(item, country)));

      const total = items.reduce((init, item) => init + (item.price + item.shippingCost) * item.quantity, 0);
      const address = new UpdateAddressCommand({ ...shipping, ...shipping.address, owner: user.id });

      const { id, client_secret } = await this.stripe.paymentIntents.create({
        amount: total,
        currency,
        payment_method_types: ["ideal"],
        metadata: { integration_check: "accept_a_payment" },
      });

      items.forEach((item) => (item.orderId = id));

      const order = new CreateOrderCommand(address.owner, address.id, id, "ideal", total, currency);

      await this.checkoutRepository.createSoldItems(items);
      await this.checkoutRepository.createAddress(address);
      await this.checkoutRepository.createOrder(order);

      response.json({ clientSecret: client_secret });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async createPaypalPaymentIntent({ user, body: { shipping, items } }, response) {
    try {
      const { currency } = this.config;
      const country = shipping.address.country;
      const url = this.config.origin + "/checkout/complete";

      items = items.map((item) => new SoldItem(item));
      items = await Promise.all(items.map((item) => this.checkoutRepository.checkItem(item, country)));

      const total = items.reduce((init, item) => init + (item.price + item.shippingCost) * item.quantity, 0);
      const address = new UpdateAddressCommand({ ...shipping, ...shipping.address, owner: user.id });

      const paymentObject = {
        intent: "sale",
        payer: { payment_method: "paypal" },
        redirect_urls: { return_url: url, cancel_url: url },
        transactions: [
          {
            amount: { currency, total: total / 100 },
            description: `Bought ${items.length} items from Kawara.`,
          },
        ],
      };
      const payment = await this.createPaypalPayment(JSON.stringify(paymentObject));

      items.forEach((item) => (item.orderId = payment.id));

      const order = new CreateOrderCommand(address.owner, address.id, payment.id, "paypal", total, currency);

      await this.checkoutRepository.createSoldItems(items);
      await this.checkoutRepository.createAddress(address);
      await this.checkoutRepository.createOrder(order);

      response.json({ redirectLink: payment.links.find((link) => link.rel === "approval_url").href });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }
  async confirmPayment({ user, query }, response) {
    try {
      const { payment_intent, paymentId, PayerID } = query;
      if (!payment_intent && !paymentId) throw new Error("Failed to confirm Payment, please try again (!)");

      if (payment_intent) {
        const intent = await this.stripe.paymentIntents.retrieve(payment_intent);
        if (!intent.charges.data[0].paid) throw new Error("Failed to confirm Payment, please try again (!)");
        // console.log(intent.charges.data[0].status); //success or failed
        const order = await this.checkoutRepository.confirmPayment(payment_intent);
        this.mailHandler.sendOrderConfirmationEmail({ ...order, ...user });
        return response.json({ success: true });
      }

      const order = await this.checkoutRepository.getOrder(paymentId);
      if (!order.total) Error("Failed to confirm Payment, please try again (!)");

      const paymentObject = {
        payer_id: PayerID,
        transactions: [{ amount: { currency: this.config.currency, total: order.total / 100 } }],
      };

      const payment = await this.confirmPaypalPayment(paymentId, JSON.stringify(paymentObject));
      await this.checkoutRepository.confirmPayment(paymentId);
      this.mailHandler.sendOrderConfirmationEmail({ ...order, ...user });
      response.json({ success: true });
    } catch (error) {
      response.status(400).end(CustomError.toJson(error));
    }
  }

  createPaypalPayment(paymentObject) {
    return new Promise((resolve, reject) => {
      this.paypal.payment.create(paymentObject, (err, payment) => (err ? reject(err) : resolve(payment)));
    });
  }
  confirmPaypalPayment(paymentId, paymentObject) {
    return new Promise((resolve, reject) => {
      this.paypal.payment.execute(paymentId, paymentObject, (err, p) => (err ? reject(err) : resolve(p)));
    });
  }
}

module.exports = CheckoutResolver;

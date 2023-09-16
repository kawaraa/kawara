const accountConfirmation = require("../../domain/email-template/account-confirmation.hbs");
const orderConfirmation = require("../../domain/email-template/order-confirmation.hbs");
const shippedItems = require("../../domain/email-template/shipped-items.hbs");
const newOrder = require("../../domain/email-template/new-order.hbs");

class MailHandler {
  constructor(mailer) {
    this.mailTransporter = mailer.createTransport(env.NODEMAILER);
    this.origin = env.ORIGIN;
  }

  sendEmail({ email, subject, text, html }) {
    const mailOptions = { from: '"Kawara" <service@kwashopping.com>', to: email, subject, text, html };
    return new Promise((resolve, reject) => {
      this.mailTransporter.sendMail(mailOptions, (err, info) => (err ? reject(err) : resolve(info)));
    });
  }

  sendAccountConfirmationEmail(name, email, token) {
    const html = accountConfirmation(name, email, this.origin + "/confirm-account/" + token);
    const options = { email, subject: "Account Email Address confirmation", html };
    return this.sendEmail(options).catch((err) => console.log("Account confirmation email Error: ", err));
  }

  sendOrderConfirmationEmail(order) {
    order.domain = this.origin;
    let options = { email: order.email, subject: "Order confirmation", html: orderConfirmation(order) };
    this.sendEmail(options).catch((err) => console.log("Order confirmation email Error: ", err));
    options = {
      email: order.sellerEmail,
      subject: "New order has been placed",
      html: newOrder(this.origin, order.sellerName),
    };
    this.sendEmail(options).catch((err) => console.log("Order confirmation email Error: ", err));
  }

  sendShipmentEmail(shipment) {
    shipment.domain = this.origin;
    const email = shipment.email;
    const options = { email, subject: "Items has been shipped", html: shippedItems(shipment) };
    this.sendEmail(options).catch((err) => console.log("Shipment email Error: ", err));
  }
}

module.exports = MailHandler;

// const mailOptions = {
//   from: '"KwaShopping" <service@kwashopping.com>', // sender address
//   to: "", // list of receivers
//   subject: "", // Subject line
//   text: "", // plain text body
//   html: "", // html body
// };

// mailTransporter.sendMail returns the following
//  result = {
//    accepted: [ 'example@email.com' ],
//    rejected: [],
//    envelopeTime: 762,
//    messageTime: 1367,
//    messageSize: 2051,
//    response: '250 2.0.0 OK  87654567 ou567i8693edj.79 - gsmtp',
//    envelope: { from: 'service@kwashopping.com', to: [ 'example@email.com' ] },
//    messageId: '<45ytr67u-120d-69462c1d90c1@kwashopping.com>'
//  }

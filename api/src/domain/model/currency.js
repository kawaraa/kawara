class Currency {
  constructor(user) {
    this.ip = user.ip;
    this.id = user.id + "";
    this.country = user.country;
    this.currency = user.currency;
    this.type = user.type;
    this.displayName = user.displayName;
  }
}

module.exports = Currency;

const { Validator, CustomError, countries } = require("k-utilities");

class UpdatePaypalCommand {
  constructor(bank) {
    this.owner = bank.owner;
    this.type = bank.type;
    this._country = bank.country;
    this._accountHolder = bank.accountHolder;
    this.routingNumber = null;
    this._accountNumber = bank.accountNumber;
    this.bic = null;
    this.status = "initial";
  }
  set _country(value) {
    if (!countries[value]) throw new CustomError("Invalid input 'Country'");
    this.country = value;
  }
  set _accountHolder(value) {
    if (Validator.isString(value, 4, 40)) this.accountHolder = value;
    else throw new CustomError("Invalid input 'Account Name'");
  }
  set _accountNumber(value) {
    if (Validator.isString(value, 5, 100)) this.accountNumber = value;
    else throw new CustomError("Invalid input 'Paypal Account'");
  }
}

module.exports = UpdatePaypalCommand;

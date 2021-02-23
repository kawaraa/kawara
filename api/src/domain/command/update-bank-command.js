const { Validator, CustomError, countries } = require("k-utilities");

class UpdateBankCommand {
  constructor(bank) {
    this.owner = bank.owner;
    this.type = bank.type;
    this._country = bank.country;
    this._accountHolder = bank.accountHolder;
    this._routingNumber = bank.routingNumber;
    this._accountNumber = bank.accountNumber;
    this._bic = bank.bic;
    this.status = "initial";
    this.created = null;
    this.note = null;
  }
  set _country(value) {
    if (!countries[value]) throw new CustomError("Invalid input 'Country'");
    this.country = value;
  }
  set _accountHolder(value) {
    if (Validator.isString(value, 4, 40)) this.accountHolder = value;
    else throw new CustomError("Invalid input 'Account Holder Name'");
  }
  set _routingNumber(value) {
    if (Validator.isString(value, 9, 9)) this.routingNumber = value;
    else throw new CustomError("Invalid input 'Routing Number'");
  }
  set _accountNumber(value) {
    if (Validator.isString(value, 7, 100)) this.accountNumber = value;
    else throw new CustomError("Invalid input 'Account number'");
  }
  set _bic(value) {
    if (Validator.isString(value, 4, 11)) this.bic = value;
    else throw new CustomError("Invalid input 'BIC / SWIFT CODE'");
  }
}

module.exports = UpdateBankCommand;

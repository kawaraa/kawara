const { Validator, CustomError } = require("k-utilities");

class BankConfirmationAmounts {
  constructor(bank) {
    this.owner = bank.owner;
    this._amount1 = bank.amount1;
    this._amount2 = bank.amount2;
  }

  set _amount1(value) {
    if (Validator.isNumber(value, 1, 10)) this.amount1 = value;
    else throw new CustomError("Invalid input 'Amount 1'");
  }
  set _amount2(value) {
    if (Validator.isNumber(value, 1, 10)) this.amount2 = value;
    else throw new CustomError("Invalid input 'Amount 2'");
  }
}

module.exports = BankConfirmationAmounts;

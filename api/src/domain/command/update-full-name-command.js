const { Validator, CustomError } = require("k-utilities");

class UpdateAccountCommand {
  constructor(account) {
    this.id = account.id;
    this._firstName = account.firstName;
    this._lastName = account.lastName;
  }

  set _firstName(value) {
    if (!Validator.isString(value, 2, 20)) throw new CustomError("Invalid input 'First Name'");
    this.firstName = value;
  }
  set _lastName(value) {
    if (!Validator.isString(value, 2, 20)) throw new CustomError("Invalid input 'Last Name'");
    this.lastName = value;
  }
}

module.exports = UpdateAccountCommand;

const { Validator, CustomError } = require("k-utilities");
const pswError =
  "Password must be at least 8 Characters / Numbers, 1 special characters / symbols, 1 number and 1 capital letter";

class CreateAccountCommand {
  constructor(account) {
    this._email = account.email;
    this._password = account.password;
  }
  set _email(value) {
    if (!value) throw new CustomError("'email' is required field");
    if (!Validator.isEmail(value)) throw new CustomError("Invalid input 'email'");
    this.email = value.toLowerCase();
  }
  set _password(value) {
    if (!value) throw new CustomError("'Password' is required field");
    else if (!Validator.isStrongPsw(value)) throw new CustomError(pswError);
    this.password = value;
  }
}

module.exports = CreateAccountCommand;

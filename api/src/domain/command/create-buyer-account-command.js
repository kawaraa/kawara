const { Validator, Formatter, CustomError } = require("k-utilities");
const passwordError = env.passwordError;

class CreateBuyerAccountCommand {
  constructor(account) {
    this.id = Formatter.newId();
    this.type = "buyer";
    this._email = account.email;
    this._password = account.password;
    this.firstName = "";
    this.lastName = "";
    this.created = null;
    this.about = "";
    this.confirmed = 0;
  }
  set _email(value) {
    if (!value) throw new CustomError("'email' is required field");
    if (!Validator.isEmail(value)) throw new CustomError("Invalid input 'email'");
    this.email = value.toLowerCase();
  }
  set _password(value) {
    if (!value) throw new CustomError("'Password' is required field");
    else if (!Validator.isStrongPsw(value)) throw new CustomError(passwordError);
    this.password = value;
  }
}

module.exports = CreateBuyerAccountCommand;

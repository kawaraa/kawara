const { Validator, Formatter, CustomError } = require("k-utilities");
const passwordError = env.passwordError;

class CreateSellerAccountCommand {
  constructor(account) {
    this.id = Formatter.newId();
    this.type = "seller";
    this._email = account.email;
    this._password = account.password;
    this._firstName = account.firstName;
    this._lastName = account.lastName;
    this._about = account.about;
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
  set _firstName(value) {
    if (!Validator.isString(value, 2, 20)) throw new CustomError("Invalid input 'First Name'");
    this.firstName = value;
  }
  set _lastName(value) {
    if (!Validator.isString(value, 2, 20)) throw new CustomError("Invalid input 'Last Name'");
    this.lastName = value;
  }
  set _about(value) {
    if (!Validator.isString(value, 0, 250)) throw new CustomError("Invalid input 'About'");
    this.about = value;
  }
}

module.exports = CreateSellerAccountCommand;

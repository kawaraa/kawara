const { Validator, CustomError } = require("k-utilities");
const passwordError = env.passwordError;

class UpdateAccountCommand {
  constructor(account) {
    this.id = account.id;
    this.oldPassword = account.oldPassword;
    this._password = account.password;
  }

  set _password(value) {
    if (!value) throw new CustomError("'Password' is required field");
    else if (!Validator.isStrongPsw(value)) throw new CustomError(passwordError);
    this.password = value;
  }
}

module.exports = UpdateAccountCommand;

const { Validator, Formatter, CustomError } = require("k-utilities");

class CreateContactCommand {
  constructor(contact) {
    this.id = Formatter.newId();
    this._name = contact.name;
    this._email = contact.email;
    this._subject = contact.subject;
    this._message = contact.message;
    this.solved = 0;
    this.created = null;
    this.note = null;
  }
  set _name(value) {
    if (!Validator.isString(value, 4, 40)) throw new CustomError("Invalid input 'Name'");
    this.name = value;
  }
  set _email(value) {
    if (!value) throw new CustomError("'email' is required field");
    if (!Validator.isEmail(value)) throw new CustomError("Invalid input 'email'");
    this.email = value.toLowerCase();
  }
  set _subject(value) {
    if (!Validator.isString(value, 0, 50)) throw new CustomError("Invalid input 'Subject'");
    this.subject = value;
  }
  set _message(value) {
    if (Validator.isString(value, 10, 250)) this.message = value;
    else throw new CustomError("Invalid input 'Message' must be at least 10 letters");
  }
}

module.exports = CreateContactCommand;

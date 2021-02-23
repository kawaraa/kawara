const { Validator, Formatter, countries, CustomError } = require("k-utilities");

class UpdateAddressCommand {
  constructor(address) {
    this.id = Validator.isString(address.id, 5) ? address.id : Formatter.newId();
    this.owner = address.owner || Formatter.newId();
    this._email = address.email;
    this._phone = address.phone;
    this._fullName = address.fullName || address.name;
    this._street = address.street || address.line1;
    this._city = address.city;
    this._postalCode = address.postalCode || address.postal_code;
    this._state = address.state;
    this._country = address.country;
  }
  set _email(value) {
    if (!value) throw new CustomError("'email' is required field");
    if (!Validator.isEmail(value)) throw new CustomError("Invalid input 'email'");
    this.email = value.toLowerCase();
  }
  set _phone(value) {
    if (value && !Validator.isPhoneNumber(value)) throw new CustomError("Invalid input 'Phone Number'");
    this.phone = value;
  }
  set _fullName(value) {
    if (!Validator.isString(value, 4, 50)) throw new CustomError("Invalid input 'Full Name'");
    this.fullName = value;
  }
  set _street(value) {
    if (!Validator.isString(value, 0, 100)) throw new CustomError("Invalid input 'Street'");
    this.street = value;
  }
  set _city(value) {
    if (!Validator.isString(value, 0, 85)) throw new CustomError("Invalid input 'City'");
    this.city = value;
  }
  set _postalCode(value) {
    if (!Validator.isString(value, 0, 10)) throw new CustomError("Invalid input 'Postal Code'");
    this.postalCode = value;
  }
  set _state(value) {
    if (!Validator.isString(value, 0, 85)) throw new CustomError("Invalid input 'State / Province'");
    this.state = value;
  }
  set _country(value) {
    if (!countries[value]) throw new CustomError("Invalid input 'Country'");
    this.country = value;
  }
}

module.exports = UpdateAddressCommand;

const { Validator, Formatter, CustomError } = require("k-utilities");

class CreateShipmentCommand {
  constructor(shipment) {
    this.id = Formatter.newId();
    this.productOwner = shipment.productOwner;
    this.itemId = shipment.itemId;
    this._carrier = shipment.carrier;
    this._trackNumber = shipment.trackNumber;
    this.deliveryDate = null;
  }

  set _carrier(value) {
    if (Validator.isUrl(value)) this.carrier = value;
    else throw new CustomError("Invalid input 'Carrier WebSite'");
  }
  set _trackNumber(value) {
    if (Validator.isString(value, 10)) this.trackNumber = value;
    else throw new CustomError("Invalid input 'Tracking Number'");
  }
}
module.exports = CreateShipmentCommand;

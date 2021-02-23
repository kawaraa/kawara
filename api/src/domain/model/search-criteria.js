const { Validator } = require("k-utilities");

class SearchCriteria {
  constructor(query) {
    this._limit = query.limit; // Limit per page
    this._offset = query.offset; // the start of the limit
    this._search = query.search;
    this._sortBy = query.sortBy || query.sortby;
  }

  set _offset(value) {
    if (!Validator.isNumber(value, 0)) this.offset = 0;
    else this.offset = Number.parseInt(value);
  }

  set _limit(value) {
    if (!Validator.isNumber(value, 20, 20)) this.limit = 20;
    else this.limit = Number.parseInt(value);
  }
  set _search(value) {
    if (!Validator.isString(value, 0)) this.searchText = "";
    else this.searchText = value.slice(0, 50);
  }
  set _sortBy(value) {
    this.sortBy = (value + "").toUpperCase();
    if (this.sortBy !== "DESC" && this.sortBy !== "ASC") this.sortBy = "ASC";
  }
}
module.exports = SearchCriteria;

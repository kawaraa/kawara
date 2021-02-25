const { CustomError, Hashing } = require("k-utilities");

class AccountRepository {
  constructor(mySqlProvider) {
    this.mySqlProvider = mySqlProvider;
    this.config = env.accountRepository;
    this.hashing = new Hashing();
  }

  async createAccount(account) {
    const user = await this.checkAccount(account.email);
    if (user) throw new CustomError("'Email' is already in used", "Signup");

    account.password = this.hashing.hash(account.password);
    await this.mySqlProvider.query("INSERT INTO user.account SET ?", account);
  }

  async confirmAccount({ id, email }) {
    let query = "SELECT * FROM user.account WHERE id = ? AND email = ?";
    const userResult = await this.mySqlProvider.query(query, [id, email]);

    if (!userResult[0]) throw new CustomError("Please make sure you are clicking the right link");
    if (userResult[0].confirmed == 1) throw new CustomError(this.config.accountConfirmationError);

    query = "UPDATE user.account SET confirmed = 1 WHERE id = ? AND email = ?";
    await this.mySqlProvider.query(query, [id, email]);
  }

  async getAccountByOwner(owner) {
    let query = `SELECT firstName, lastName, email, about, type, confirmed FROM user.account WHERE id=?`;

    const accountResult = await this.mySqlProvider.query(query, owner);
    if (!accountResult[0]) throw new Error("Unauthorized operation (!)");

    query = `SELECT id, fullName, street, city, postalCode, state, country, email, phone FROM user.address WHERE owner=?`;
    accountResult[0].addresses = await this.mySqlProvider.query(query, owner);

    return accountResult[0];
  }

  async checkAccount(email, password, id) {
    if (id) {
      const result = await this.mySqlProvider.query(`SELECT confirmed FROM user.account WHERE id = ?`, id);
      return result[0];
    }
    let query = `SELECT * FROM user.account WHERE email = ?`;
    if (password) {
      password = this.hashing.hash(password);
      query += " AND password = ?";
    }
    const result = await this.mySqlProvider.query(query, password ? [email, password] : [email]);
    return result[0];
  }

  async updatePassword({ id, oldPassword, password }) {
    oldPassword = this.hashing.hash(oldPassword);

    let query = `SELECT id FROM user.account WHERE id = ? AND password = ?`;
    const account = await this.mySqlProvider.query(query, [id, oldPassword]);
    if (!account) throw new CustomError("Unauthorized operation");

    password = this.hashing.hash(password);
    query = `UPDATE user.account SET password = ? WHERE id = ?`;
    await this.mySqlProvider.query(query, [password, id]);
  }

  async updateFullName({ id, firstName, lastName }) {
    const query = `UPDATE user.account SET firstName=?, lastName=? WHERE id=?`;
    await this.mySqlProvider.query(query, [firstName, lastName, id]);
  }
  async updateAddress(address) {
    await this.mySqlProvider.query(`REPLACE INTO user.address SET ?`, address);
  }
  async deleteAddress({ id, owner }) {
    await this.mySqlProvider.query(`DELETE FROM user.address WHERE id = ? AND owner = ?`, [id, owner]);
  }
  async getBankByOwner(owner) {
    const query = `SELECT country, type, accountHolder, routingNumber, accountNumber, status, created FROM user.bank WHERE owner = ?`;
    const result = await this.mySqlProvider.query(query, owner);
    return result[0] ? result[0] : {};
  }
  async updateBank(bank) {
    let query = `SELECT * FROM user.bank WHERE owner = ? AND status = 'pending'`;
    const bankResult = await this.mySqlProvider.query(query, bank.owner);
    if (bankResult[0]) throw new CustomError("You can't update or delete payment method while it's pending");
    await this.mySqlProvider.query(`REPLACE INTO user.bank SET ?`, bank);
  }
  async confirmBank({ owner, amount1, amount2 }) {
    let query = `SELECT * FROM user.bank WHERE owner = ? AND status = 'pending'`;
    const bankResult = await this.mySqlProvider.query(query, owner);
    if (!bankResult[0]) throw new CustomError("Unauthorized operation");

    let { confirmationAmount1, confirmationAmount2, note } = bankResult[0];
    const test1 = amount1 == confirmationAmount1 && amount2 == confirmationAmount2;
    const test2 = amount1 == confirmationAmount2 && amount2 == confirmationAmount1;
    let { attempts, attemptDate } = this.parseBankNote(note);
    if (!attempts) attempts = 0;
    if (!attemptDate) attemptDate = Date.now();
    const period = Math.round((Date.now() - attemptDate) / 1000 / 60 / 60 / 24);

    if (attempts >= 3 && period < 3) throw new CustomError(this.config.bankBlockingError);
    else if (attempts >= 3 && period >= 3) {
      attempts = 0;
      attemptDate = Date.now();
    }

    query = `UPDATE user.bank SET status = 'confirmed' WHERE owner = ?`;
    if (test1 || test2) return await this.mySqlProvider.query(query, owner);

    note = JSON.stringify({ attempts: attempts + 1, attemptDate });
    await this.mySqlProvider.query(`UPDATE user.bank SET note = ? WHERE owner = ?`, [note, owner]);

    throw new CustomError(this.config.bankConfirmError.replace("xxx", 2 - attempts));
  }

  async deleteBank(owner) {
    let query = `SELECT * FROM user.bank WHERE owner = ? AND status = 'pending'`;
    const bankResult = await this.mySqlProvider.query(query, owner);
    if (bankResult[0]) throw new CustomError("You can't update or delete payment method while it's pending");
    await this.mySqlProvider.query(`DELETE FROM user.bank WHERE owner = ?`, owner);
  }

  async deleteAccount({ id, password }) {
    password = this.hashing.hash(password);

    let query = `SELECT * FROM user.account WHERE id = ? AND password =?`;
    const result = await this.mySqlProvider.query(query, id);
    if (!result[0]) throw new Error("Invalid input 'Password' (!)");

    query = `SELECT t1.number FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber WHERE t1.owner = ? AND t2.shipmentId IS NULL`;
    const notShippedItems = await this.mySqlProvider.query(query, id);
    if (notShippedItems[0]) throw new Error(this.config.notShippedItemError);

    query = `SELECT t3.deliveryDate FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber JOIN store.shipment t3 ON t3.orderId = t2.orderId WHERE t1.owner = ? AND t3.deliveryDate IS NULL`;
    const notDeliveredItems = await this.mySqlProvider.query(query, id);
    if (notDeliveredItems[0]) throw new Error(this.config.notDeliveredItemError);

    query = `SELECT t3.deliveryDate FROM store.product t1 JOIN store.soldItem t2 ON t1.number = t2.productNumber JOIN store.shipment t3 ON t3.orderId = t2.orderId WHERE t1.owner = ? ORDER BY t3.deliveryDate DESC LIMIT 1 OFFSET 0`;
    const deliveredItems = await this.mySqlProvider.query(query, id);
    if (deliveredItems[0]) {
      const date = deliveredItems[0].deliveryDate;
      const days = Math.round((Date.now() - Date.parse(date)) / 1000 / 60 / 60 / 24);
      if (days < 15) throw new Error(this.config.periodError.replace("xxx", 15 - days));
    }

    query = `SELECT SUM(price) + SUM(shippingCost) AS balance FROM store.sale WHERE owner = ? AND payout = 0`;
    const balance = await this.mySqlProvider.query(query, id);
    if (balance[0] && balance[0].balance > 0) throw new Error(this.config.balanceRemainError);

    query = `DELETE FROM store.starRating WHERE item IN (SELECT number from store.product WHERE owner = ? )`;
    await this.mySqlProvider.query(query, id);

    query = `DELETE FROM store.subCategory WHERE productNumber IN (SELECT number from store.product WHERE owner = ? )`;
    await this.mySqlProvider.query(query, id);

    query = `DELETE FROM store.category WHERE productNumber IN (SELECT number from store.product WHERE owner = ? )`;
    await this.mySqlProvider.query(query, id);

    query = `DELETE FROM store.shipping WHERE productNumber IN (SELECT number from store.product WHERE owner = ? )`;
    await this.mySqlProvider.query(query, id);

    query = `DELETE FROM store.specification WHERE productNumber IN (SELECT number from store.product WHERE owner = ? )`;
    await this.mySqlProvider.query(query, id);

    query = `DELETE FROM store.type WHERE productNumber IN (SELECT number from store.product WHERE owner = ? )`;
    await this.mySqlProvider.query(query, id);

    await this.mySqlProvider.query(`DELETE FROM store.product WHERE owner = ?`, id);
    await this.mySqlProvider.query(`DELETE FROM store.address WHERE owner = ?`, id);
    await this.mySqlProvider.query(`DELETE FROM store.account WHERE id = ?`, id);
  }

  parseBankNote(note) {
    try {
      return note ? JSON.parse(note) : {};
    } catch (error) {
      return {};
    }
  }
}

module.exports = AccountRepository;

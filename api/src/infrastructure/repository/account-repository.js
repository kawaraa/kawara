const { CustomError, Hashing, Formatter } = require("k-utilities");

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
    if (!accountResult[0]) throw new CustomError("Unauthorized operation");

    query = `SELECT id, fullName, street, city, postalCode, state, country, email, phone FROM user.address WHERE owner=?`;
    accountResult[0].addresses = await this.mySqlProvider.query(query, owner);

    return accountResult[0];
  }
  async isAccountConfirmed(idOrEmail) {
    let query = `SELECT confirmed FROM user.account WHERE id = ? || email = ?`;
    const result = await this.mySqlProvider.query(query, [idOrEmail, idOrEmail]);
    return result[0] && result[0].confirmed > 0;
  }

  async checkAccount(email, password) {
    let query = `SELECT * FROM user.account WHERE email = ?`;
    if (password) {
      password = this.hashing.hash(password);
      query += " AND password = ?";
    }
    const result = await this.mySqlProvider.query(query, password ? [email, password] : email);
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
    if (bankResult[0]) throw new CustomError("You can't update payment method while it's pending");
    await this.mySqlProvider.query(`REPLACE INTO user.bank SET ?`, bank);
  }

  async deleteBank(owner) {
    let query = `SELECT * FROM user.bank WHERE owner = ? AND status = 'pending'`;
    const bankResult = await this.mySqlProvider.query(query, owner);
    if (bankResult[0]) throw new CustomError("You can't update or delete payment method while it's pending");
    await this.mySqlProvider.query(`DELETE FROM user.bank WHERE owner = ?`, owner);
  }

  async confirmBank({ owner, amount1, amount2 }) {
    let query = `SELECT * FROM user.bank WHERE owner = ? AND status = 'pending'`;
    const bankResult = await this.mySqlProvider.query(query, owner);
    if (!bankResult[0]) throw new CustomError("Unauthorized operation");

    let { confirmationAmount1, confirmationAmount2 } = bankResult[0];
    const test1 = amount1 == confirmationAmount1 && amount2 == confirmationAmount2;
    const test2 = amount1 == confirmationAmount2 && amount2 == confirmationAmount1;
    let { type, content, created } = await this.getLog(owner);

    if (!content) content = 0;
    const period = Math.round((Date.now() - Date.now(created || null)) / 1000 / 60 / 60 / 24);

    if (content >= 3 && period < 3) throw new CustomError(this.config.bankBlockingError);
    else if (content >= 3 && period >= 3) {
      content = 0;
      created = Formatter.dateToString(null);
    }

    query = `UPDATE user.bank SET status = 'confirmed' WHERE owner = ?`;
    if (test1 || test2) return await this.mySqlProvider.query(query, owner);

    this.saveLog({ owner, type, content: content + 1, created });
    throw new CustomError(this.config.bankConfirmError.replace("xxx", 2 - content));
  }
  async getLog(owner) {
    const noteResult = await this.mySqlProvider.query(`SELECT * FROM archive.log WHERE owner = ?`, owner);
    if (typeof noteResult[0].content == "object") noteResult[0].content = JSON.parse(note);
    return noteResult[0];
  }
  async saveLog(log) {
    if (typeof log.content == "object") log.content = JSON.stringify(log.content);
    await this.mySqlProvider.query(`REPLACE INTO archive.log SET ?`, log);
  }
}

module.exports = AccountRepository;

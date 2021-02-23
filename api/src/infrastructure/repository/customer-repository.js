class CustomerRepository {
  constructor(mySqlProvider) {
    this.mySqlProvider = mySqlProvider;
  }

  async createContact(contact) {
    let query = `INSERT INTO user.contact SET ?`;
    await this.mySqlProvider.query(query, contact);
  }
}

module.exports = CustomerRepository;

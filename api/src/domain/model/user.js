class User {
  constructor(user) {
    this.ip = user.ip;
    this.id = user.id + "";
    this.email = user.email;
    this.type = user.type;
    this.displayName = user.displayName;
  }
}

module.exports = User;

const view = require("./product.hbs");

module.exports = async function ({ url, user, headers }, response) {
  try {
    headers["c-code"] = user.country;
    const product = await this.fetch(this.apiService + url, { headers }).then((res) => res.json());
    if (!product) response.status(400).send(this.notFoundPage(user));
    else if (product.error) response.status(400).send(this.notFoundPage(user, product.error));
    else response.send(view({ user }, product));
  } catch (error) {
    response.status(400).send(this.notFoundPage(user, error.message));
  }
};

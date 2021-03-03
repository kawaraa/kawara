const view = require("./product.hbs");

module.exports = async function ({ url, user, headers }, response) {
  try {
    const res = await this.fetch(this.apiService + url, { headers }).then((res) => res.json());
    if (!res || !res.product) response.status(400).send(this.notFoundPage(user));
    else if (res.error) response.status(400).send(this.notFoundPage(user, res.error));
    else response.send(view({ user }, res));
  } catch (error) {
    response.status(400).send(this.notFoundPage(user, error.message));
  }
};

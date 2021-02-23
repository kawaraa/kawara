const view = require("./category.hbs");

module.exports = async function ({ url, user, headers }, response) {
  url = this.apiService + "/product" + url;
  try {
    headers["c-code"] = user.country;
    const category = await this.fetch(url, { headers }).then((res) => res.json());
    if (category.error) response.status(400).send(this.notFoundPage(user, category.error));
    else response.send(view({ user }, category));
  } catch (error) {
    response.status(400).send(this.notFoundPage(user, error.message));
  }
};

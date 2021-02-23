const view = require("./search.hbs");

module.exports = async function ({ url, user, headers }, response) {
  url = this.apiService + url.replace("/search", "/product");
  try {
    headers["c-code"] = user.country;
    const data = await this.fetch(url, { headers }).then((res) => res.json());
    if (data.error) response.status(400).send(this.notFoundPage(user, data.error));
    else response.send(view({ user }, data));
  } catch (error) {
    response.status(400).send(this.notFoundPage(user, error.message));
  }
};

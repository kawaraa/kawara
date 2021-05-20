const view = require("./category.hbs");
const categories = env.categories;

module.exports = async function ({ url, user, headers, params }, response) {
  url = this.apiService + "/product" + url;
  try {
    if (!categories[params.name]) return response.status(400).send(this.notFoundPage(user));
    const category = await this.fetch(url, { headers }).then((res) => res.json());
    if (category.error) response.status(400).send(this.notFoundPage(user, category.error));
    else response.send(view({ user }, category));
  } catch (error) {
    response.status(400).send(this.notFoundPage(user, error.message));
    this.logger.error(error);
  }
};

const view = require("./complete.hbs");

module.exports = async function ({ url, user, headers }, response) {
  try {
    headers["x-code"] = user.country;
    const res = await this.fetch(this.apiService + url, { headers }).then((res) => res.json());
    if (res.error) response.status(400).send(view({ user }, res.error));
    else response.send(view({ user }, res.message));
  } catch (error) {
    response.status(400).send(view({ user }, error.message));
  }
};

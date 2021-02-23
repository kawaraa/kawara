module.exports = () => {
  const config = { ...require("./config.json"), ...require("./variable.json"), ...process.env };

  config.publicDir = process.cwd() + config.publicDir;

  global.env = config;
};

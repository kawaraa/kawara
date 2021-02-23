class MysqlDatabaseBackupCron {
  constructor(storageProvider) {
    this.spawn = require("child_process").spawn;
    this.storageProvider = storageProvider;
    this.config = { ...env.mysqlDatabaseBackupCron, ...env.MYSQL };
    this.period = this.config.days * 24 * 60 * 60 * 1000;
  }
  async schedule() {
    try {
      const storageStream = this.storageProvider.storage
        .file(this.config.backupFileName)
        .createWriteStream({ resumable: false });

      const dbStream = this.spawn("mysqldump", [
        `-u${this.config.user}`,
        `-p${this.config.password}`,
        "--databases",
        "user",
        "feeds",
        "archive",
        "portfolio",
      ]);

      dbStream.stdout
        .pipe(storageStream)
        .on("finish", () => console.log("Finished backing up database successfully."))
        .on("error", (error) => console.error("Failed backing up database: ", error));

      setTimeout(this.schedule, this.period);
    } catch (error) {
      console.error("Error: ", error);
    }
  }
}

module.exports = MysqlDatabaseBackupCron;

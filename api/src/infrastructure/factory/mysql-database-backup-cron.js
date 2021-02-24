class MysqlDatabaseBackupCron {
  constructor(storageProvider) {
    this.spawn = require("child_process").spawn;
    this.storageProvider = storageProvider;
    this.config = { ...env.mysqlDatabaseBackupCron, ...env.MYSQL };
    this.period = this.config.days * 24 * 60 * 60 * 1000;
  }
  async schedule() {
    try {
      await Promise.all(this.config.databases.map((database) => this.backupDatabase(database)));
      setTimeout(this.schedule, this.period);
    } catch (error) {
      console.error("Error: ", error);
    }
  }
  backupDatabase(database) {
    return new Promise((resolve, reject) => {
      const storageStream = this.storageProvider.storage
        .file(this.config.databaseFileName.replace("xxx", database))
        .createWriteStream({ resumable: false });

      const dbStream = this.spawn("mysqldump", [
        `-u${this.config.user}`,
        `-p${this.config.password}`,
        "--databases",
        database,
      ]);

      dbStream.stdout
        .pipe(storageStream)
        .on("finish", () => {
          console.log(`Finished backing up ${database} database successfully.`);
          resolve();
        })
        .on("error", (error) => {
          console.error(`Failed backing up ${database} database: `, error);
          reject();
        });
    });
  }
}

module.exports = MysqlDatabaseBackupCron;

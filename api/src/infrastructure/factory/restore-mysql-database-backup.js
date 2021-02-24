class RestoreMysqlDatabaseBackup {
  constructor(storageProvider) {
    this.fs = require("fs");
    this.spawn = require("child_process").spawn;
    this.storageProvider = storageProvider;
    this.config = { ...env.BACKUP_CRON, ...env.MYSQL };
    this.period = this.config.days * 24 * 60 * 60 * 1000;
  }
  run() {
    this.config.databases.forEach((database) => this.backupDatabase(database));
  }
  backupDatabase(database) {
    const databaseFileName = this.config.databaseFileName.replace("xxx", database);
    const databaseFilePath = __dirname + "/" + databaseFileName;
    this.storageProvider.cloudStorage
      .bucket(this.config.backupsBucketName)
      .file(databaseFileName)
      .createReadStream()
      .pipe(this.fs.createWriteStream(databaseFilePath))
      .on("error", (error) => console.error(`Failed to restore ${database} database: `, error))
      .on("finish", () => {
        this.spawn(`mysql < ${databaseFilePath}`).on("end", () => {
          this.fs.unlinkSync(databaseFilePath);
        });
        console.log(`Finished restoring ${database} database successfully.`);
      });
  }
}

module.exports = RestoreMysqlDatabaseBackup;

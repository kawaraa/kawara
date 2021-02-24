class MysqlDatabaseBackupCron {
  constructor(storageProvider) {
    this.spawn = require("child_process").spawn;
    this.storageProvider = storageProvider;
    this.config = { ...env.BACKUP_CRON, ...env.MYSQL };
    this.period = this.config.days * 24 * 60 * 60 * 1000;
  }
  schedule() {
    this.config.databases.forEach((database) => this.backupDatabase(database));
    setTimeout(this.schedule, this.period);
  }
  backupDatabase(database) {
    const storageStream = this.storageProvider.cloudStorage
      .bucket(this.config.backupsBucketName)
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
      .on("finish", () => console.log(`Finished backing up ${database} database successfully.`))
      .on("error", (error) => console.error(`Failed backing up ${database} database: `, error));
  }
}

module.exports = MysqlDatabaseBackupCron;

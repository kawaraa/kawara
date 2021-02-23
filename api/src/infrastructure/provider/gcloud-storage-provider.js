"use strict";

class GCloudStorageProvider {
  constructor(gCloud, promisify) {
    this.storage = null;
    this.promisify = promisify;
    this.config = env.GCLOUD;
    this.initialize(gCloud);
  }

  initialize(gCloud) {
    const cloudStorage = new gCloud.Storage(this.config);
    // cloudStorage.getBuckets().then(console.log).catch(console.log); // testing the connection by getting the all buckets
    this.storage = cloudStorage.bucket(this.config.bucketName);
  }
}

module.exports = GCloudStorageProvider;

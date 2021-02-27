const { promisify } = require("util");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const gCloud = require("@google-cloud/storage");
const nodemailer = require("nodemailer");
const Stripe = require("stripe");
const paypal = require("paypal-rest-sdk");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const MysqlDatabaseProvider = require("./infrastructure/provider/mysql-database-provider");
const GCloudStorageProvider = require("./infrastructure/provider/gcloud-storage-provider");
const Firewall = require("./infrastructure/firewall/firewall");
const CustomerRepository = require("./infrastructure/repository/customer-repository");
const AccountRepository = require("./infrastructure/repository/account-repository");
const AdminRepository = require("./infrastructure/repository/admin-repository");
const ProductRepository = require("./infrastructure/repository/product-repository");
const CheckoutRepository = require("./infrastructure/repository/checkout-repository");
const SellerRepository = require("./infrastructure/repository/seller-repository");
const BuyerRepository = require("./infrastructure/repository/buyer-repository");
// const MailResolver = require("./infrastructure/resolver/mail-resolver");
// const AddMemberResolver = require("./infrastructure/resolver/add-member-resolver");
// const CheckoutResolver = require("./infrastructure/resolver/checkout-resolver");
const CustomerResolver = require("./infrastructure/resolver/customer-resolver");
const AuthResolver = require("./infrastructure/resolver/auth-resolver");
const AccountResolver = require("./infrastructure/resolver/account-resolver");
const AdminResolver = require("./infrastructure/resolver/admin-resolver");
const ProductResolver = require("./infrastructure/resolver/product-resolver");
const CheckoutResolver = require("./infrastructure/resolver/checkout-resolver");
const SellerResolver = require("./infrastructure/resolver/seller-resolver");
const BuyerResolver = require("./infrastructure/resolver/buyer-resolver");

const MailHandler = require("./application/handler/mail-handler");
const DeleteAccountAndProductHandler = require("./application/handler/delete-account-and-product-handler");
const ScrapeHandler = require("./application/handler/scrape-handler");
const MysqlDatabaseBackupCron = require("./infrastructure/factory/mysql-database-backup-cron");
const RestoreMysqlDatabaseBackup = require("./infrastructure/factory/restore-mysql-database-backup");

module.exports = (router) => {
  // Providers
  const mySqlProvider = new MysqlDatabaseProvider(mysql, promisify);
  const storageProvider = new GCloudStorageProvider(gCloud, promisify);
  const firewall = new Firewall(cookie, jwt, fetch);

  // // Repositories
  const customerRepository = new CustomerRepository(mySqlProvider);
  const accountRepository = new AccountRepository(mySqlProvider);
  const adminRepository = new AdminRepository(mySqlProvider);
  const productRepository = new ProductRepository(mySqlProvider);
  const checkoutRepository = new CheckoutRepository(mySqlProvider);
  const sellerRepository = new SellerRepository(mySqlProvider);
  const buyerRepository = new BuyerRepository(mySqlProvider);

  // // Handlers
  const mailHandler = new MailHandler(nodemailer);
  const deleteAccountHandler = new DeleteAccountAndProductHandler(mySqlProvider, storageProvider);
  const scrapeHandler = new ScrapeHandler(fetch, cheerio);

  // // Resolvers
  const customerResolver = new CustomerResolver(router, firewall, customerRepository);
  const authResolver = new AuthResolver(router, firewall, accountRepository, mailHandler);
  const accountResolver = new AccountResolver(router, firewall, accountRepository, deleteAccountHandler);
  const adminResolver = new AdminResolver(router, firewall, adminRepository);
  // const userResolver = new UserResolver(router, firewall, accountRepository);
  const productResolver = new ProductResolver(router, firewall, productRepository);
  const checkoutResolver = new CheckoutResolver(
    router,
    firewall,
    checkoutRepository,
    mailHandler,
    Stripe,
    paypal
  );
  const sellerResolver = new SellerResolver(
    router,
    firewall,
    sellerRepository,
    deleteAccountHandler,
    storageProvider,
    mailHandler,
    scrapeHandler
  );
  const buyerResolver = new BuyerResolver(router, firewall, buyerRepository);
  customerResolver.resolve();
  authResolver.resolve();
  accountResolver.resolve();
  adminResolver.resolve();
  productResolver.resolve();
  checkoutResolver.resolve();
  sellerResolver.resolve();
  buyerResolver.resolve();

  router.use("*", (request, response) => response.status(404).end('{"error":"Not Found(!)"}'));

  // new MysqlDatabaseBackupCron(storageProvider).schedule();
  // new RestoreMysqlDatabaseBackup(storageProvider).run();
  return router;
};

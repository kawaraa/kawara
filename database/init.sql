CREATE DATABASE IF NOT EXISTS `user`;
USE `user`;

CREATE TABLE `account` (
  `id` VARCHAR(250),
  `type` ENUM('seller', 'buyer') NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(250) NOT NULL,
  `firstName` VARCHAR(20) NULL,
  `lastName` VARCHAR(20) NULL,
  `created` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `about` VARCHAR(250) NULL,
  `confirmed` TINYINT DEFAULT 0,
  PRIMARY KEY(`id`)
);

CREATE TABLE `address` (
  `id` VARCHAR(250),
  `owner` VARCHAR(250) NOT NULL,
  `fullName` VARCHAR(40) NULL,
  `street` VARCHAR(150) NULL,
  `city` VARCHAR(85) NULL,
  `postalCode` VARCHAR(10) NULL,
  `state` VARCHAR(85) NULL,
  `country` VARCHAR(2) NOT NULL,
  `email` VARCHAR(100) NULL,
  `phone` VARCHAR(15) NULL,
  PRIMARY KEY(`id`)
);

CREATE TABLE `bank` (
  `owner` VARCHAR(250) NOT NULL,
  `country` VARCHAR(2) NOT NULL,
  `type` ENUM('bank', 'paypal') NOT NULL,
  `accountHolder` VARCHAR(40) NOT NULL,
  `routingNumber` VARCHAR(100) NULL,
  `accountNumber` VARCHAR(100) NOT NULL,
  `bic` VARCHAR(11) NULL,
  `confirmationAmount1` INT NULL,
  `confirmationAmount2` INT NULL,
  `status` ENUM('initial', 'pending', 'confirmed') DEFAULT 'initial',
  `created` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `note` VARCHAR(250) NULL,
  PRIMARY KEY(`owner`)
);

CREATE TABLE `contact` (
  `id` VARCHAR(250) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `country` VARCHAR(2) NULL,
  `name` VARCHAR(40) NOT NULL,
  `subject` VARCHAR(50) NULL,
  `message` VARCHAR(250) NOT NULL,
  `solved` TINYINT DEFAULT 0,
  `created` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `note` VARCHAR(250) NULL,
  PRIMARY KEY(`id`)
);

CREATE DATABASE IF NOT EXISTS `store`;
USE `store`;

CREATE TABLE `product` (
  `owner` VARCHAR(250) NOT NULL,
  `number` VARCHAR(250) NOT NULL,
  `name` VARCHAR(250) NOT NULL,
  `pictures` TEXT NOT NULL,
  `video` VARCHAR(250) NULL,
  `description` TEXT NOT NULL,
  `source` TEXT NOT NULL,
  `created` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reviewed` TINYINT DEFAULT 0,
  PRIMARY KEY(`number`)
);

CREATE TABLE `type` (
  `productNumber` VARCHAR(250) NOT NULL,
  `type` TEXT NOT NULL,
  `size` VARCHAR(250) NOT NULL,
  `price` INT NOT NULL,
  `inStock` INT NOT NULL
);

CREATE TABLE `specification` (
  `productNumber` VARCHAR(250) NOT NULL,
  `title` VARCHAR(30) NOT NULL,
  `description` VARCHAR(30) NOT NULL,
  PRIMARY KEY(`productNumber`, `title`)
);

CREATE TABLE `shipping` (
  `productNumber` VARCHAR(250) NOT NULL,
  `country` VARCHAR(2) NOT NULL,
  `estimatedTime` TINYINT NOT NULL,
  `cost` INT NOT NULL,
   PRIMARY KEY(`productNumber`, `country`)
);

CREATE TABLE `starRating` (
  `user` VARCHAR(100) NOT NULL,
  `productNumber` VARCHAR(250) NOT NULL,
  `stars` DECIMAL(3, 2) NOT NULL,
  PRIMARY KEY(`user`, `productNumber`)
);

CREATE TABLE `category` (
  `productNumber` VARCHAR(250) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  PRIMARY KEY(`productNumber`, `name`)
);

CREATE TABLE `subCategory` (
  `productNumber` VARCHAR(250) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  PRIMARY KEY(`productNumber`, `name`)
);

CREATE TABLE `order` (
  `id` VARCHAR(250) NOT NULL,
  `owner` VARCHAR(250) NOT NULL,
  `addressId` VARCHAR(250) NOT NULL,
  `paymentMethod` ENUM('card', 'ideal', 'paypal') NOT NULL,
  `total` INT NOT NULL,
  `currency` ENUM('USD', 'EUR') NOT NULL,
  `orderDate` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed` TINYINT DEFAULT 0,
  `note` VARCHAR(250) NULL,
  PRIMARY KEY(`id`)
);

CREATE TABLE `soldItem` (
  `id` VARCHAR(250) NOT NULL,
  `orderId` VARCHAR(250) NOT NULL,
  `shipmentId` VARCHAR(250) NULL,
  `productNumber` VARCHAR(250) NOT NULL,
  `name` VARCHAR(250) NOT NULL,
  `picture` TEXT NOT NULL,
  `type` TEXT NOT NULL,
  `size` VARCHAR(250) NOT NULL,
  `price` INT NOT NULL,
  `shippingCost` INT NOT NULL,
  `quantity` INT NOT NULL,
   PRIMARY KEY(`id`)
);
  
CREATE TABLE `shipment` (
  `id` VARCHAR(250) NOT NULL,
  `orderId` VARCHAR(250) NOT NULL,
  `carrier` VARCHAR(250) NOT NULL,
  `trackNumber` VARCHAR(100) NOT NULL,
  `shippingDate` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `deliveryDate` TIMESTAMP NULL,
  `note` VARCHAR(250) NULL,
  PRIMARY KEY(`id`)
);

CREATE TABLE `sale` (
  `owner` VARCHAR(250) NOT NULL,
  `soldItemId` VARCHAR(250) NOT NULL,
  `payout` INT DEFAULT 0,
  `payoutDate` TIMESTAMP NULL,
  PRIMARY KEY(`owner`, `soldItemId`)
);


CREATE DATABASE IF NOT EXISTS `archive`;
USE `archive`;

CREATE TABLE `report` (
  `id` VARCHAR(250) NOT NULL UNIQUE,
  `type` ENUM('payment', 'shipment', 'return', 'general') NOT NULL,
  `date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `description` TEXT NOT NULL,
  PRIMARY KEY(`id`)
);

CREATE TABLE `deleted` (
  `id` VARCHAR(250),
  `table` VARCHAR(250) NOT NULL,
  `content` TEXT NOT NULL,
  PRIMARY KEY(`id`)
);

-- To suport arabic language run the following commands
-- ALTER TABLE `product` MODIFY column `description` VARCHAR(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
-- ALTER TABLE `customer` MODIFY column `about` VARCHAR(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
-- ALTER TABLE `order` MODIFY column `note` VARCHAR(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
-- costPrice, wholesalePrice, retailPrice
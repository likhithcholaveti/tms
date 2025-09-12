-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: transportation_management
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Temporary view structure for view `active_ifsc_cache`
--

DROP TABLE IF EXISTS `active_ifsc_cache`;
/*!50001 DROP VIEW IF EXISTS `active_ifsc_cache`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `active_ifsc_cache` AS SELECT 
 1 AS `ifsc_code`,
 1 AS `bank_name`,
 1 AS `branch_name`,
 1 AS `branch_address`,
 1 AS `city`,
 1 AS `state`,
 1 AS `district`,
 1 AS `contact_number`,
 1 AS `micr_code`,
 1 AS `swift_code`,
 1 AS `cached_at`,
 1 AS `data_source`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `adhoc_transactions`
--

DROP TABLE IF EXISTS `adhoc_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adhoc_transactions` (
  `TransactionID` int NOT NULL AUTO_INCREMENT,
  `TripType` varchar(20) NOT NULL,
  `TransactionDate` date NOT NULL,
  `TripNo` varchar(50) NOT NULL,
  `CustomerID` int DEFAULT NULL,
  `ProjectID` int DEFAULT NULL,
  `VehicleNumber` varchar(20) DEFAULT NULL,
  `VehicleNumbers` json DEFAULT NULL,
  `VehicleType` varchar(50) DEFAULT NULL,
  `VehicleTypes` json DEFAULT NULL,
  `VendorName` varchar(100) DEFAULT NULL,
  `VendorNames` json DEFAULT NULL,
  `VendorNumber` varchar(10) DEFAULT NULL,
  `VendorNumbers` json DEFAULT NULL,
  `DriverName` varchar(100) DEFAULT NULL,
  `DriverNames` json DEFAULT NULL,
  `DriverNumber` varchar(10) DEFAULT NULL,
  `DriverNumbers` json DEFAULT NULL,
  `DriverAadharNumber` varchar(12) DEFAULT NULL,
  `DriverLicenceNumber` varchar(20) DEFAULT NULL,
  `DriverAadharDoc` varchar(255) DEFAULT NULL,
  `DriverLicenceDoc` varchar(255) DEFAULT NULL,
  `TollExpensesDoc` varchar(255) DEFAULT NULL,
  `ParkingChargesDoc` varchar(255) DEFAULT NULL,
  `ArrivalTimeAtHub` time DEFAULT NULL,
  `InTimeByCust` time DEFAULT NULL,
  `OutTimeFromHub` time DEFAULT NULL,
  `ReturnReportingTime` time DEFAULT NULL,
  `OutTimeFrom` time DEFAULT NULL,
  `OpeningKM` decimal(10,2) NOT NULL,
  `ClosingKM` decimal(10,2) NOT NULL,
  `TotalShipmentsForDeliveries` int DEFAULT NULL,
  `TotalShipmentDeliveriesAttempted` int DEFAULT NULL,
  `TotalShipmentDeliveriesDone` int DEFAULT NULL,
  `VFreightFix` decimal(10,2) DEFAULT NULL,
  `FixKm` decimal(10,2) DEFAULT NULL,
  `VFreightVariable` decimal(10,2) DEFAULT NULL,
  `TotalFreight` decimal(10,2) DEFAULT NULL,
  `TollExpenses` decimal(10,2) DEFAULT NULL,
  `ParkingCharges` decimal(10,2) DEFAULT NULL,
  `LoadingCharges` decimal(10,2) DEFAULT NULL,
  `UnloadingCharges` decimal(10,2) DEFAULT NULL,
  `OtherCharges` decimal(10,2) DEFAULT NULL,
  `OtherChargesRemarks` text,
  `TotalDutyHours` decimal(5,2) DEFAULT NULL,
  `AdvanceRequestNo` varchar(50) DEFAULT NULL,
  `AdvanceToPaid` decimal(10,2) DEFAULT NULL,
  `AdvanceApprovedAmount` decimal(10,2) DEFAULT NULL,
  `AdvanceApprovedBy` varchar(100) DEFAULT NULL,
  `AdvancePaidAmount` decimal(10,2) DEFAULT NULL,
  `AdvancePaidMode` varchar(20) DEFAULT NULL,
  `AdvancePaidDate` date DEFAULT NULL,
  `AdvancePaidBy` varchar(100) DEFAULT NULL,
  `EmployeeDetailsAdvance` text,
  `BalanceToBePaid` decimal(10,2) DEFAULT NULL,
  `BalancePaidAmount` decimal(10,2) DEFAULT NULL,
  `Variance` decimal(10,2) DEFAULT NULL,
  `BalancePaidDate` date DEFAULT NULL,
  `BalancePaidBy` varchar(100) DEFAULT NULL,
  `EmployeeDetailsBalance` text,
  `Revenue` decimal(10,2) DEFAULT NULL,
  `Margin` decimal(10,2) DEFAULT NULL,
  `MarginPercentage` decimal(5,2) DEFAULT NULL,
  `Status` varchar(20) DEFAULT 'Pending',
  `TripClose` tinyint(1) DEFAULT '0',
  `Remarks` text,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TransactionID`),
  UNIQUE KEY `unique_trip_no` (`TripNo`,`TransactionDate`),
  KEY `idx_transaction_date` (`TransactionDate`),
  KEY `idx_trip_no` (`TripNo`),
  KEY `idx_trip_type` (`TripType`),
  KEY `idx_vehicle_number` (`VehicleNumber`),
  KEY `idx_vendor_name` (`VendorName`),
  KEY `idx_driver_name` (`DriverName`),
  KEY `idx_driver_number` (`DriverNumber`),
  KEY `idx_status` (`Status`),
  KEY `idx_customer_ref` (`CustomerID`),
  KEY `idx_project_ref` (`ProjectID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `billing`
--

DROP TABLE IF EXISTS `billing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing` (
  `BillingID` int NOT NULL AUTO_INCREMENT,
  `InvoiceNo` varchar(100) NOT NULL,
  `InvoiceDate` date NOT NULL,
  `BillingPeriodStart` date NOT NULL,
  `BillingPeriodEnd` date NOT NULL,
  `CustomerID` int NOT NULL,
  `ProjectID` int DEFAULT NULL,
  `TotalTransactions` int DEFAULT '0',
  `TotalAmount` decimal(15,2) DEFAULT '0.00',
  `GSTRate` decimal(5,2) DEFAULT '18.00',
  `GSTAmount` decimal(15,2) DEFAULT '0.00',
  `GrandTotal` decimal(15,2) DEFAULT '0.00',
  `PaymentStatus` enum('Pending','Paid','Partial','Overdue') DEFAULT 'Pending',
  `DueDate` date DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`BillingID`),
  UNIQUE KEY `InvoiceNo` (`InvoiceNo`),
  KEY `CustomerID` (`CustomerID`),
  KEY `ProjectID` (`ProjectID`),
  KEY `idx_invoice_date` (`InvoiceDate`),
  KEY `idx_payment_status` (`PaymentStatus`),
  CONSTRAINT `billing_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE,
  CONSTRAINT `billing_ibfk_2` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `CustomerID` int NOT NULL AUTO_INCREMENT,
  `MasterCustomerName` varchar(255) NOT NULL DEFAULT 'Default Master',
  `Name` varchar(255) NOT NULL,
  `CustomerCode` varchar(100) NOT NULL,
  `CustomerMobileNo` varchar(15) DEFAULT NULL,
  `CustomerEmail` varchar(255) DEFAULT NULL,
  `CustomerContactPerson` varchar(255) DEFAULT NULL,
  `AlternateMobileNo` varchar(15) DEFAULT NULL,
  `CustomerGroup` varchar(100) DEFAULT NULL,
  `ServiceCode` varchar(100) DEFAULT NULL,
  `TypeOfServices` enum('Transportation','Warehousing','Both','Logistics','Industrial Transport','Retail Distribution','Other') DEFAULT 'Transportation',
  `CityName` varchar(255) DEFAULT NULL,
  `HouseFlatNo` varchar(100) DEFAULT NULL,
  `StreetLocality` varchar(255) DEFAULT NULL,
  `CustomerCity` varchar(100) DEFAULT NULL,
  `CustomerState` varchar(100) DEFAULT NULL,
  `CustomerPinCode` varchar(6) DEFAULT NULL,
  `CustomerCountry` varchar(100) DEFAULT 'India',
  `TypeOfBilling` enum('GST','Non-GST','RCM') DEFAULT 'RCM',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Locations` text,
  `CustomerSite` varchar(255) DEFAULT NULL,
  `Agreement` enum('Yes','No') DEFAULT 'No',
  `AgreementFile` varchar(500) DEFAULT NULL,
  `AgreementDate` date DEFAULT NULL,
  `AgreementTenure` int DEFAULT NULL,
  `AgreementExpiryDate` date DEFAULT NULL,
  `CustomerNoticePeriod` int DEFAULT NULL,
  `CogentNoticePeriod` int DEFAULT NULL,
  `CreditPeriod` int DEFAULT NULL,
  `Insurance` enum('Yes','No') DEFAULT 'No',
  `MinimumInsuranceValue` decimal(15,2) DEFAULT NULL,
  `CogentDebitClause` enum('Yes','No') DEFAULT 'No',
  `CogentDebitLimit` decimal(15,2) DEFAULT NULL,
  `BG` enum('Yes','No') DEFAULT 'No',
  `BGFile` varchar(500) DEFAULT NULL,
  `BGAmount` decimal(15,2) DEFAULT NULL,
  `BGDate` date DEFAULT NULL,
  `BGExpiryDate` date DEFAULT NULL,
  `BGBank` varchar(255) DEFAULT NULL,
  `BGReceivingByCustomer` text,
  `BGReceivingFile` varchar(500) DEFAULT NULL,
  `PO` text,
  `POFile` varchar(500) DEFAULT NULL,
  `PODate` date DEFAULT NULL,
  `POValue` decimal(15,2) DEFAULT NULL,
  `POTenure` int DEFAULT NULL,
  `POExpiryDate` date DEFAULT NULL,
  `Rates` text,
  `RatesAnnexureFile` varchar(500) DEFAULT NULL,
  `YearlyEscalationClause` enum('Yes','No') DEFAULT 'No',
  `GSTNo` varchar(15) DEFAULT NULL,
  `GSTRate` decimal(5,2) DEFAULT '18.00',
  `BillingTenure` varchar(50) DEFAULT NULL,
  `MISFormatFile` varchar(500) DEFAULT NULL,
  `KPISLAFile` varchar(500) DEFAULT NULL,
  `PerformanceReportFile` varchar(500) DEFAULT NULL,
  `CustomerRegisteredOfficeAddress` text,
  `CustomerCorporateOfficeAddress` text,
  `CogentProjectHead` varchar(255) DEFAULT NULL,
  `CogentProjectOpsManager` varchar(255) DEFAULT NULL,
  `CustomerImportantPersonAddress1` text,
  `CustomerImportantPersonAddress2` text,
  PRIMARY KEY (`CustomerID`),
  UNIQUE KEY `CustomerCode` (`CustomerCode`),
  KEY `idx_customer_group` (`CustomerGroup`),
  KEY `idx_agreement_expiry` (`AgreementExpiryDate`),
  KEY `idx_bg_expiry` (`BGExpiryDate`),
  KEY `idx_po_expiry` (`POExpiryDate`),
  KEY `idx_gst_no` (`GSTNo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_office_address`
--

DROP TABLE IF EXISTS `customer_office_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_office_address` (
  `CustomerOfficeAddressID` int NOT NULL AUTO_INCREMENT,
  `CustomerID` int NOT NULL,
  `OfficeType` varchar(100) DEFAULT NULL,
  `ContactPerson` varchar(255) DEFAULT NULL,
  `Department` varchar(255) DEFAULT NULL,
  `Designation` varchar(255) DEFAULT NULL,
  `Mobile` varchar(15) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `DOB` date DEFAULT NULL,
  `Address` text,
  PRIMARY KEY (`CustomerOfficeAddressID`),
  KEY `CustomerID` (`CustomerID`),
  CONSTRAINT `customer_office_address_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_key_contact`
--

DROP TABLE IF EXISTS `customer_key_contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_key_contact` (
  `CustomerKeyContactID` int NOT NULL AUTO_INCREMENT,
  `CustomerID` int NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Department` varchar(255) DEFAULT NULL,
  `Designation` varchar(255) DEFAULT NULL,
  `Location` varchar(255) DEFAULT NULL,
  `OfficeType` varchar(100) DEFAULT NULL,
  `Mobile` varchar(15) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `DOB` date DEFAULT NULL,
  `Address` text,
  PRIMARY KEY (`CustomerKeyContactID`),
  KEY `CustomerID` (`CustomerID`),
  CONSTRAINT `customer_key_contact_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_cogent_contact`
--

DROP TABLE IF EXISTS `customer_cogent_contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_cogent_contact` (
  `CustomerCogentContactID` int NOT NULL AUTO_INCREMENT,
  `CustomerID` int NOT NULL,
  `CustomerOwner` varchar(255) DEFAULT NULL,
  `ProjectHead` varchar(255) DEFAULT NULL,
  `OpsHead` varchar(255) DEFAULT NULL,
  `OpsManager` varchar(255) DEFAULT NULL,
  `Supervisor` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`CustomerCogentContactID`),
  KEY `CustomerID` (`CustomerID`),
  CONSTRAINT `customer_cogent_contact_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `driver`
--

DROP TABLE IF EXISTS `driver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver` (
  `DriverID` int NOT NULL AUTO_INCREMENT,
  `DriverName` varchar(255) NOT NULL,
  `DriverLicenceNo` varchar(50) NOT NULL,
  `VendorID` int DEFAULT NULL,
  `VehicleID` int DEFAULT NULL,
  `DriverMobileNo` varchar(15) DEFAULT NULL,
  `DriverAddress` text,
  `HouseFlatNo` varchar(100) DEFAULT NULL,
  `StreetLocality` varchar(255) DEFAULT NULL,
  `DriverCity` varchar(100) DEFAULT NULL,
  `DriverState` varchar(100) DEFAULT NULL,
  `DriverPinCode` varchar(6) DEFAULT NULL,
  `DriverCountry` varchar(100) DEFAULT 'India',
  `MedicalDate` date DEFAULT NULL,
  `LicenceExpiry` date DEFAULT NULL,
  `Status` enum('Active','Inactive','On Leave') DEFAULT 'Active',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `DriverSameAsVendor` enum('Same as Vendor','Separate') DEFAULT 'Separate',
  `DriverAlternateNo` varchar(15) DEFAULT NULL,
  `DriverLicenceIssueDate` date DEFAULT NULL,
  `DriverTotalExperience` int DEFAULT NULL,
  `DriverPhoto` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`DriverID`),
  UNIQUE KEY `DriverLicenceNo` (`DriverLicenceNo`),
  KEY `VendorID` (`VendorID`),
  KEY `idx_driver_status` (`Status`),
  CONSTRAINT `driver_ibfk_1` FOREIGN KEY (`VendorID`) REFERENCES `vendor` (`VendorID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fixed_transactions`
--

DROP TABLE IF EXISTS `fixed_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fixed_transactions` (
  `TransactionID` int NOT NULL AUTO_INCREMENT,
  `TripType` varchar(10) DEFAULT 'Fixed',
  `TransactionDate` date NOT NULL,
  `Shift` varchar(20) DEFAULT NULL,
  `VehicleIDs` json DEFAULT NULL,
  `DriverIDs` json DEFAULT NULL,
  `VendorID` int DEFAULT NULL,
  `CustomerID` int NOT NULL,
  `ProjectID` int DEFAULT NULL,
  `LocationID` int DEFAULT NULL,
  `ReplacementDriverID` int DEFAULT NULL,
  `ReplacementDriverName` varchar(100) DEFAULT NULL,
  `ReplacementDriverNo` varchar(10) DEFAULT NULL,
  `ArrivalTimeAtHub` time DEFAULT NULL,
  `InTimeByCust` time DEFAULT NULL,
  `OutTimeFromHub` time DEFAULT NULL,
  `ReturnReportingTime` time DEFAULT NULL,
  `OpeningKM` decimal(10,2) NOT NULL,
  `ClosingKM` decimal(10,2) NOT NULL,
  `TotalDeliveries` int DEFAULT NULL,
  `TotalDeliveriesAttempted` int DEFAULT NULL,
  `TotalDeliveriesDone` int DEFAULT NULL,
  `TotalDutyHours` decimal(5,2) DEFAULT NULL,
  `VFreightFix` decimal(10,2) DEFAULT NULL,
  `FixKm` decimal(10,2) DEFAULT NULL,
  `VFreightVariable` decimal(10,2) DEFAULT NULL,
  `TotalFreight` decimal(10,2) DEFAULT NULL,
  `TollExpenses` decimal(10,2) DEFAULT NULL,
  `ParkingCharges` decimal(10,2) DEFAULT NULL,
  `LoadingCharges` decimal(10,2) DEFAULT NULL,
  `UnloadingCharges` decimal(10,2) DEFAULT NULL,
  `OtherCharges` decimal(10,2) DEFAULT NULL,
  `OtherChargesRemarks` text,
  `AdvanceRequestNo` varchar(50) DEFAULT NULL,
  `AdvanceToPaid` decimal(10,2) DEFAULT NULL,
  `AdvanceApprovedAmount` decimal(10,2) DEFAULT NULL,
  `AdvanceApprovedBy` varchar(100) DEFAULT NULL,
  `AdvancePaidAmount` decimal(10,2) DEFAULT NULL,
  `AdvancePaidMode` varchar(20) DEFAULT NULL,
  `AdvancePaidDate` date DEFAULT NULL,
  `AdvancePaidBy` varchar(100) DEFAULT NULL,
  `EmployeeDetailsAdvance` text,
  `BalanceToBePaid` decimal(10,2) DEFAULT NULL,
  `BalancePaidAmount` decimal(10,2) DEFAULT NULL,
  `Variance` decimal(10,2) DEFAULT NULL,
  `BalancePaidDate` date DEFAULT NULL,
  `BalancePaidBy` varchar(100) DEFAULT NULL,
  `EmployeeDetailsBalance` text,
  `Revenue` decimal(10,2) DEFAULT NULL,
  `Margin` decimal(10,2) DEFAULT NULL,
  `MarginPercentage` decimal(5,2) DEFAULT NULL,
  `DriverAadharDoc` varchar(255) DEFAULT NULL,
  `DriverLicenceDoc` varchar(255) DEFAULT NULL,
  `TollExpensesDoc` varchar(255) DEFAULT NULL,
  `ParkingChargesDoc` varchar(255) DEFAULT NULL,
  `OutTimeFrom` time DEFAULT NULL,
  `TotalShipmentsForDeliveries` int DEFAULT NULL,
  `TotalShipmentDeliveriesAttempted` int DEFAULT NULL,
  `TotalShipmentDeliveriesDone` int DEFAULT NULL,
  `TripNo` varchar(50) DEFAULT NULL,
  `VehicleNumber` varchar(20) DEFAULT NULL,
  `VendorName` varchar(100) DEFAULT NULL,
  `VendorNumber` varchar(20) DEFAULT NULL,
  `DriverName` varchar(100) DEFAULT NULL,
  `DriverNumber` varchar(20) DEFAULT NULL,
  `DriverAadharNumber` varchar(20) DEFAULT NULL,
  `DriverLicenceNumber` varchar(20) DEFAULT NULL,
  `VehicleType` varchar(50) DEFAULT NULL,
  `HandlingCharges` decimal(10,2) DEFAULT NULL,
  `CompanyName` varchar(100) DEFAULT NULL,
  `GSTNo` varchar(20) DEFAULT NULL,
  `CustomerSite` varchar(255) DEFAULT NULL,
  `Location` varchar(255) DEFAULT NULL,
  `Remarks` text,
  `Status` varchar(20) DEFAULT 'Pending',
  `TripClose` tinyint(1) DEFAULT '0',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TransactionID`),
  KEY `idx_transaction_date` (`TransactionDate`),
  KEY `idx_customer_id` (`CustomerID`),
  KEY `idx_project_id` (`ProjectID`),
  KEY `idx_status` (`Status`),
  KEY `idx_trip_type` (`TripType`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ifsc_cache`
--

DROP TABLE IF EXISTS `ifsc_cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ifsc_cache` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ifsc_code` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `micr_code` varchar(9) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `swift_code` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cached_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_permanent` tinyint(1) DEFAULT '0' COMMENT 'True for manually maintained/verified records',
  `is_active` tinyint(1) DEFAULT '1',
  `data_source` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'api' COMMENT 'Source: api, manual, rbi, npci',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ifsc_code` (`ifsc_code`),
  KEY `idx_ifsc_code` (`ifsc_code`),
  KEY `idx_bank_name` (`bank_name`),
  KEY `idx_city_state` (`city`,`state`),
  KEY `idx_cached_at` (`cached_at`),
  KEY `idx_active` (`is_active`),
  KEY `idx_ifsc_lookup` (`ifsc_code`,`is_active`),
  KEY `idx_bank_search` (`bank_name`,`city`,`state`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `location`
--

DROP TABLE IF EXISTS `location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location` (
  `LocationID` int NOT NULL AUTO_INCREMENT,
  `CustomerID` int NOT NULL,
  `LocationName` varchar(255) NOT NULL,
  `Address` text,
  `LocationCode` varchar(100) DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`LocationID`),
  UNIQUE KEY `LocationCode` (`LocationCode`),
  KEY `CustomerID` (`CustomerID`),
  CONSTRAINT `location_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paymentcollection`
--

DROP TABLE IF EXISTS `paymentcollection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paymentcollection` (
  `PaymentID` int NOT NULL AUTO_INCREMENT,
  `BillingID` int NOT NULL,
  `PaymentDate` date NOT NULL,
  `PaymentAmount` decimal(15,2) NOT NULL,
  `PaymentMode` enum('Cash','Cheque','Online Transfer','UPI','Bank') NOT NULL,
  `PaymentReference` varchar(255) DEFAULT NULL,
  `Remarks` text,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`PaymentID`),
  KEY `BillingID` (`BillingID`),
  KEY `idx_payment_date` (`PaymentDate`),
  KEY `idx_payment_mode` (`PaymentMode`),
  CONSTRAINT `paymentcollection_ibfk_1` FOREIGN KEY (`BillingID`) REFERENCES `billing` (`BillingID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pincode_lookup`
--

DROP TABLE IF EXISTS `pincode_lookup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pincode_lookup` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pincode` varchar(6) NOT NULL,
  `area` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state` varchar(100) NOT NULL,
  `country` varchar(100) DEFAULT 'India',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_pincode_area` (`pincode`,`area`),
  KEY `idx_pincode` (`pincode`),
  KEY `idx_city` (`city`),
  KEY `idx_state` (`state`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `project`
--

DROP TABLE IF EXISTS `project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project` (
  `ProjectID` int NOT NULL AUTO_INCREMENT,
  `ProjectName` varchar(255) NOT NULL,
  `CustomerID` int NOT NULL,
  `ProjectCode` varchar(100) DEFAULT NULL,
  `ProjectDescription` text,
  `LocationID` int DEFAULT NULL,
  `ProjectValue` decimal(15,2) DEFAULT NULL,
  `StartDate` date DEFAULT NULL,
  `EndDate` date DEFAULT NULL,
  `Status` enum('Active','Inactive','Completed') DEFAULT 'Active',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ProjectID`),
  UNIQUE KEY `ProjectCode` (`ProjectCode`),
  KEY `CustomerID` (`CustomerID`),
  KEY `LocationID` (`LocationID`),
  CONSTRAINT `project_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE,
  CONSTRAINT `project_ibfk_2` FOREIGN KEY (`LocationID`) REFERENCES `location` (`LocationID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('customer','vendor','admin') NOT NULL DEFAULT 'customer',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vehicle`
--

DROP TABLE IF EXISTS `vehicle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle` (
  `VehicleID` int NOT NULL AUTO_INCREMENT,
  `VehicleRegistrationNo` varchar(20) NOT NULL,
  `VehicleCode` varchar(100) NOT NULL,
  `VehicleChasisNo` varchar(50) NOT NULL,
  `VehicleModel` varchar(100) NOT NULL,
  `TypeOfBody` enum('Open','CBD','Container') DEFAULT 'Open',
  `VehicleType` varchar(50) DEFAULT NULL,
  `VehicleRegistrationDate` date DEFAULT NULL,
  `VehicleAge` int DEFAULT NULL,
  `VehicleKMS` decimal(10,2) DEFAULT NULL,
  `VendorID` int DEFAULT NULL,
  `GPS` tinyint(1) DEFAULT '0',
  `GPSCompany` varchar(255) DEFAULT NULL,
  `NoEntryPass` enum('Yes','No') DEFAULT 'No',
  `NoEntryPassStartDate` date DEFAULT NULL,
  `NoEntryPassExpiry` date DEFAULT NULL,
  `LastServicing` date DEFAULT NULL,
  `RCUpload` varchar(512) DEFAULT NULL,
  `VehicleKMSPhoto` varchar(512) DEFAULT NULL,
  `VehiclePhoto` varchar(512) DEFAULT NULL,
  `VehiclePhotoFront` varchar(512) DEFAULT NULL,
  `VehiclePhotoBack` varchar(512) DEFAULT NULL,
  `VehiclePhotoLeftSide` varchar(512) DEFAULT NULL,
  `VehiclePhotoRightSide` varchar(512) DEFAULT NULL,
  `VehiclePhotoInterior` varchar(512) DEFAULT NULL,
  `VehiclePhotoEngine` varchar(512) DEFAULT NULL,
  `VehiclePhotoRoof` varchar(512) DEFAULT NULL,
  `VehiclePhotoDoor` varchar(512) DEFAULT NULL,
  `ServiceBillPhoto` varchar(512) DEFAULT NULL,
  `InsuranceCopy` varchar(512) DEFAULT NULL,
  `FitnessCertificateUpload` varchar(512) DEFAULT NULL,
  `PollutionPhoto` varchar(512) DEFAULT NULL,
  `StateTaxPhoto` varchar(512) DEFAULT NULL,
  `NoEntryPassCopy` varchar(512) DEFAULT NULL,
  `InsuranceInfo` text,
  `VehicleInsuranceCompany` varchar(255) DEFAULT NULL,
  `VehicleInsuranceDate` date DEFAULT NULL,
  `InsuranceExpiry` date DEFAULT NULL,
  `VehicleFitnessCertificateIssue` date DEFAULT NULL,
  `FitnessExpiry` date DEFAULT NULL,
  `VehiclePollutionDate` date DEFAULT NULL,
  `PollutionExpiry` date DEFAULT NULL,
  `StateTaxIssue` date DEFAULT NULL,
  `StateTaxExpiry` date DEFAULT NULL,
  `VehicleLoadingCapacity` decimal(10,2) DEFAULT NULL,
  `Status` enum('Active','Maintenance','Inactive') DEFAULT 'Active',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`VehicleID`),
  UNIQUE KEY `VehicleRegistrationNo` (`VehicleRegistrationNo`),
  UNIQUE KEY `VehicleCode` (`VehicleCode`),
  UNIQUE KEY `VehicleChasisNo` (`VehicleChasisNo`),
  KEY `VendorID` (`VendorID`),
  KEY `idx_vehicle_status` (`Status`),
  CONSTRAINT `vehicle_ibfk_1` FOREIGN KEY (`VendorID`) REFERENCES `vendor` (`VendorID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vehicle_freight`
--

DROP TABLE IF EXISTS `vehicle_freight`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_freight` (
  `VehicleFreightID` int NOT NULL AUTO_INCREMENT,
  `VehicleID` int NOT NULL,
  `FixRate` decimal(10,2) DEFAULT NULL,
  `FuelRate` decimal(10,2) DEFAULT NULL,
  `HandlingCharges` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`VehicleFreightID`),
  KEY `VehicleID` (`VehicleID`),
  CONSTRAINT `vehicle_freight_ibfk_1` FOREIGN KEY (`VehicleID`) REFERENCES `vehicle` (`VehicleID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vehicle_project_assignments`
--

DROP TABLE IF EXISTS `vehicle_project_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_project_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `project_id` int NOT NULL,
  `driver_id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `placement_type` varchar(50) DEFAULT 'Fixed',
  `assigned_by` varchar(100) DEFAULT 'System',
  `assignment_notes` text,
  `status` varchar(20) DEFAULT 'active',
  `assigned_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `customer_id` (`customer_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_driver_id` (`driver_id`),
  KEY `idx_status` (`status`),
  KEY `idx_assigned_date` (`assigned_date`),
  CONSTRAINT `vehicle_project_assignments_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle` (`VehicleID`) ON DELETE CASCADE,
  CONSTRAINT `vehicle_project_assignments_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `project` (`ProjectID`) ON DELETE CASCADE,
  CONSTRAINT `vehicle_project_assignments_ibfk_3` FOREIGN KEY (`driver_id`) REFERENCES `driver` (`DriverID`) ON DELETE CASCADE,
  CONSTRAINT `vehicle_project_assignments_ibfk_4` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`CustomerID`) ON DELETE SET NULL,
  CONSTRAINT `vehicle_project_assignments_ibfk_5` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`VendorID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vehicletransaction`
--

DROP TABLE IF EXISTS `vehicletransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicletransaction` (
  `TransactionID` int NOT NULL AUTO_INCREMENT,
  `TripType` enum('Fixed','Adhoc','Replacement') NOT NULL,
  `TransactionDate` date NOT NULL,
  `Shift` varchar(50) DEFAULT NULL,
  `VehicleID` int NOT NULL,
  `DriverID` int NOT NULL,
  `ReplacementDriverID` int DEFAULT NULL,
  `VendorID` int DEFAULT NULL,
  `CustomerID` int NOT NULL,
  `ProjectID` int DEFAULT NULL,
  `LocationID` int DEFAULT NULL,
  `ArrivalTimeAtHub` time DEFAULT NULL,
  `OpeningKM` decimal(10,2) DEFAULT NULL,
  `ClosingKM` decimal(10,2) DEFAULT NULL,
  `TotalKM` decimal(10,2) GENERATED ALWAYS AS ((`ClosingKM` - `OpeningKM`)) STORED,
  `FreightFix` decimal(15,2) DEFAULT NULL,
  `DeliveriesDone` int DEFAULT NULL,
  `TripNo` varchar(50) DEFAULT NULL,
  `FreightVariable` decimal(15,2) DEFAULT NULL,
  `AdvancePaid` decimal(15,2) DEFAULT NULL,
  `BalancePaid` decimal(15,2) DEFAULT NULL,
  `LoadingPoint` varchar(255) DEFAULT NULL,
  `UnloadingPoint` varchar(255) DEFAULT NULL,
  `MaterialType` varchar(255) DEFAULT NULL,
  `Remarks` text,
  `TotalFreight` decimal(15,2) GENERATED ALWAYS AS ((coalesce(`FreightFix`,0) + coalesce(`FreightVariable`,0))) STORED,
  `Status` enum('Pending','In Progress','Completed','Cancelled') DEFAULT 'Pending',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `InTimeByCust` time DEFAULT NULL,
  `OutTimeFromHub` time DEFAULT NULL,
  `ReturnReportingTime` time DEFAULT NULL,
  `TotalDeliveries` int DEFAULT NULL,
  `TotalDeliveriesAttempted` int DEFAULT NULL,
  `TotalDeliveriesDone` int DEFAULT NULL,
  `TotalDutyHours` decimal(5,2) DEFAULT NULL,
  `VehicleNumber` varchar(50) DEFAULT NULL COMMENT 'Manual vehicle number entry for Adhoc/Replacement',
  `VendorName` varchar(255) DEFAULT NULL COMMENT 'Manual vendor name entry for Adhoc/Replacement',
  `VendorNumber` varchar(10) DEFAULT NULL COMMENT 'Manual vendor mobile number for Adhoc/Replacement',
  `DriverName` varchar(255) DEFAULT NULL COMMENT 'Manual driver name entry for Adhoc/Replacement',
  `DriverNumber` varchar(10) DEFAULT NULL COMMENT 'Manual driver mobile number for Adhoc/Replacement',
  `DriverAadharNumber` varchar(12) DEFAULT NULL COMMENT 'Driver Aadhar number for Adhoc/Replacement',
  `DriverAadharDoc` varchar(500) DEFAULT NULL COMMENT 'Driver Aadhar document file path',
  `DriverLicenceNumber` varchar(50) DEFAULT NULL COMMENT 'Driver licence number for Adhoc/Replacement',
  `DriverLicenceDoc` varchar(500) DEFAULT NULL COMMENT 'Driver licence document file path',
  `TotalShipmentsForDeliveries` int DEFAULT NULL COMMENT 'Total shipments for deliveries',
  `TotalShipmentDeliveriesAttempted` int DEFAULT NULL COMMENT 'Total shipment deliveries attempted',
  `TotalShipmentDeliveriesDone` int DEFAULT NULL COMMENT 'Total shipment deliveries completed',
  `VFreightFix` decimal(15,2) DEFAULT NULL COMMENT 'V.Freight (Fix) amount',
  `FixKm` decimal(10,2) DEFAULT NULL COMMENT 'Fix KM if any',
  `VFreightVariable` decimal(15,2) DEFAULT NULL COMMENT 'V.Freight (Variable - Per KM)',
  `TollExpenses` decimal(15,2) DEFAULT NULL COMMENT 'Toll expenses amount',
  `TollExpensesDoc` varchar(500) DEFAULT NULL COMMENT 'Toll expenses document file path',
  `ParkingCharges` decimal(15,2) DEFAULT NULL COMMENT 'Parking charges amount',
  `ParkingChargesDoc` varchar(500) DEFAULT NULL COMMENT 'Parking charges document file path',
  `LoadingCharges` decimal(15,2) DEFAULT NULL COMMENT 'Loading charges amount',
  `UnloadingCharges` decimal(15,2) DEFAULT NULL COMMENT 'Unloading charges amount',
  `OtherCharges` decimal(15,2) DEFAULT NULL COMMENT 'Other charges if any',
  `OtherChargesRemarks` text COMMENT 'Remarks for other charges',
  `OutTimeFrom` time DEFAULT NULL COMMENT 'Out time from location',
  `TotalFreightCalculated` decimal(15,2) DEFAULT NULL COMMENT 'Auto-calculated total freight',
  `AdvanceRequestNo` varchar(100) DEFAULT NULL COMMENT 'Advance request number',
  `AdvanceToPaid` decimal(15,2) DEFAULT NULL COMMENT 'Advance amount to be paid',
  `AdvanceApprovedAmount` decimal(15,2) DEFAULT NULL COMMENT 'Advance approved amount',
  `AdvanceApprovedBy` varchar(255) DEFAULT NULL COMMENT 'Advance approved by person',
  `AdvancePaidAmount` decimal(15,2) DEFAULT NULL COMMENT 'Advance paid amount',
  `AdvancePaidMode` enum('UPI','Bank Transfer') DEFAULT NULL COMMENT 'Advance payment mode',
  `AdvancePaidDate` date DEFAULT NULL COMMENT 'Advance payment date',
  `AdvancePaidBy` varchar(255) DEFAULT NULL COMMENT 'Advance paid by person',
  `EmployeeDetailsAdvance` text COMMENT 'Employee details if advance paid by employee',
  `BalanceToBePaid` decimal(15,2) DEFAULT NULL COMMENT 'Balance amount to be paid (calculated)',
  `BalancePaidAmount` decimal(15,2) DEFAULT NULL COMMENT 'Balance paid amount',
  `Variance` decimal(15,2) DEFAULT NULL COMMENT 'Variance if any (calculated)',
  `BalancePaidDate` date DEFAULT NULL COMMENT 'Balance payment date',
  `BalancePaidBy` varchar(255) DEFAULT NULL COMMENT 'Balance paid by person',
  `EmployeeDetailsBalance` text COMMENT 'Employee details if balance paid by employee',
  `Revenue` decimal(15,2) DEFAULT NULL COMMENT 'Revenue (calculated)',
  `Margin` decimal(15,2) DEFAULT NULL COMMENT 'Margin (calculated)',
  `MarginPercentage` decimal(5,2) DEFAULT NULL COMMENT 'Margin percentage (calculated)',
  `TripClose` tinyint(1) DEFAULT '0' COMMENT 'Trip close status',
  `ReplacementDriverName` varchar(255) DEFAULT NULL COMMENT 'Manual replacement driver name',
  `ReplacementDriverNo` varchar(10) DEFAULT NULL COMMENT 'Manual replacement driver number',
  PRIMARY KEY (`TransactionID`),
  KEY `idx_transaction_date` (`TransactionDate`),
  KEY `idx_trip_type` (`TripType`),
  KEY `idx_vehicle_id` (`VehicleID`),
  KEY `idx_driver_id` (`DriverID`),
  KEY `idx_vendor_id` (`VendorID`),
  KEY `idx_customer_id` (`CustomerID`),
  KEY `idx_project_id` (`ProjectID`),
  KEY `idx_location_id` (`LocationID`),
  KEY `vehicletransaction_ibfk_8` (`ReplacementDriverID`),
  KEY `idx_trip_type_date` (`TripType`,`TransactionDate`),
  KEY `idx_vehicle_number` (`VehicleNumber`),
  KEY `idx_driver_number` (`DriverNumber`),
  KEY `idx_vendor_number` (`VendorNumber`),
  KEY `idx_trip_close` (`TripClose`),
  KEY `idx_advance_paid_date` (`AdvancePaidDate`),
  KEY `idx_balance_paid_date` (`BalancePaidDate`),
  CONSTRAINT `vehicletransaction_ibfk_1` FOREIGN KEY (`VehicleID`) REFERENCES `vehicle` (`VehicleID`) ON DELETE CASCADE,
  CONSTRAINT `vehicletransaction_ibfk_2` FOREIGN KEY (`DriverID`) REFERENCES `driver` (`DriverID`) ON DELETE CASCADE,
  CONSTRAINT `vehicletransaction_ibfk_3` FOREIGN KEY (`VendorID`) REFERENCES `vendor` (`VendorID`) ON DELETE CASCADE,
  CONSTRAINT `vehicletransaction_ibfk_4` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE,
  CONSTRAINT `vehicletransaction_ibfk_5` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`) ON DELETE SET NULL,
  CONSTRAINT `vehicletransaction_ibfk_6` FOREIGN KEY (`LocationID`) REFERENCES `location` (`LocationID`) ON DELETE SET NULL,
  CONSTRAINT `vehicletransaction_ibfk_7` FOREIGN KEY (`ReplacementDriverID`) REFERENCES `driver` (`DriverID`),
  CONSTRAINT `vehicletransaction_ibfk_8` FOREIGN KEY (`ReplacementDriverID`) REFERENCES `driver` (`DriverID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vendor`
--

DROP TABLE IF EXISTS `vendor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor` (
  `VendorID` int NOT NULL AUTO_INCREMENT,
  `VendorName` varchar(255) NOT NULL,
  `VendorCode` varchar(100) NOT NULL,
  `VendorMobileNo` varchar(15) NOT NULL,
  `VendorAddress` text NOT NULL,
  `HouseFlatNo` varchar(100) DEFAULT NULL,
  `StreetLocality` varchar(255) DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `State` varchar(100) DEFAULT NULL,
  `PinCode` varchar(6) DEFAULT NULL,
  `Country` varchar(100) DEFAULT 'India',
  `VendorAlternateNo` varchar(20) DEFAULT NULL,
  `TypeOfCompany` varchar(100) NOT NULL,
  `CompanyName` varchar(255) DEFAULT NULL,
  `CompanyGST` varchar(20) DEFAULT NULL,
  `VendorCompanyUdhyam` varchar(50) DEFAULT NULL,
  `VendorCompanyPAN` varchar(10) DEFAULT NULL,
  `StartDateOfCompany` date DEFAULT NULL,
  `AddressOfCompany` text,
  `VendorAadhar` varchar(12) DEFAULT NULL,
  `VendorPAN` varchar(10) DEFAULT NULL,
  `BankDetails` text,
  `AccountHolderName` varchar(100) DEFAULT NULL,
  `AccountNumber` varchar(20) DEFAULT NULL,
  `IFSCCode` varchar(11) DEFAULT NULL,
  `BankName` varchar(100) DEFAULT NULL,
  `BranchName` varchar(100) DEFAULT NULL,
  `BranchAddress` text,
  `BankCity` varchar(50) DEFAULT NULL,
  `BankState` varchar(50) DEFAULT NULL,
  `VendorPhoto` varchar(512) DEFAULT NULL,
  `VendorAadharDoc` varchar(512) DEFAULT NULL,
  `VendorPANDoc` varchar(512) DEFAULT NULL,
  `VendorCompanyUdhyamDoc` varchar(512) DEFAULT NULL,
  `VendorCompanyPANDoc` varchar(512) DEFAULT NULL,
  `VendorCompanyGSTDoc` varchar(512) DEFAULT NULL,
  `CompanyLegalDocs` varchar(512) DEFAULT NULL,
  `BankChequeUpload` varchar(512) DEFAULT NULL,
  `Status` varchar(20) DEFAULT 'active',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `project_id` int DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  PRIMARY KEY (`VendorID`),
  UNIQUE KEY `VendorCode` (`VendorCode`),
  KEY `idx_vendor_mobile` (`VendorMobileNo`),
  KEY `project_id` (`project_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `vendor_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`ProjectID`),
  CONSTRAINT `vendor_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`CustomerID`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `active_ifsc_cache`
--

/*!50001 DROP VIEW IF EXISTS `active_ifsc_cache`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `active_ifsc_cache` AS select `ifsc_cache`.`ifsc_code` AS `ifsc_code`,`ifsc_cache`.`bank_name` AS `bank_name`,`ifsc_cache`.`branch_name` AS `branch_name`,`ifsc_cache`.`branch_address` AS `branch_address`,`ifsc_cache`.`city` AS `city`,`ifsc_cache`.`state` AS `state`,`ifsc_cache`.`district` AS `district`,`ifsc_cache`.`contact_number` AS `contact_number`,`ifsc_cache`.`micr_code` AS `micr_code`,`ifsc_cache`.`swift_code` AS `swift_code`,`ifsc_cache`.`cached_at` AS `cached_at`,`ifsc_cache`.`data_source` AS `data_source` from `ifsc_cache` where (`ifsc_cache`.`is_active` = true) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-05 17:03:16

-- ===============================================
-- CHANGELOG - Database Updates After Initial Schema
-- ===============================================
--
-- This section documents any changes made to the database after the initial schema import.
-- Update this section whenever you make structural changes to the database.
--
-- Last Updated: 2025-09-05 17:52:00
--
-- CHANGES MADE:
-- 1. Fixed vehicle table column name issues in backend code (no schema changes)
--    - Backend was using VehicleInsuranceExpiry instead of InsuranceExpiry
--    - Backend was using VehicleFitnessCertificateExpiry instead of FitnessExpiry
--    - Backend was using VehiclePollutionExpiry instead of PollutionExpiry
--    - Fixed in backend/routes/vehicle.js
--
-- 2. Data additions through application usage:
--    - Added 1 new customer (CustomerID: 7)
--    - Added 1 new driver
--    - Added 1 new location
--    - Added 1 new project
--    - Added 2 new users
--    - Added 1 new vehicle (VehicleID: 7)
--    - Added 1 new vendor
--
-- CURRENT AUTO_INCREMENT VALUES (as of 2025-09-05 17:52:00):
-- - Customer: 8
-- - Driver: 9
-- - Location: 4
-- - Project: 14
-- - Users: 10
-- - Vehicle: 8
-- - Vendor: 16
--
-- NOTE: No structural schema changes have been made. All changes are operational data.
-- The database structure remains exactly as defined in the original schema.
--
-- ===============================================
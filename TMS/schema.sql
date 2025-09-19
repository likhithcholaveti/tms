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
  `BillingTenure` varchar(50) NOT NULL,
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
</create_file>

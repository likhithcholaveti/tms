const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function debugSchema() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'transportation_management',
  });

  try {
    console.log('🔍 Debugging Customer table schema...\n');

    // Get table structure
    const [columns] = await pool.query('DESCRIBE Customer');
    console.log(`📊 Total columns in Customer table: ${columns.length}`);
    console.log('📋 Column names:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field}`);
    });

    // Check the INSERT query columns count
    const insertColumns = [
      'MasterCustomerName', 'Name', 'CustomerCode', 'CustomerMobileNo', 'CustomerEmail', 'CustomerContactPerson',
      'AlternateMobileNo', 'CustomerGroup', 'ServiceCode', 'TypeOfServices', 'CityName', 'HouseFlatNo', 'StreetLocality',
      'CustomerCity', 'CustomerState', 'CustomerPinCode', 'CustomerCountry', 'TypeOfBilling', 'Locations', 'CustomerSite', 'Agreement',
      'AgreementFile', 'AgreementDate', 'AgreementTenure', 'AgreementExpiryDate', 'CustomerNoticePeriod',
      'CogentNoticePeriod', 'CreditPeriod', 'Insurance', 'MinimumInsuranceValue', 'CogentDebitClause', 'CogentDebitLimit',
      'BG', 'BGFile', 'BGAmount', 'BGDate', 'BGExpiryDate', 'BGBank', 'BGReceivingByCustomer', 'BGReceivingFile',
      'PO', 'POFile', 'PODate', 'POValue', 'POTenure', 'POExpiryDate', 'Rates', 'RatesAnnexureFile',
      'YearlyEscalationClause', 'GSTNo', 'GSTRate', 'BillingTenure', 'MISFormatFile', 'KPISLAFile', 'PerformanceReportFile',
      'CustomerRegisteredOfficeAddress', 'CustomerCorporateOfficeAddress', 'CogentProjectHead', 'CogentProjectOpsManager',
      'CustomerImportantPersonAddress1', 'CustomerImportantPersonAddress2'
    ];

    console.log(`\n📊 INSERT query columns count: ${insertColumns.length}`);
    console.log('📋 INSERT column names:');
    insertColumns.forEach((col, index) => {
      console.log(`${index + 1}. ${col}`);
    });

    // Find missing columns
    const existingColumnNames = columns.map(col => col.Field);
    const missingColumns = insertColumns.filter(col => !existingColumnNames.includes(col));

    if (missingColumns.length > 0) {
      console.log('\n❌ Columns in INSERT but not in table:', missingColumns);
    } else {
      console.log('\n✅ All INSERT columns exist in table');
    }

    // Find extra columns in table
    const extraColumns = existingColumnNames.filter(col => !insertColumns.includes(col));

    if (extraColumns.length > 0) {
      console.log('\n⚠️ Columns in table but not in INSERT:', extraColumns);
    } else {
      console.log('\n✅ No extra columns in table');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugSchema();

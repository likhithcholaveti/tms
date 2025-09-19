const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function checkTableSchema() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'transportation_management',
  });

  try {
    console.log('🔍 Checking Customer table schema...\n');

    // Test connection
    console.log('🔗 Testing database connection...');
    await pool.getConnection();
    console.log('✅ Database connection successful\n');

    // Get table structure
    const [columns] = await pool.query('DESCRIBE Customer');
    console.log('📋 Customer table columns:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} - ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Default ? `Default: ${col.Default}` : ''}`);
    });

    console.log(`\n📊 Total columns: ${columns.length}`);

    // Check if all expected columns exist
    const expectedColumns = [
      'MasterCustomerName', 'Name', 'CustomerCode', 'ServiceCode', 'TypeOfServices', 'Locations', 'CustomerSite',
      'CustomerMobileNo', 'AlternateMobileNo', 'CustomerEmail', 'CustomerContactPerson', 'CustomerGroup', 'CityName',
      'HouseFlatNo', 'StreetLocality', 'CustomerCity', 'CustomerState', 'CustomerPinCode', 'CustomerCountry',
      'Agreement', 'AgreementFile', 'AgreementDate', 'AgreementTenure', 'AgreementExpiryDate',
      'CustomerNoticePeriod', 'CogentNoticePeriod', 'CreditPeriod', 'Insurance', 'MinimumInsuranceValue',
      'CogentDebitClause', 'CogentDebitLimit', 'BG', 'BGFile', 'BGAmount', 'BGDate', 'BGExpiryDate',
      'BGBank', 'BGReceivingByCustomer', 'BGReceivingFile', 'PO', 'POFile', 'PODate', 'POValue', 'POTenure',
      'POExpiryDate', 'Rates', 'RatesAnnexureFile', 'YearlyEscalationClause', 'GSTNo', 'GSTRate', 'TypeOfBilling', 'BillingTenure',
      'MISFormatFile', 'KPISLAFile', 'PerformanceReportFile',
      'CustomerRegisteredOfficeAddress',
      'CustomerCorporateOfficeAddress', 'CogentProjectHead', 'CogentProjectOpsManager',
      'CustomerImportantPersonAddress1', 'CustomerImportantPersonAddress2'
    ];

    console.log('\n🔍 Checking for missing columns:');
    const existingColumnNames = columns.map(col => col.Field);
    const missingColumns = expectedColumns.filter(col => !existingColumnNames.includes(col));

    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns);
    } else {
      console.log('✅ All expected columns exist');
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkTableSchema();

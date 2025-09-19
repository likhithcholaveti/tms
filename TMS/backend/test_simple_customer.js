const axios = require('axios');

async function testSimpleCustomerCreation() {
  try {
    const customerData = {
      MasterCustomerName: 'Test Master',
      Name: 'Test Customer Corporation Ltd',
      CustomerCode: 'TC001',
      CustomerMobileNo: '9876543210',
      CustomerEmail: 'test@customer.com',
      CustomerContactPerson: null,
      AlternateMobileNo: null,
      CustomerGroup: null,
      ServiceCode: null,
      TypeOfServices: 'Transportation',
      CityName: null,
      HouseFlatNo: null,
      StreetLocality: null,
      CustomerCity: 'Mumbai',
      CustomerState: 'Maharashtra',
      CustomerPinCode: null,
      CustomerCountry: null,
      TypeOfBilling: null,
      Locations: null,
      CustomerSite: null,
      Agreement: null,
      AgreementFile: null,
      AgreementDate: null,
      AgreementTenure: null,
      AgreementExpiryDate: null,
      CustomerNoticePeriod: null,
      CogentNoticePeriod: null,
      CreditPeriod: null,
      Insurance: null,
      MinimumInsuranceValue: null,
      CogentDebitClause: null,
      CogentDebitLimit: null,
      BG: null,
      BGFile: null,
      BGAmount: null,
      BGDate: null,
      BGExpiryDate: null,
      BGBank: null,
      BGReceivingByCustomer: null,
      BGReceivingFile: null,
      PO: null,
      POFile: null,
      PODate: null,
      POValue: null,
      POTenure: null,
      POExpiryDate: null,
      Rates: null,
      RatesAnnexureFile: null,
      YearlyEscalationClause: null,
      GSTNo: null,
      GSTRate: null,
      BillingTenure: null,
      MISFormatFile: null,
      KPISLAFile: null,
      PerformanceReportFile: null,
      CustomerRegisteredOfficeAddress: null,
      CustomerCorporateOfficeAddress: null,
      CogentProjectHead: null,
      CogentProjectOpsManager: null,
      CustomerImportantPersonAddress1: null,
      CustomerImportantPersonAddress2: null
    };

    console.log('📤 Sending customer data to API...');

    const response = await axios.post('http://localhost:3004/api/customers', customerData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Customer created successfully!');
    console.log('📊 Response:', response.data);

  } catch (error) {
    console.error('❌ Error creating customer:', error.response ? error.response.data : error.message);
  }
}

testSimpleCustomerCreation();

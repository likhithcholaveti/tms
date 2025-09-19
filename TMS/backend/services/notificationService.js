const nodemailer = require('nodemailer');
const twilio = require('twilio');
const cron = require('node-cron');

class NotificationService {
  constructor(pool) {
    this.pool = pool;
    this.emailTransporter = null;
    this.twilioClient = null;
    this.initServices();
  }

  initServices() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });

    // Initialize Twilio client only if credentials are provided
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } else {
      console.log('⚠️ Twilio credentials not provided. SMS/WhatsApp notifications will be disabled.');
      this.twilioClient = null;
    }
  }

  // Check for expiring items across all modules
  async checkExpiries() {
    console.log('🔍 Checking for expiring items...');

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiryAlerts = [];

    try {
      // Check Customer Agreements, BG, PO
      const customerAlerts = await this.checkCustomerExpiries(today, sevenDaysFromNow, thirtyDaysFromNow);
      expiryAlerts.push(...customerAlerts);

      // Check PO expiries linked to projects and locations
      const poAlerts = await this.checkPOExpiries(today, sevenDaysFromNow, thirtyDaysFromNow);
      expiryAlerts.push(...poAlerts);

      // Check Vehicle Insurance, Registration, etc.
      const vehicleAlerts = await this.checkVehicleExpiries(today, sevenDaysFromNow, thirtyDaysFromNow);
      expiryAlerts.push(...vehicleAlerts);

      // Check Driver Licenses, etc.
      const driverAlerts = await this.checkDriverExpiries(today, sevenDaysFromNow, thirtyDaysFromNow);
      expiryAlerts.push(...driverAlerts);

      // Check Vendor Agreements, etc.
      const vendorAlerts = await this.checkVendorExpiries(today, sevenDaysFromNow, thirtyDaysFromNow);
      expiryAlerts.push(...vendorAlerts);

      console.log(`📊 Found ${expiryAlerts.length} expiry alerts`);

      // Send notifications for critical alerts
      await this.sendNotifications(expiryAlerts);

      return expiryAlerts;

    } catch (error) {
      console.error('❌ Error checking expiries:', error);
      return [];
    }
  }

  async checkCustomerExpiries(today, sevenDaysFromNow, thirtyDaysFromNow) {
    const alerts = [];

    try {
      const [customers] = await this.pool.query(`
        SELECT
          CustomerID, Name, CustomerCode,
          AgreementExpiryDate, BGExpiryDate, POExpiryDate,
          CustomerMobileNo, AlternateMobileNo, CustomerEmail,
          CogentProjectHead, CogentProjectOpsManager
        FROM Customer
        WHERE AgreementExpiryDate IS NOT NULL
           OR BGExpiryDate IS NOT NULL
           OR POExpiryDate IS NOT NULL
      `);

      for (const customer of customers) {
        const fields = [
          { field: 'AgreementExpiryDate', label: 'Agreement', type: 'customer' },
          { field: 'BGExpiryDate', label: 'Bank Guarantee', type: 'customer' },
          { field: 'POExpiryDate', label: 'Purchase Order', type: 'customer' }
        ];

        for (const { field, label, type } of fields) {
          if (customer[field]) {
            const expiryDate = new Date(customer[field]);
            const alert = this.createExpiryAlert(customer, expiryDate, label, type, today, sevenDaysFromNow, thirtyDaysFromNow);
            if (alert) {
              alerts.push(alert);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking customer expiries:', error);
    }

    return alerts;
  }

  async checkPOExpiries(today, sevenDaysFromNow, thirtyDaysFromNow) {
    const alerts = [];

    try {
      // Query POs with project and location information
      const [pos] = await this.pool.query(`
        SELECT
          po.POID, po.POCode, po.POExpiryDate, po.POValue,
          p.ProjectID, p.ProjectName, p.ProjectCode,
          l.LocationID, l.LocationName,
          c.CustomerID, c.Name as CustomerName, c.CustomerCode,
          c.CustomerMobileNo, c.AlternateMobileNo, c.CustomerEmail,
          c.CogentProjectHead, c.CogentProjectOpsManager
        FROM PurchaseOrder po
        LEFT JOIN Project p ON po.ProjectID = p.ProjectID
        LEFT JOIN Location l ON po.LocationID = l.LocationID
        LEFT JOIN Customer c ON po.CustomerID = c.CustomerID
        WHERE po.POExpiryDate IS NOT NULL
      `);

      for (const po of pos) {
        if (po.POExpiryDate) {
          const expiryDate = new Date(po.POExpiryDate);
          const alert = this.createPOExpiryAlert(po, expiryDate, today, sevenDaysFromNow, thirtyDaysFromNow);
          if (alert) {
            alerts.push(alert);
          }
        }
      }
    } catch (error) {
      console.error('Error checking PO expiries:', error);
    }

    return alerts;
  }

  createPOExpiryAlert(po, expiryDate, today, sevenDaysFromNow, thirtyDaysFromNow) {
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    let status, priority;
    if (expiryDate < today) {
      status = 'expired';
      priority = 'critical';
    } else if (daysUntilExpiry <= 7) {
      status = 'critical';
      priority = 'high';
    } else if (daysUntilExpiry <= 30) {
      status = 'warning';
      priority = 'medium';
    } else {
      return null; // No alert needed
    }

    return {
      id: `po-${po.POID}-purchase-order`,
      type: 'po',
      itemId: po.POID,
      itemName: po.POCode || `PO-${po.POID}`,
      itemCode: po.POCode || '',
      expiryType: 'Purchase Order',
      expiryDate,
      daysUntilExpiry,
      status,
      priority,
      projectName: po.ProjectName || 'N/A',
      projectCode: po.ProjectCode || '',
      locationName: po.LocationName || 'N/A',
      customerName: po.CustomerName || 'N/A',
      customerCode: po.CustomerCode || '',
      poValue: po.POValue || 0,
      contacts: this.extractContacts(po, 'customer') // Use customer contacts for PO alerts
    };
  }

  createExpiryAlert(item, expiryDate, label, type, today, sevenDaysFromNow, thirtyDaysFromNow) {
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    let status, priority;
    if (expiryDate < today) {
      status = 'expired';
      priority = 'critical';
    } else if (daysUntilExpiry <= 7) {
      status = 'critical';
      priority = 'high';
    } else if (daysUntilExpiry <= 30) {
      status = 'warning';
      priority = 'medium';
    } else {
      return null; // No alert needed
    }

    return {
      id: `${type}-${item[`${type.charAt(0).toUpperCase() + type.slice(1)}ID`]}-${label.toLowerCase().replace(' ', '-')}`,
      type,
      itemId: item[`${type.charAt(0).toUpperCase() + type.slice(1)}ID`],
      itemName: item.Name || item.VendorName || item.DriverName || item.VehicleRegistrationNo || 'Unknown',
      itemCode: item.CustomerCode || item.VendorCode || item.DriverLicenceNo || '',
      expiryType: label,
      expiryDate,
      daysUntilExpiry,
      status,
      priority,
      contacts: this.extractContacts(item, type)
    };
  }

  extractContacts(item, type) {
    const contacts = [];

    if (type === 'customer') {
      if (item.CustomerEmail) contacts.push({ type: 'email', value: item.CustomerEmail });
      if (item.CustomerMobileNo) contacts.push({ type: 'sms', value: item.CustomerMobileNo });
      if (item.CogentProjectHead) contacts.push({ type: 'email', value: item.CogentProjectHead });
      if (item.CogentProjectOpsManager) contacts.push({ type: 'email', value: item.CogentProjectOpsManager });
    } else if (type === 'vehicle') {
      // For vehicles, we might need to get associated driver contacts
      // This would require joining with driver data
    } else if (type === 'driver') {
      // Driver contacts would be stored in driver table
    } else if (type === 'vendor') {
      // Vendor contacts
    }

    return contacts;
  }

  async sendNotifications(alerts) {
    const criticalAlerts = alerts.filter(alert => alert.priority === 'critical' || alert.priority === 'high');

    console.log(`📤 Sending notifications for ${criticalAlerts.length} critical alerts`);

    for (const alert of criticalAlerts) {
      try {
        await this.sendEmailNotification(alert);
        await this.sendSMSNotification(alert);
        await this.sendWhatsAppNotification(alert);
      } catch (error) {
        console.error(`❌ Error sending notification for alert ${alert.id}:`, error);
      }
    }
  }

  async sendEmailNotification(alert) {
    const emailContacts = alert.contacts.filter(c => c.type === 'email');

    if (emailContacts.length === 0) return;

    const subject = `🚨 ${alert.expiryType} Expiry Alert - ${alert.itemName}`;
    const message = this.generateExpiryMessage(alert);

    for (const contact of emailContacts) {
      try {
        await this.emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: contact.value,
          subject,
          html: message
        });
        console.log(`📧 Email sent to ${contact.value} for ${alert.id}`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${contact.value}:`, error);
      }
    }
  }

  async sendSMSNotification(alert) {
    const smsContacts = alert.contacts.filter(c => c.type === 'sms');

    if (smsContacts.length === 0) return;

    const message = this.generateExpirySMS(alert);

    for (const contact of smsContacts) {
      try {
        await this.twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
          to: contact.value
        });
        console.log(`📱 SMS sent to ${contact.value} for ${alert.id}`);
      } catch (error) {
        console.error(`❌ Failed to send SMS to ${contact.value}:`, error);
      }
    }
  }

  async sendWhatsAppNotification(alert) {
    const smsContacts = alert.contacts.filter(c => c.type === 'sms');

    if (smsContacts.length === 0) return;

    const message = this.generateExpirySMS(alert);

    for (const contact of smsContacts) {
      try {
        await this.twilioClient.messages.create({
          body: message,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || '+1234567890'}`,
          to: `whatsapp:${contact.value}`
        });
        console.log(`💬 WhatsApp sent to ${contact.value} for ${alert.id}`);
      } catch (error) {
        console.error(`❌ Failed to send WhatsApp to ${contact.value}:`, error);
      }
    }
  }

  generateExpiryMessage(alert) {
    const statusText = alert.status === 'expired' ? 'HAS EXPIRED' : 'expires soon';
    const daysText = alert.status === 'expired' ? '' : ` in ${alert.daysUntilExpiry} day${alert.daysUntilExpiry !== 1 ? 's' : ''}`;

    let additionalInfo = '';
    if (alert.projectName && alert.projectName !== 'N/A') {
      additionalInfo += `<p><strong>Project:</strong> ${alert.projectName} (${alert.projectCode})</p>`;
    }
    if (alert.locationName && alert.locationName !== 'N/A') {
      additionalInfo += `<p><strong>Location:</strong> ${alert.locationName}</p>`;
    }
    if (alert.customerName && alert.customerName !== 'N/A') {
      additionalInfo += `<p><strong>Customer:</strong> ${alert.customerName} (${alert.customerCode})</p>`;
    }
    if (alert.poValue) {
      additionalInfo += `<p><strong>PO Value:</strong> ₹${alert.poValue.toLocaleString()}</p>`;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${alert.status === 'expired' ? '#dc3545' : '#ffc107'};">
          🚨 ${alert.expiryType} ${statusText}
        </h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>${alert.itemName} ${alert.itemCode ? `(${alert.itemCode})` : ''}</h3>
          <p><strong>Expiry Type:</strong> ${alert.expiryType}</p>
          <p><strong>Expiry Date:</strong> ${alert.expiryDate.toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${statusText}${daysText}</p>
          ${additionalInfo}
        </div>
        <p style="color: #6c757d;">
          Please take immediate action to renew or extend this ${alert.expiryType.toLowerCase()}.
        </p>
        <p style="color: #6c757d;">
          This is an automated notification from TMS (Transportation Management System).
        </p>
      </div>
    `;
  }

  generateExpirySMS(alert) {
    const statusText = alert.status === 'expired' ? 'HAS EXPIRED' : 'expires soon';
    const daysText = alert.status === 'expired' ? '' : ` in ${alert.daysUntilExpiry} days`;

    return `🚨 TMS Alert: ${alert.expiryType} for ${alert.itemName} ${statusText}${daysText}. Expiry: ${alert.expiryDate.toLocaleDateString()}. Please take action immediately.`;
  }

  // Get expiry alerts for frontend (called on app load)
  async getExpiryAlerts() {
    return await this.checkExpiries();
  }

  // Start scheduled job (runs daily at 9 AM)
  startScheduledJob() {
    cron.schedule('0 9 * * *', async () => {
      console.log('⏰ Running scheduled expiry check...');
      await this.checkExpiries();
    });

    console.log('✅ Scheduled expiry check job started (daily at 9 AM)');
  }
}

module.exports = NotificationService;

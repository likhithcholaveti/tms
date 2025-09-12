# Transportation Management System (TMS)

A comprehensive web-based Transportation Management System built with React.js frontend and Node.js/Express backend with MySQL database.

## Features

- **Customer Management**: Complete customer profiles with contracts and agreements
- **Vendor Management**: Vendor registration with document management
- **Driver Management**: Driver profiles with license tracking
- **Vehicle Management**: Vehicle registration with maintenance tracking
- **Project Management**: Customer project tracking
- **Transaction Management**: Trip and freight management
- **Billing & Payments**: Invoice generation and payment tracking
- **Reports & Analytics**: Comprehensive reporting with charts
- **File Upload**: Document management for all entities

## Quick Start

### For New Users

1. **Run Setup Script** (Windows):
   ```powershell
   .\setup.ps1
   ```

2. **Follow the instructions** displayed after setup completion

3. **For detailed setup**, see [DATABASE_SETUP.md](DATABASE_SETUP.md)

### Default Login
- Email: `admin@tms.com`
- Password: `admin123`
- **⚠️ Change this password after first login!**

## Technology Stack

### Frontend
- React 19.1.0
- Vite (Build tool)
- Chart.js (Analytics)
- React Router (Navigation)
- Axios (API calls)

### Backend
- Node.js/Express
- MySQL 2 (Database driver)
- JWT (Authentication)
- Multer (File uploads)
- Bcrypt (Password hashing)

### Database
- MySQL 8.0+
- Comprehensive schema with foreign keys
- Indexed for performance

## Project Structure

```
tms/
├── src/                    # React frontend source
├── backend/               # Node.js backend
│   ├── routes/           # API routes
│   ├── uploads/          # File uploads
│   └── server.js         # Main server file
├── db/                   # Database scripts
├── public/               # Static files
├── database_schema.sql   # Main database schema
├── DATABASE_SETUP.md     # Setup instructions
└── README.md            # This file
```

## Development

### Start Development Servers

```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
npm run dev
```

### Access URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:3002

## Database Schema

The system includes the following main entities:
- Customers with contract management
- Vendors with document tracking
- Drivers with license management
- Vehicles with maintenance records
- Projects linked to customers
- Transactions for trip management
- Billing and payment tracking
- User authentication system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For setup issues or questions:
1. Check [DATABASE_SETUP.md](DATABASE_SETUP.md)
2. Verify all prerequisites are installed
3. Check MySQL error logs
4. Ensure proper file permissions

## License

This project is proprietary software. All rights reserved.

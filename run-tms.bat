@echo off
REM Automate setup and running of TMS application

echo Setting up and running TMS application...

REM Step 1: Create database and import schema
echo Creating MySQL database and importing schema...
mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS transportation_management;"
mysql -u root -proot transportation_management < "e:\TMS (2)\TMS\schema.sql"

REM Step 2: Install backend dependencies and start backend server
echo Installing backend dependencies...
cd TMS\backend
npm install
echo Starting backend server...
start cmd /k "npm run dev"

REM Step 3: Install frontend dependencies and start frontend server
cd ..
npm install
echo Starting frontend server...
start cmd /k "npm run dev"

echo TMS application setup complete. Backend running on port 3004, frontend on port 5174.
pause

# 🍃 Install MongoDB Locally — Step by Step

MongoDB is a NoSQL database. Here's how to install it on your system.

---

## 🐧 For Ubuntu/Debian (Linux)

### Step 1: Import MongoDB GPG Key
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
```

### Step 2: Add MongoDB Repository
```bash
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

### Step 3: Update Package List
```bash
sudo apt-get update
```

### Step 4: Install MongoDB
```bash
sudo apt-get install -y mongodb-org
```

### Step 5: Start MongoDB Service
```bash
sudo systemctl start mongod
```

### Step 6: Verify MongoDB is Running
```bash
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

**Expected output:**
```
{ ok: 1 }
```

---

## 🍎 For macOS (Homebrew)

### Step 1: Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Tap MongoDB Homebrew
```bash
brew tap mongodb/brew
```

### Step 3: Install MongoDB
```bash
brew install mongodb-community
```

### Step 4: Start MongoDB Service
```bash
brew services start mongodb-community
```

### Step 5: Verify MongoDB is Running
```bash
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

**Expected output:**
```
{ ok: 1 }
```

---

## 🪟 For Windows

### Step 1: Download Installer
Go to: https://www.mongodb.com/try/download/community

Select:
- Version: 7.0 (latest)
- OS: Windows
- Download the `.msi` file

### Step 2: Run Installer
- Double-click the `.msi` file
- Click "Next" through the installer
- Choose "Install MongoDB as a Service"
- Click "Finish"

### Step 3: Verify Installation
Open PowerShell and run:
```powershell
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

**Expected output:**
```
{ ok: 1 }
```

---

## ✅ Verify MongoDB is Running

Run this command on ANY operating system:

```bash
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

### Success Response:
```
{ ok: 1 }
```

### If MongoDB is NOT Running:
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

In this case, start it:

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
```powershell
net start MongoDB
```

---

## 🎯 After MongoDB is Running

Once you see `{ ok: 1 }`, you can run the project:

```bash
cd /home/nikhil/Desktop/big_code/fear-free-night-navigator
npm run dev
```

Then open: **http://localhost:5173**

---

## 🔍 Troubleshooting

### Error: "mongosh: command not found"
```
Solution: mongosh may not be in PATH
Try: /usr/local/bin/mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

### Error: "ECONNREFUSED"
```
Solution: MongoDB service is not running
Start it: brew services start mongodb-community (macOS)
Or: sudo systemctl start mongod (Linux)
```

### Error: "Permission denied"
```
Solution: Run with sudo
sudo systemctl start mongod
```

---

## 📋 Quick Reference

| OS | Install | Start | Check |
|----|---------|----|-------|
| **macOS** | `brew install mongodb-community` | `brew services start mongodb-community` | `mongosh --eval "db.runCommand({ connectionStatus: 1 })"` |
| **Ubuntu** | `sudo apt-get install mongodb-org` | `sudo systemctl start mongod` | `mongosh --eval "db.runCommand({ connectionStatus: 1 })"` |
| **Windows** | Download `.msi` installer | `net start MongoDB` | `mongosh --eval "db.runCommand({ connectionStatus: 1 })"` |

---

## ✨ After Installation

Your database will:
- ✅ Run on `mongodb://localhost:27017`
- ✅ Store data in `/data/db/` (default location)
- ✅ Start automatically on boot (if configured)
- ✅ Work with the Fear-Free Night Navigator project

---

**Once MongoDB is installed and running, run:**
```bash
cd /home/nikhil/Desktop/big_code/fear-free-night-navigator
npm run dev
```

Then try your route request again! 🚀

# MedChain — Blockchain Pharmaceutical Supply Chain Traceability with Vision Counterfeit Detection

MedChain is a dual-verification system designed to combat counterfeit pharmaceuticals by combining **on-chain immutable custody tracking** with **CNN-based physical image verification**.

---

## 🌟 Key Features

1. **ERC721 Smart Contract Registry**: ERC721 token representing batch custody, with role-based access control (AccessControl) for Manufacturers, Distributors, and Pharmacies.
2. **Sequential Custody Enforcement**: On-chain validation preventing skipping stages (`Manufactured` ➔ `InTransit` ➔ `AtDistributor` ➔ `AtPharmacy` ➔ `Dispensed`).
3. **Off-Chain IPFS Reference Images**: Pinata IPFS REST API integration for immutable image hashing.
4. **Siamese / MobileNetV2 Physical Authenticity Verification**: FastAPI vision service comparing live physical photos against reference IPFS images.
5. **QR Code Matrix Generation & Browser Camera Scanning**: Instant QR generation and `html5-qrcode` browser scanning.
6. **Multi-Role Frontend Dashboard**: Role switcher UI for Manufacturers, Distributors, Pharmacies, and Patients.
7. **Target Blockchain Network**: **Ethereum Sepolia Testnet** (Chain ID: `11155111`). Explorer: [https://sepolia.etherscan.io](https://sepolia.etherscan.io).

---

## 📁 Repository Structure

```text
medchain/
├── contracts/              # Hardhat smart contract project
│   ├── contracts/
│   │   └── MedChainRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── MedChainRegistry.test.js
│   └── hardhat.config.js
├── backend/                 # FastAPI REST backend API
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── batches.py
│   │   │   └── verify.py
│   │   ├── services/
│   │   │   ├── blockchain.py    # Web3.py smart contract interaction
│   │   │   ├── ipfs.py          # Pinata IPFS REST API
│   │   │   ├── qr.py            # QR code PNG generator
│   │   │   └── vision.py        # TFLite / Siamese embedding distance inference
│   │   └── models/
│   │       └── schemas.py       # Pydantic schemas
│   ├── test_backend.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/                # React Vite Tailwind frontend
│   ├── src/
│   │   ├── views/
│   │   │   ├── ManufacturerView.jsx
│   │   │   ├── DistributorView.jsx
│   │   │   ├── PharmacyView.jsx
│   │   │   └── PatientView.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── CustodyTimeline.jsx
│   │   │   └── QRScannerModal.jsx
│   │   ├── api/
│   │   │   └── client.js
│   │   └── App.jsx
│   └── package.json
└── ml/
    └── README.md
```

---

## 🚀 Quick Start Guide

### 1. Smart Contract (Hardhat)
```bash
cd contracts
npm install
npx hardhat test

# Deploy to local Hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Deploy to Ethereum Sepolia Testnet
npx hardhat run scripts/deploy.js --network sepolia
```
*Obtain Sepolia testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com) or [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia).*

### 2. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m pytest test_backend.py
uvicorn app.main:app --reload --port 8000
```
*API Documentation available at: http://localhost:8000/docs*

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
*App available at: http://localhost:5173*

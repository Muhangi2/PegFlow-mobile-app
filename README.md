# StablePay – USDC Utility App

StablePay is a lightweight application that makes USDC (a stablecoin) useful in everyday life.  
The app allows users to:

- **Send USDC** to any address (P2P transfers).  
- **Pay Bills** (utilities, internet, etc.) using USDC.  
- **Off-Ramp USDC** into local currency (e.g., UGX, KES, NGN).  

The goal is to bridge stablecoins with real-world use cases while keeping the experience simple and accessible.

---

## 🚀 Features

1. **Send USDC (P2P)**
   - Transfer USDC to any wallet address instantly.
   - Low fees and fast confirmations.

2. **Pay Bills**
   - Pay for utilities, airtime, internet, and services directly with USDC.
   - Partner integrations handle merchant settlements in local currency.

3. **Off-Ramp to Local Currency**
   - Convert USDC into fiat and receive funds directly into mobile money or bank accounts.
   - Example: USDC → UGX (MTN Momo / Airtel Money).

---

## 🛠️ Tech Stack

- **Frontend:** React / Next.js + TailwindCSS  
- **Backend:** Node.js (Express) or NestJS  
- **Database:** PostgreSQL / MongoDB  
- **Blockchain:** Ethereum / Polygon / Solana (for USDC transfers)  
- **Payments Integration:** Mobile Money APIs (MTN Momo, Airtel Money, Flutterwave, Paystack, etc.)  

---

## ⚙️ How It Works

### 1. Send USDC
- User enters recipient’s wallet address.  
- Confirms transfer.  
- Transaction is signed and broadcasted on-chain.  

### 2. Pay Bills
- User selects a bill category (Electricity, Internet, Airtime, etc.).  
- Inputs account details (e.g., meter number, phone number).  
- Pays in USDC → backend converts → settlement to biller.  

### 3. Off-Ramp to Fiat
- User selects “Withdraw” → chooses Mobile Money / Bank.  
- Enters amount in USDC.  
- USDC deducted from wallet → Fiat equivalent sent to user.  

---

## 🔒 Security & Compliance

- **Non-custodial Wallet**: Users control their private keys.  
- **KYC/AML checks** for off-ramp transactions.  
- **Secure APIs** for mobile money and bill payment integrations.  

---

## 📌 Example Flow

1. Alice wants to pay her electricity bill with USDC.  
2. She logs in → chooses **Pay Bills** → selects **Electricity**.  
3. Inputs meter number + USDC amount.  
4. App deducts USDC from her wallet → backend converts → biller gets paid in UGX.  

---

## 🌍 Use Cases

- Crypto-native users paying local bills directly.  
- Freelancers receiving USDC from abroad and cashing out in local currency.  
- Peer-to-peer USDC transfers with no banking restrictions.  
- Hedge against local currency inflation.  

---

## 📅 Roadmap

- [x] USDC wallet integration  
- [x] Send USDC (P2P transfers)  
- [ ] Bill payments integration  
- [ ] Fiat off-ramp (Mobile Money, Bank)  
- [ ] Fiat on-ramp (Buy USDC via Mobile Money/Bank)  
- [ ] Merchant plugin (accept USDC directly)  

---

## 🏗️ Example APIs

### **Send USDC**
```http
POST /api/transfer
{
  "to": "0xRecipientAddress",
  "amount": 100
}

# 🎯 Deploy Real DAOShipToken on Aptos Testnet

## **🔐 Account Created for Token Deployment**

**Account Address**: `[REDACTED - Generate your own account]`

**Private Key**: `[REDACTED - Generate your own private key]`

⚠️ **SAVE THESE SECURELY** - Required for token deployment!

## **💰 Step 1: Fund the Account**

1. **Go to Aptos Testnet Faucet**: https://aptoslabs.com/testnet-faucet
2. **Paste account address**: `[YOUR_ACCOUNT_ADDRESS_HERE]`
3. **Click "Fund Account"** (you'll receive 100 APT)
4. **Wait 2-3 minutes** for confirmation

## **🔄 Step 2: Set Environment Variable (Optional)**

```bash
export DAOSHIP_TOKEN_CREATOR_KEY="[YOUR_PRIVATE_KEY_HERE]"
```

## **🚀 Step 3: Deploy DAOShipToken**

```bash
cd /home/rameshwar/Documents/project/DAOShip/DAOShip/projects/DAOShip_backend
node deploy_daoship_token.js
```

## **🎯 What Will Happen**

After funding and running the script, you'll get:

### **📋 Token Details**
- **Name**: DAOShipToken
- **Symbol**: DST  
- **Decimals**: 6
- **Total Supply**: 1,000,000 DST
- **Network**: Aptos Testnet

### **📄 Real Transaction Hashes**
```
📄 Transaction Hashes:
   Initialization: 0xabc123...real_hash
   🔗 https://explorer.aptoslabs.com/txn/0xabc123...real_hash?network=testnet
   
   Minting: 0xdef456...real_hash  
   🔗 https://explorer.aptoslabs.com/txn/0xdef456...real_hash?network=testnet

💸 Distribution Hashes:
   Wallet 1: 0xghi789...real_hash
   🔗 https://explorer.aptoslabs.com/txn/0xghi789...real_hash?network=testnet
   
   Wallet 2: 0xjkl012...real_hash
   🔗 https://explorer.aptoslabs.com/txn/0xjkl012...real_hash?network=testnet
   
   Wallet 3: 0xmno345...real_hash
   🔗 https://explorer.aptoslabs.com/txn/0xmno345...real_hash?network=testnet
   
   Wallet 4: 0xpqr678...real_hash
   🔗 https://explorer.aptoslabs.com/txn/0xpqr678...real_hash?network=testnet
```

### **💰 Token Distribution**
Each wallet receives: **250,000 DST tokens**

1. `0x53146ebe37502a000f54c343cd5ec665d5f118d7cc306c62cf41fd27716341d9` - 250,000 DST ✅
2. `0x695fddb793accf3b65e5e5183d8f136b92fa8963ceeb3fe9a14cb486a668b034` - 250,000 DST ✅ 
3. `0xd89d2d8c8c3848dbeeaab302e005e16728363a463f63e7b45cc331c655e6991a` - 250,000 DST ✅
4. `0xad66e734548c14021b6ba8e2b03279c2d1f05ae1cba9c9ba28499ac85b8e258c` - 250,000 DST ✅

### **👛 Petra Wallet Verification**
1. Open Petra wallet
2. Switch to **Testnet** network  
3. Check the 4 wallet addresses above
4. You'll see **250,000 DST** tokens in each wallet

### **🔍 Aptos Explorer Verification**
- **Token Contract**: `0xaab466baafa5efc8bcd6c8a15ac86ee968c0f389f3b713109af0e994518b9751::daoship_token::DAOShipToken`
- **Explorer**: https://explorer.aptoslabs.com/?network=testnet
- **All transactions** will be visible and verifiable

## **✅ Deliverables You'll Get**

1. **✅ Deployed Aptos Testnet token contract**
2. **✅ Transaction hashes for token creation + distribution**  
3. **✅ Final token metadata** (name, symbol, decimals, supply, resource account address)
4. **✅ Token visible on Aptos Testnet explorers**
5. **✅ Tokens visible in Petra wallet**

## **🔗 Quick Links**

- **Faucet**: https://aptoslabs.com/testnet-faucet
- **Explorer**: https://explorer.aptoslabs.com/?network=testnet  
- **Petra Wallet**: https://petra.app/

---

**Fund the account and run the script to get your real DAOShipToken deployed with all transaction hashes!** 🚀

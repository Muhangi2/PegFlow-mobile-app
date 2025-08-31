#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Env, Map, String, Symbol, Vec,
};

#[contract]
pub struct Payvia;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct User {
    pub address: Address,
    pub phone: String,
    pub is_verified: bool,
    pub balance: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BillPayment {
    pub id: String,
    pub user_address: Address,
    pub bill_type: String,
    pub account_number: String,
    pub amount: i128,
    pub status: String,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Withdrawal {
    pub id: String,
    pub user_address: Address,
    pub method: String,
    pub account_number: String,
    pub usdc_amount: i128,
    pub ugx_amount: i128,
    pub status: String,
    pub timestamp: u64,
}

#[contractimpl]
impl Payvia {
    // Initialize the contract
    pub fn init(env: Env) {
        // Set up initial data structures
        env.storage().instance().set(&symbol_short!("admin"), &env.current_contract_address());
    }

    // Register a new user
    pub fn register_user(env: Env, user_address: Address, phone: String) -> Result<(), String> {
        let users: Map<Address, User> = env.storage().instance().get(&symbol_short!("users")).unwrap_or(Map::new(&env));
        
        if users.contains_key(&user_address) {
            return Err("User already exists".into());
        }

        let user = User {
            address: user_address.clone(),
            phone,
            is_verified: false,
            balance: 0,
        };

        let mut updated_users = users;
        updated_users.set(&user_address, &user);
        env.storage().instance().set(&symbol_short!("users"), &updated_users);
        
        Ok(())
    }

    // Get user profile
    pub fn get_user(env: Env, user_address: Address) -> Result<User, String> {
        let users: Map<Address, User> = env.storage().instance().get(&symbol_short!("users")).unwrap_or(Map::new(&env));
        
        users.get(&user_address).ok_or("User not found".into())
    }

    // Update user verification status
    pub fn verify_user(env: Env, user_address: Address) -> Result<(), String> {
        let mut users: Map<Address, User> = env.storage().instance().get(&symbol_short!("users")).unwrap_or(Map::new(&env));
        
        let mut user = users.get(&user_address).ok_or("User not found")?;
        user.is_verified = true;
        
        users.set(&user_address, &user);
        env.storage().instance().set(&symbol_short!("users"), &users);
        
        Ok(())
    }

    // Deposit USDC to user account
    pub fn deposit(env: Env, user_address: Address, amount: i128) -> Result<(), String> {
        let mut users: Map<Address, User> = env.storage().instance().get(&symbol_short!("users")).unwrap_or(Map::new(&env));
        
        let mut user = users.get(&user_address).ok_or("User not found")?;
        user.balance += amount;
        
        users.set(&user_address, &user);
        env.storage().instance().set(&symbol_short!("users"), &users);
        
        Ok(())
    }

    // Get user balance
    pub fn get_balance(env: Env, user_address: Address) -> Result<i128, String> {
        let users: Map<Address, User> = env.storage().instance().get(&symbol_short!("users")).unwrap_or(Map::new(&env));
        
        let user = users.get(&user_address).ok_or("User not found")?;
        Ok(user.balance)
    }

    // Send USDC to another user
    pub fn send_usdc(env: Env, from_address: Address, to_address: Address, amount: i128) -> Result<(), String> {
        let mut users: Map<Address, User> = env.storage().instance().get(&symbol_short!("users")).unwrap_or(Map::new(&env));
        
        let mut from_user = users.get(&from_address).ok_or("Sender not found")?;
        let mut to_user = users.get(&to_address).ok_or("Recipient not found")?;
        
        if from_user.balance < amount {
            return Err("Insufficient balance".into());
        }
        
        from_user.balance -= amount;
        to_user.balance += amount;
        
        users.set(&from_address, &from_user);
        users.set(&to_address, &to_user);
        env.storage().instance().set(&symbol_short!("users"), &users);
        
        Ok(())
    }

    // Pay bill with USDC
    pub fn pay_bill(
        env: Env,
        user_address: Address,
        bill_type: String,
        account_number: String,
        amount: i128,
    ) -> Result<String, String> {
        let mut users: Map<Address, User> = env.storage().instance().get(&symbol_short!("users")).unwrap_or(Map::new(&env));
        let mut bill_payments: Map<String, BillPayment> = env.storage().instance().get(&symbol_short!("bills")).unwrap_or(Map::new(&env));
        
        let mut user = users.get(&user_address).ok_or("User not found")?;
        
        if user.balance < amount {
            return Err("Insufficient balance".into());
        }
        
        user.balance -= amount;
        users.set(&user_address, &user);
        env.storage().instance().set(&symbol_short!("users"), &users);
        
        let payment_id = format!("bill_{}", env.ledger().timestamp());
        let bill_payment = BillPayment {
            id: payment_id.clone(),
            user_address,
            bill_type,
            account_number,
            amount,
            status: "pending".into(),
            timestamp: env.ledger().timestamp(),
        };
        
        bill_payments.set(&payment_id, &bill_payment);
        env.storage().instance().set(&symbol_short!("bills"), &bill_payments);
        
        Ok(payment_id)
    }

    // Withdraw USDC to local currency
    pub fn withdraw(
        env: Env,
        user_address: Address,
        method: String,
        account_number: String,
        usdc_amount: i128,
        ugx_amount: i128,
    ) -> Result<String, String> {
        let mut users: Map<Address, User> = env.storage().instance().get(&symbol_short!("users")).unwrap_or(Map::new(&env));
        let mut withdrawals: Map<String, Withdrawal> = env.storage().instance().get(&symbol_short!("withdrawals")).unwrap_or(Map::new(&env));
        
        let mut user = users.get(&user_address).ok_or("User not found")?;
        
        if user.balance < usdc_amount {
            return Err("Insufficient balance".into());
        }
        
        user.balance -= usdc_amount;
        users.set(&user_address, &user);
        env.storage().instance().set(&symbol_short!("users"), &users);
        
        let withdrawal_id = format!("withdraw_{}", env.ledger().timestamp());
        let withdrawal = Withdrawal {
            id: withdrawal_id.clone(),
            user_address,
            method,
            account_number,
            usdc_amount,
            ugx_amount,
            status: "pending".into(),
            timestamp: env.ledger().timestamp(),
        };
        
        withdrawals.set(&withdrawal_id, &withdrawal);
        env.storage().instance().set(&symbol_short!("withdrawals"), &withdrawals);
        
        Ok(withdrawal_id)
    }

    // Get bill payment history
    pub fn get_bill_payments(env: Env, user_address: Address) -> Vec<BillPayment> {
        let bill_payments: Map<String, BillPayment> = env.storage().instance().get(&symbol_short!("bills")).unwrap_or(Map::new(&env));
        let mut user_bills = vec![&env];
        
        for (_, payment) in bill_payments.iter() {
            if payment.user_address == user_address {
                user_bills.push_back(payment);
            }
        }
        
        user_bills
    }

    // Get withdrawal history
    pub fn get_withdrawals(env: Env, user_address: Address) -> Vec<Withdrawal> {
        let withdrawals: Map<String, Withdrawal> = env.storage().instance().get(&symbol_short!("withdrawals")).unwrap_or(Map::new(&env));
        let mut user_withdrawals = vec![&env];
        
        for (_, withdrawal) in withdrawals.iter() {
            if withdrawal.user_address == user_address {
                user_withdrawals.push_back(withdrawal);
            }
        }
        
        user_withdrawals
    }

    // Update bill payment status (admin only)
    pub fn update_bill_status(env: Env, payment_id: String, status: String) -> Result<(), String> {
        let admin: Address = env.storage().instance().get(&symbol_short!("admin")).unwrap();
        
        if env.current_contract_address() != admin {
            return Err("Unauthorized".into());
        }
        
        let mut bill_payments: Map<String, BillPayment> = env.storage().instance().get(&symbol_short!("bills")).unwrap_or(Map::new(&env));
        
        let mut payment = bill_payments.get(&payment_id).ok_or("Payment not found")?;
        payment.status = status;
        
        bill_payments.set(&payment_id, &payment);
        env.storage().instance().set(&symbol_short!("bills"), &bill_payments);
        
        Ok(())
    }

    // Update withdrawal status (admin only)
    pub fn update_withdrawal_status(env: Env, withdrawal_id: String, status: String) -> Result<(), String> {
        let admin: Address = env.storage().instance().get(&symbol_short!("admin")).unwrap();
        
        if env.current_contract_address() != admin {
            return Err("Unauthorized".into());
        }
        
        let mut withdrawals: Map<String, Withdrawal> = env.storage().instance().get(&symbol_short!("withdrawals")).unwrap_or(Map::new(&env));
        
        let mut withdrawal = withdrawals.get(&withdrawal_id).ok_or("Withdrawal not found")?;
        withdrawal.status = status;
        
        withdrawals.set(&withdrawal_id, &withdrawal);
        env.storage().instance().set(&symbol_short!("withdrawals"), &withdrawals);
        
        Ok(())
    }
}

mod test;

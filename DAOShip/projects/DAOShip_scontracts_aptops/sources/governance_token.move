module daoship::governance_token {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use aptos_framework::coin::{Self, Coin, MintCapability, BurnCapability, FreezeCapability};
    use aptos_framework::account;
    use aptos_framework::timestamp;

    /// Error codes
    const ENOT_AUTHORIZED: u64 = 1;
    const EINSUFFICIENT_BALANCE: u64 = 2;
    const ETOKEN_NOT_INITIALIZED: u64 = 3;
    const ETOKEN_ALREADY_INITIALIZED: u64 = 4;

    /// Governance Token
    struct DAOToken has key {}

    /// Token capabilities
    struct TokenCapabilities has key {
        mint_cap: MintCapability<DAOToken>,
        burn_cap: BurnCapability<DAOToken>,
        freeze_cap: FreezeCapability<DAOToken>,
    }

    /// Token configuration
    struct TokenConfig has key {
        admin: address,
        total_supply: u64,
        max_supply: u64,
        minting_enabled: bool,
        burning_enabled: bool,
    }

    /// Voting power calculation
    struct VotingPower has key {
        power_per_token: u64,
        minimum_tokens_for_voting: u64,
        delegation_enabled: bool,
    }

    /// Initialize the governance token
    public entry fun initialize_token(
        admin: &signer,
        name: String,
        symbol: String,
        decimals: u8,
        initial_supply: u64
    ) acquires TokenCapabilities, TokenConfig {
        let admin_addr = signer::address_of(admin);

        // Initialize the coin
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<DAOToken>(
            admin,
            name,
            symbol,
            decimals,
            true, // monitor_supply
        );

        // Store capabilities
        move_to(admin, TokenCapabilities {
            mint_cap,
            burn_cap,
            freeze_cap,
        });

        // Store token configuration
        move_to(admin, TokenConfig {
            admin: admin_addr,
            total_supply: 0,
            max_supply: 1000000000000000, // 10 billion with 8 decimals
            minting_enabled: true,
            burning_enabled: true,
        });

        // Store voting power configuration
        move_to(admin, VotingPower {
            power_per_token: 1, // 1 token = 1 voting power
            minimum_tokens_for_voting: 1000000, // 1000 tokens minimum
            delegation_enabled: false,
        });

        // Mint initial supply to admin
        if (initial_supply > 0) {
            mint_tokens(admin, admin_addr, initial_supply);
        };
    }

    /// Mint tokens to a recipient
    public entry fun mint_tokens(
        admin: &signer,
        recipient: address,
        amount: u64,
    ) acquires TokenCapabilities, TokenConfig {
        let admin_addr = signer::address_of(admin);
        let token_config = borrow_global_mut<TokenConfig>(admin_addr);
        
        assert!(admin_addr == token_config.admin, error::permission_denied(ENOT_AUTHORIZED));
        assert!(token_config.minting_enabled, error::invalid_state(ENOT_AUTHORIZED));
        assert!(
            token_config.total_supply + amount <= token_config.max_supply, 
            error::out_of_range(EINSUFFICIENT_BALANCE)
        );

        let capabilities = borrow_global<TokenCapabilities>(admin_addr);
        let coins = coin::mint<DAOToken>(amount, &capabilities.mint_cap);
        coin::deposit<DAOToken>(recipient, coins);
        
        token_config.total_supply = token_config.total_supply + amount;
    }

    /// Burn tokens from holder
    public entry fun burn_tokens(
        holder: &signer,
        admin_addr: address,
        amount: u64,
    ) acquires TokenCapabilities, TokenConfig {
        let holder_addr = signer::address_of(holder);
        let token_config = borrow_global_mut<TokenConfig>(admin_addr);
        
        assert!(token_config.burning_enabled, error::invalid_state(ENOT_AUTHORIZED));
        
        let capabilities = borrow_global<TokenCapabilities>(admin_addr);
        let coins = coin::withdraw<DAOToken>(holder, amount);
        coin::burn<DAOToken>(coins, &capabilities.burn_cap);
        
        token_config.total_supply = token_config.total_supply - amount;
    }

    /// Transfer tokens between accounts
    public entry fun transfer_tokens(
        from: &signer,
        to: address,
        amount: u64,
    ) {
        coin::transfer<DAOToken>(from, to, amount);
    }

    /// Calculate voting power for an address
    public fun calculate_voting_power(
        admin_addr: address,
        holder: address,
    ): u64 acquires VotingPower {
        let voting_power_config = borrow_global<VotingPower>(admin_addr);
        let token_balance = coin::balance<DAOToken>(holder);
        
        if (token_balance < voting_power_config.minimum_tokens_for_voting) {
            return 0
        };
        
        token_balance * voting_power_config.power_per_token
    }

    /// Check if address can vote
    public fun can_vote(
        admin_addr: address,
        holder: address,
    ): bool acquires VotingPower {
        let voting_power_config = borrow_global<VotingPower>(admin_addr);
        let token_balance = coin::balance<DAOToken>(holder);
        token_balance >= voting_power_config.minimum_tokens_for_voting
    }

    /// View functions

    #[view]
    public fun get_balance(holder: address): u64 {
        coin::balance<DAOToken>(holder)
    }

    #[view]
    public fun get_token_config(admin_addr: address): (address, u64, u64, bool, bool) acquires TokenConfig {
        let config = borrow_global<TokenConfig>(admin_addr);
        (
            config.admin,
            config.total_supply,
            config.max_supply,
            config.minting_enabled,
            config.burning_enabled,
        )
    }

    #[view]
    public fun get_voting_power_config(admin_addr: address): (u64, u64, bool) acquires VotingPower {
        let config = borrow_global<VotingPower>(admin_addr);
        (
            config.power_per_token,
            config.minimum_tokens_for_voting,
            config.delegation_enabled,
        )
    }

    /// Admin functions

    public entry fun update_token_config(
        admin: &signer,
        admin_addr: address,
        max_supply: u64,
        minting_enabled: bool,
        burning_enabled: bool,
    ) acquires TokenConfig {
        let admin_address = signer::address_of(admin);
        let config = borrow_global_mut<TokenConfig>(admin_addr);
        
        assert!(admin_address == config.admin, error::permission_denied(ENOT_AUTHORIZED));
        
        config.max_supply = max_supply;
        config.minting_enabled = minting_enabled;
        config.burning_enabled = burning_enabled;
    }

    public entry fun update_voting_power_config(
        admin: &signer,
        admin_addr: address,
        power_per_token: u64,
        minimum_tokens_for_voting: u64,
        delegation_enabled: bool,
    ) acquires VotingPower, TokenConfig {
        let admin_address = signer::address_of(admin);
        let token_config = borrow_global<TokenConfig>(admin_addr);
        
        assert!(admin_address == token_config.admin, error::permission_denied(ENOT_AUTHORIZED));
        
        let voting_config = borrow_global_mut<VotingPower>(admin_addr);
        voting_config.power_per_token = power_per_token;
        voting_config.minimum_tokens_for_voting = minimum_tokens_for_voting;
        voting_config.delegation_enabled = delegation_enabled;
    }

    public entry fun transfer_admin(
        admin: &signer,
        admin_addr: address,
        new_admin: address,
    ) acquires TokenConfig {
        let admin_address = signer::address_of(admin);
        let config = borrow_global_mut<TokenConfig>(admin_addr);
        
        assert!(admin_address == config.admin, error::permission_denied(ENOT_AUTHORIZED));
        
        config.admin = new_admin;
    }
}

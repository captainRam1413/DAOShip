#[test_only]
module daoship::dao_tests {
    use std::string;
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use daoship::dao;
    use daoship::governance_token;

    #[test(admin = @0x123, user1 = @0x456, user2 = @0x789)]
    public fun test_dao_initialization(admin: &signer, user1: &signer, user2: &signer) {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&account::create_account_for_test(@0x1));
        
        // Initialize AptosCoin for testing
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&account::create_account_for_test(@0x1));
        
        // Fund accounts
        let admin_addr = signer::address_of(admin);
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        
        let coins_admin = coin::mint<AptosCoin>(10000000, &mint_cap);
        let coins_user1 = coin::mint<AptosCoin>(5000000, &mint_cap);
        let coins_user2 = coin::mint<AptosCoin>(5000000, &mint_cap);
        
        coin::deposit<AptosCoin>(admin_addr, coins_admin);
        coin::deposit<AptosCoin>(user1_addr, coins_user1);
        coin::deposit<AptosCoin>(user2_addr, coins_user2);

        // Initialize governance token
        governance_token::initialize_token(
            admin,
            string::utf8(b"DAOShip Token"),
            string::utf8(b"SHIP"),
            8,
            1000000000000000,
            100000000000000,
            1,
            1000000,
        );

        // Initialize DAO
        dao::initialize_dao(
            admin,
            86400,    // 1 day
            604800,   // 7 days
            2,        // min 2 votes required
            1000000,  // vote price
            true,     // anyone can create
        );

        // Verify DAO configuration
        let (dao_admin, proposal_count, min_voting, max_voting, min_votes, vote_price, anyone_can_create) = 
            dao::get_dao_config(admin_addr);
        
        assert!(dao_admin == admin_addr, 1);
        assert!(proposal_count == 0, 2);
        assert!(min_voting == 86400, 3);
        assert!(max_voting == 604800, 4);
        assert!(min_votes == 2, 5);
        assert!(vote_price == 1000000, 6);
        assert!(anyone_can_create == true, 7);

        coin::destroy_burn_cap<AptosCoin>(burn_cap);
        coin::destroy_mint_cap<AptosCoin>(mint_cap);
    }

    #[test(admin = @0x123, user1 = @0x456, user2 = @0x789)]
    public fun test_proposal_creation_and_voting(admin: &signer, user1: &signer, user2: &signer) {
        // Setup (similar to initialization test)
        timestamp::set_time_has_started_for_testing(&account::create_account_for_test(@0x1));
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&account::create_account_for_test(@0x1));
        
        let admin_addr = signer::address_of(admin);
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);
        
        coin::deposit<AptosCoin>(admin_addr, coin::mint<AptosCoin>(10000000, &mint_cap));
        coin::deposit<AptosCoin>(user1_addr, coin::mint<AptosCoin>(5000000, &mint_cap));
        coin::deposit<AptosCoin>(user2_addr, coin::mint<AptosCoin>(5000000, &mint_cap));

        // Initialize contracts
        governance_token::initialize_token(
            admin,
            string::utf8(b"DAOShip Token"),
            string::utf8(b"SHIP"),
            8,
            1000000000000000,
            100000000000000,
            1,
            1000000,
        );

        dao::initialize_dao(admin, 86400, 604800, 2, 1000000, true);

        // Create a proposal
        dao::create_proposal(
            user1,
            admin_addr,
            string::utf8(b"Test Proposal"),
            string::utf8(b"This is a test proposal for the DAO"),
            172800, // 2 days voting period
            2,      // min 2 votes
            1000000, // vote price
            2000000, // initial prize pool
        );

        // Verify proposal was created
        let proposal = dao::get_proposal(admin_addr, 1);
        // Note: In a real test, you would verify all proposal fields

        // Test voting
        dao::vote_on_proposal(user1, admin_addr, 1, 1); // Vote YES
        dao::vote_on_proposal(user2, admin_addr, 1, 1); // Vote YES

        // Verify votes were recorded
        assert!(dao::has_voted(admin_addr, 1, user1_addr), 8);
        assert!(dao::has_voted(admin_addr, 1, user2_addr), 9);

        // Advance time to end voting period
        timestamp::fast_forward_seconds(172801);

        // Execute proposal
        dao::execute_proposal(admin, admin_addr, 1);

        // Clean up
        coin::destroy_burn_cap<AptosCoin>(burn_cap);
        coin::destroy_mint_cap<AptosCoin>(mint_cap);
    }

    #[test(admin = @0x123, user1 = @0x456)]
    public fun test_governance_token_functionality(admin: &signer, user1: &signer) {
        let admin_addr = signer::address_of(admin);
        let user1_addr = signer::address_of(user1);
        
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(user1_addr);

        // Initialize governance token
        governance_token::initialize_token(
            admin,
            string::utf8(b"DAOShip Token"),
            string::utf8(b"SHIP"),
            8,
            1000000000000000,
            100000000000000,
            1,
            1000000,
        );

        // Test minting
        governance_token::mint_tokens(admin, user1_addr, 5000000);
        
        // Verify balance
        let balance = governance_token::get_balance(user1_addr);
        assert!(balance == 5000000, 10);

        // Test voting power calculation
        let voting_power = governance_token::calculate_voting_power(admin_addr, user1_addr);
        assert!(voting_power == 5000000, 11); // 1:1 ratio

        // Test can_vote function
        assert!(governance_token::can_vote(admin_addr, user1_addr), 12);

        // Test token transfer
        governance_token::transfer_tokens(user1, admin_addr, 1000000);
        let new_balance = governance_token::get_balance(user1_addr);
        assert!(new_balance == 4000000, 13);
    }

    #[test(admin = @0x123)]
    #[expected_failure(abort_code = 1)] // ENOT_AUTHORIZED
    public fun test_unauthorized_access(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        let fake_admin = account::create_account_for_test(@0x999);
        
        account::create_account_for_test(admin_addr);

        governance_token::initialize_token(
            admin,
            string::utf8(b"DAOShip Token"),
            string::utf8(b"SHIP"),
            8,
            1000000000000000,
            100000000000000,
            1,
            1000000,
        );

        // This should fail - fake admin trying to mint
        governance_token::mint_tokens(&fake_admin, admin_addr, 1000000);
    }
}

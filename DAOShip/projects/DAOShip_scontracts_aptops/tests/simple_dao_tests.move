#[test_only]
module daoship::dao_tests {
    use std::string;
    use std::signer;
    use daoship::dao;
    use daoship::governance_token;

    #[test(admin = @daoship)]
    public fun test_initialize_dao(admin: &signer) {
        // Initialize governance token
        governance_token::initialize_token(
            admin,
            string::utf8(b"DAOShip Token"),
            string::utf8(b"SHIP"),
            8,
            1000000000
        );

        // Initialize DAO
        dao::initialize_dao(admin, 3600, 86400, 100, 1000, true);

        // Test that DAO info can be retrieved
        let (dao_admin, next_id, min_period, max_period, min_votes, vote_price, anyone_can_create) = dao::get_dao_info();
        assert!(dao_admin == signer::address_of(admin), 1);
        assert!(next_id == 0, 2);
        assert!(min_period == 3600, 3);
        assert!(max_period == 86400, 4);
        assert!(min_votes == 100, 5);
        assert!(vote_price == 1000, 6);
        assert!(anyone_can_create == true, 7);
    }

    #[test(admin = @daoship, user1 = @0x100)]
    public fun test_create_proposal(admin: &signer, user1: &signer) {
        // Initialize system
        governance_token::initialize_token(
            admin,
            string::utf8(b"DAOShip Token"),
            string::utf8(b"SHIP"),
            8,
            1000000000
        );
        dao::initialize_dao(admin, 3600, 86400, 100, 1000, true);

        // Create a proposal
        dao::create_proposal(
            user1,
            string::utf8(b"Test Proposal"),
            string::utf8(b"This is a test proposal"),
            86400 // 1 day voting period
        );

        // Check that proposal was created
        let (proposal_id, creator, _, _, _, _) = dao::get_proposal_details(0);
        assert!(proposal_id == 0, 1);
        assert!(creator == signer::address_of(user1), 2);
    }

    #[test(admin = @daoship, user1 = @0x100)]
    public fun test_vote_on_proposal(admin: &signer, user1: &signer) {
        // Initialize system
        governance_token::initialize_token(
            admin,
            string::utf8(b"DAOShip Token"),
            string::utf8(b"SHIP"),
            8,
            1000000000
        );
        dao::initialize_dao(admin, 3600, 86400, 100, 0, true); // No vote price for testing

        // Mint some tokens to user1 for voting power
        governance_token::mint_tokens(admin, signer::address_of(user1), 1000000000);

        // Create a proposal
        dao::create_proposal(
            user1,
            string::utf8(b"Test Proposal"),
            string::utf8(b"This is a test proposal"),
            86400
        );

        // Vote on the proposal
        dao::vote(user1, 0, true); // Vote YES

        // Check that vote was recorded
        let (voter_addr, vote_proposal_id, vote_choice, _, _) = dao::get_vote_details(0, signer::address_of(user1));
        assert!(voter_addr == signer::address_of(user1), 1);
        assert!(vote_proposal_id == 0, 2);
        assert!(vote_choice == true, 3);
    }
}

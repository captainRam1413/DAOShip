#[test_only]
module daoship::basic_dao_tests {
    use std::string;
    use std::signer;
    use daoship::dao;

    #[test(admin = @daoship)]
    public fun test_initialize_dao_only(admin: &signer) {
        // Initialize DAO without governance token
        dao::initialize_dao(admin, 3600, 86400, 100, 0, true); // 0 vote price

        // Test that DAO info can be retrieved
        let (dao_admin, next_id, min_period, max_period, min_votes, vote_price, anyone_can_create) = dao::get_dao_info();
        assert!(dao_admin == signer::address_of(admin), 1);
        assert!(next_id == 0, 2);
        assert!(min_period == 3600, 3);
        assert!(max_period == 86400, 4);
        assert!(min_votes == 100, 5);
        assert!(vote_price == 0, 6);
        assert!(anyone_can_create == true, 7);
    }

    #[test(admin = @daoship, user1 = @0x100)]
    public fun test_create_proposal_only(admin: &signer, user1: &signer) {
        // Initialize DAO
        dao::initialize_dao(admin, 3600, 86400, 100, 0, true); // 0 vote price

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
}

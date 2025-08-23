script {
    use std::string;
    use daoship::dao;
    use daoship::governance_token;

    /// Deploy and initialize the complete DAO system
    fun main(admin: &signer) {
        // Initialize governance token
        governance_token::initialize_token(
            admin,
            string::utf8(b"DAOShip Token"),
            string::utf8(b"SHIP"),
            8, // decimals
            1000000000 // initial supply (10M tokens with 8 decimals)
        );

        // Initialize DAO
        dao::initialize_dao(
            admin,
            86400,    // min_voting_period: 1 day in seconds
            604800,   // max_voting_period: 7 days in seconds
            100,      // min_votes_required
            1000000,  // vote_price (in smallest token units)
            true,     // anyone_can_create proposals
        );
    }
}

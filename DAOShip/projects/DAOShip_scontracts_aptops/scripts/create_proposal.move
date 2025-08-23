script {
    use std::string;
    use daoship::dao;

    /// Create a sample proposal
    fun create_sample_proposal(creator: &signer) {
        dao::create_proposal(
            creator,
            string::utf8(b"Increase Vote Rewards"),
            string::utf8(b"Proposal to increase voting rewards by 50% to incentivize more participation in governance."),
            86400, // 24 hours voting period
        );
    }
}

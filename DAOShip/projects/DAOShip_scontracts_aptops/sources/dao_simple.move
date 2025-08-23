module daoship::dao {
    use std::error;
    use std::signer;
    use std::string::{String};
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_std::table::{Self, Table};
    use aptos_std::simple_map::{Self, SimpleMap};

    // Error codes
    const ENOT_AUTHORIZED: u64 = 1;
    const EPROPOSAL_NOT_FOUND: u64 = 2;
    const EVOTING_PERIOD_ACTIVE: u64 = 3;
    const EVOTING_PERIOD_EXPIRED: u64 = 4;
    const EALREADY_VOTED: u64 = 5;
    const EINSUFFICIENT_VOTING_POWER: u64 = 6;
    const EPROPOSAL_NOT_EXPIRED: u64 = 7;
    const EREWARD_ALREADY_CLAIMED: u64 = 8;

    // Proposal status constants
    const PROPOSAL_STATUS_ACTIVE: u8 = 0;
    const PROPOSAL_STATUS_PASSED: u8 = 1;
    const PROPOSAL_STATUS_FAILED: u8 = 2;
    const PROPOSAL_STATUS_EXECUTED: u8 = 3;

    struct DAOConfig has key {
        admin: address,
        next_proposal_id: u64,
        min_voting_period: u64,
        max_voting_period: u64,
        min_votes_required: u64,
        vote_price: u64,
        anyone_can_create: bool,
        proposals: Table<u64, Proposal>,
        proposal_votes: Table<u64, SimpleMap<address, Vote>>,
    }

    struct Proposal has store, copy {
        id: u64,
        title: String,
        description: String,
        creator: address,
        created_at: u64,
        voting_end_time: u64,
        yes_votes: u64,
        no_votes: u64,
        total_votes: u64,
        min_votes_required: u64,
        vote_price: u64,
        prize_pool: u64,
        executed: bool,
    }

    struct Vote has store, copy {
        voter: address,
        proposal_id: u64,
        vote: bool,
        voting_power: u64,
        timestamp: u64,
        claimed_reward: bool,
    }

    public fun initialize_dao(
        admin: &signer,
        min_voting_period: u64,
        max_voting_period: u64,
        min_votes_required: u64,
        vote_price: u64,
        anyone_can_create: bool,
    ) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, DAOConfig {
            admin: admin_addr,
            next_proposal_id: 0,
            min_voting_period,
            max_voting_period,
            min_votes_required,
            vote_price,
            anyone_can_create,
            proposals: table::new(),
            proposal_votes: table::new(),
        });
    }

    public entry fun create_proposal(
        creator: &signer,
        title: String,
        description: String,
        voting_duration: u64,
    ) acquires DAOConfig {
        let creator_addr = signer::address_of(creator);
        let dao_config = borrow_global_mut<DAOConfig>(@daoship);
        
        // Check authorization
        if (!dao_config.anyone_can_create) {
            assert!(creator_addr == dao_config.admin, error::permission_denied(ENOT_AUTHORIZED));
        };

        // Validate voting duration
        assert!(voting_duration >= dao_config.min_voting_period, error::invalid_argument(0));
        assert!(voting_duration <= dao_config.max_voting_period, error::invalid_argument(0));

        let proposal_id = dao_config.next_proposal_id;
        let current_time = timestamp::now_seconds();
        let voting_end_time = current_time + voting_duration;

        let proposal = Proposal {
            id: proposal_id,
            title,
            description,
            creator: creator_addr,
            created_at: current_time,
            voting_end_time,
            yes_votes: 0,
            no_votes: 0,
            total_votes: 0,
            min_votes_required: dao_config.min_votes_required,
            vote_price: dao_config.vote_price,
            prize_pool: 0,
            executed: false,
        };

        table::add(&mut dao_config.proposals, proposal_id, proposal);
        table::add(&mut dao_config.proposal_votes, proposal_id, simple_map::create<address, Vote>());
        dao_config.next_proposal_id = proposal_id + 1;
    }

    public entry fun vote(
        voter: &signer,
        proposal_id: u64,
        vote_yes: bool,
    ) acquires DAOConfig {
        let voter_addr = signer::address_of(voter);
        let dao_config = borrow_global_mut<DAOConfig>(@daoship);
        let current_time = timestamp::now_seconds();

        assert!(table::contains(&dao_config.proposals, proposal_id), error::not_found(EPROPOSAL_NOT_FOUND));
        
        let proposal = table::borrow_mut(&mut dao_config.proposals, proposal_id);
        let votes_map = table::borrow_mut(&mut dao_config.proposal_votes, proposal_id);

        // Check if voting period is active
        assert!(current_time <= proposal.voting_end_time, error::invalid_state(EVOTING_PERIOD_EXPIRED));
        
        // Check if voter hasn't voted already
        assert!(!simple_map::contains_key(votes_map, &voter_addr), error::invalid_state(EALREADY_VOTED));

        // Get voting power (simplified - using governance token balance)
        let voter_balance = coin::balance<AptosCoin>(voter_addr);
        assert!(voter_balance > 0, error::resource_exhausted(EINSUFFICIENT_VOTING_POWER));

        // Collect vote price if required
        if (proposal.vote_price > 0) {
            coin::transfer<AptosCoin>(voter, @daoship, proposal.vote_price);
            proposal.prize_pool = proposal.prize_pool + proposal.vote_price;
        };

        let vote_record = Vote {
            voter: voter_addr,
            proposal_id,
            vote: vote_yes,
            voting_power: voter_balance,
            timestamp: current_time,
            claimed_reward: false,
        };

        // Update proposal vote counts
        if (vote_yes) {
            proposal.yes_votes = proposal.yes_votes + voter_balance;
        } else {
            proposal.no_votes = proposal.no_votes + voter_balance;
        };
        proposal.total_votes = proposal.total_votes + voter_balance;

        simple_map::add(votes_map, voter_addr, vote_record);
    }

    public entry fun execute_proposal(
        executor: &signer,
        proposal_id: u64,
    ) acquires DAOConfig {
        let executor_addr = signer::address_of(executor);
        let dao_config = borrow_global_mut<DAOConfig>(@daoship);
        let current_time = timestamp::now_seconds();

        assert!(table::contains(&dao_config.proposals, proposal_id), error::not_found(EPROPOSAL_NOT_FOUND));
        
        let proposal = table::borrow_mut(&mut dao_config.proposals, proposal_id);

        // Check if voting period has ended
        assert!(current_time > proposal.voting_end_time, error::invalid_state(EVOTING_PERIOD_ACTIVE));
        
        // Check if proposal hasn't been executed already
        assert!(!proposal.executed, error::invalid_state(0));

        // Determine if proposal passed
        let passed = if (proposal.total_votes >= proposal.min_votes_required) {
            proposal.yes_votes > proposal.no_votes
        } else {
            false
        };

        if (passed) {
            // Execute proposal logic here
            // For now, just mark as executed
            proposal.executed = true;
        };
    }

    public entry fun claim_reward(
        voter: &signer,
        proposal_id: u64,
    ) acquires DAOConfig {
        let voter_addr = signer::address_of(voter);
        let dao_config = borrow_global_mut<DAOConfig>(@daoship);

        assert!(table::contains(&dao_config.proposals, proposal_id), error::not_found(EPROPOSAL_NOT_FOUND));
        
        let proposal = table::borrow(&dao_config.proposals, proposal_id);
        let votes_map = table::borrow_mut(&mut dao_config.proposal_votes, proposal_id);

        // Check if proposal has been executed
        assert!(proposal.executed, error::invalid_state(EPROPOSAL_NOT_EXPIRED));
        
        // Check if voter participated
        assert!(simple_map::contains_key(votes_map, &voter_addr), error::not_found(0));
        
        let vote_record = simple_map::borrow_mut(votes_map, &voter_addr);
        
        // Check if reward hasn't been claimed already
        assert!(!vote_record.claimed_reward, error::invalid_state(EREWARD_ALREADY_CLAIMED));

        // Calculate reward (simplified - equal distribution)
        let reward_amount = if (proposal.total_votes > 0) {
            proposal.prize_pool / proposal.total_votes
        } else {
            0
        };

        if (reward_amount > 0) {
            // Note: In production, implement proper reward distribution
            // For now, just mark as claimed
        };

        vote_record.claimed_reward = true;
    }

    // View functions
    #[view]
    public fun get_proposal(proposal_id: u64): Proposal acquires DAOConfig {
        let dao_config = borrow_global<DAOConfig>(@daoship);
        assert!(table::contains(&dao_config.proposals, proposal_id), error::not_found(EPROPOSAL_NOT_FOUND));
        *table::borrow(&dao_config.proposals, proposal_id)
    }

    #[view]
    public fun get_vote(proposal_id: u64, voter: address): Vote acquires DAOConfig {
        let dao_config = borrow_global<DAOConfig>(@daoship);
        assert!(table::contains(&dao_config.proposal_votes, proposal_id), error::not_found(EPROPOSAL_NOT_FOUND));
        
        let votes_map = table::borrow(&dao_config.proposal_votes, proposal_id);
        assert!(simple_map::contains_key(votes_map, &voter), error::not_found(0));
        
        *simple_map::borrow(votes_map, &voter)
    }

    #[view]
    public fun get_dao_info(): (address, u64, u64, u64, u64, u64, bool) acquires DAOConfig {
        let dao_config = borrow_global<DAOConfig>(@daoship);
        (
            dao_config.admin,
            dao_config.next_proposal_id,
            dao_config.min_voting_period,
            dao_config.max_voting_period,
            dao_config.min_votes_required,
            dao_config.vote_price,
            dao_config.anyone_can_create
        )
    }

    #[test_only]
    public fun init_module_for_test(admin: &signer) {
        initialize_dao(admin, 3600, 86400, 100, 1000, true);
    }
}

module poap::issuer {
    use std::string::{utf8, String, Self};
    use std::vector::{Self};
    use sui::transfer;
    use sui::vec_set::{Self, VecSet};
    use sui::object::{Self, UID};
    use sui::dynamic_object_field as dof;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};

    const EExpiredAt: u64 = 1001;
    const ENotAuthorized: u64 = 1002;
    const EAlreadyInWhitelist: u64 = 1003;
    const ENotInWhitelist: u64 = 1004;
    const ENotCreator: u64 = 1005;
    const EAlreadyVisited: u64 = 1006;

    use poap::nft::{Self};

    struct EventConfig has key, store {
        id: UID,
        description: String,
        creator: address,
        manager_whitelist: VecSet<address>,
    }

    struct Event has key, store {
        id: UID,
        name: String,
        description: String,
        img_url: String,
        poap_name: String,
        poap_description: String,
        poap_img_path: String,
        expired_at: u64,
        visitors: vector<address>,
    }

    fun init(ctx: &mut TxContext) {
        let creator = tx_context::sender(ctx);
        let whitelist = vec_set::empty<address>();
        
        transfer::share_object(EventConfig{
            id: object::new(ctx),
            description: string::utf8(b"Developers Event"),
            creator,
            manager_whitelist: whitelist,
        })
    }

    public fun add_manager_to_whitelist(
        config: &mut EventConfig,
        manager_address: address,
        ctx: &mut TxContext,
    ) {
        // Only the creator can add managers to whitelist
        assert!(tx_context::sender(ctx) == config.creator, ENotCreator);
        
        // Check if address is already in whitelist
        assert!(!vec_set::contains(&config.manager_whitelist, &manager_address), EAlreadyInWhitelist);
        
        vec_set::insert(&mut config.manager_whitelist, manager_address);
    }

    public fun remove_manager_from_whitelist(
        config: &mut EventConfig,
        manager_address: address,
        ctx: &mut TxContext,
    ) {
        // Only the creator can remove managers from whitelist
        assert!(tx_context::sender(ctx) == config.creator, ENotCreator);
        
        // Check if address is in whitelist
        assert!(vec_set::contains(&config.manager_whitelist, &manager_address), ENotInWhitelist);
        
        vec_set::remove(&mut config.manager_whitelist, &manager_address);
    }

    public fun is_manager_authorized(config: &EventConfig, manager_address: address): bool {
        vec_set::contains(&config.manager_whitelist, &manager_address)
    }

    public fun create_event(
        config: &mut EventConfig,
        event_key: String,
        event_name: String,
        description: String,
        img_path: String,
        poap_name: String,
        poap_description: String,
        poap_img_path: String,
        expired_at: u64,
        ctx: &mut TxContext,
    ){
        let sender = tx_context::sender(ctx);
        
        // Check if sender is creator or authorized manager
        assert!(
            sender == config.creator || is_manager_authorized(config, sender), 
            ENotAuthorized
        );

        let img_url = string::utf8(b"https://assets.suipo.app/");
        string::append(&mut img_url, img_path);

        let event = Event {
            id: object::new(ctx),
            name: event_name,
            description,
            img_url: img_url,
            poap_name,
            poap_description,
            poap_img_path,
            expired_at,
            visitors: vector::empty(),
        };
        dof::add(&mut config.id, event_key, event);
    }

    #[allow(lint(self_transfer))]
    public fun mint(
        config: &mut EventConfig,
        clock: &Clock,
        event_key: String,
        ctx: &mut TxContext,
    ) {
        let event: &mut Event = dof::borrow_mut(&mut config.id, event_key);
        assert!(clock::timestamp_ms(clock) < event.expired_at, EExpiredAt);
        
        let sender = tx_context::sender(ctx);
        assert!(!vector::contains(&event.visitors, &sender), EAlreadyVisited);
        
        vector::push_back(&mut event.visitors, sender);
        let nft = nft::new(event.poap_name, event_key, event.poap_description, event.poap_img_path, clock, ctx);
        transfer::public_transfer(nft, sender);
    }

}
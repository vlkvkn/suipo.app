module poap::nft {
    use std::string::{utf8, String, Self};
    use sui::transfer;
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};

    // The creator bundle: these two packages often go together.
    use sui::package;
    use sui::display;

    friend poap::issuer;

    struct PoapNFT has key, store {
        id: UID,
        name: String,
        event_key: String,
        description: String,
        image_path: String,
        created_by: address,
        created_at: u64,
    }

    /// One-Time-Witness for the module.
    struct NFT has drop {}

    /// In the module initializer one claims the `Publisher` object
    /// to then create a `Display`. The `Display` is initialized with
    /// a set of fields (but can be modified later) and published via
    /// the `update_version` call.
    ///
    /// Keys and values are set in the initializer but could also be
    /// set after publishing if a `Publisher` object was created.
    fun init(otw: NFT, ctx: &mut TxContext) {
        let keys = vector[           
            utf8(b"name"),
            utf8(b"link"),
            utf8(b"image_url"),
            utf8(b"description"),
            utf8(b"project_url"),
            utf8(b"creator"),
        ];

        let values = vector[
            utf8(b"{name}"),
            utf8(b"https://suipo.app/events/{event_key}"),
            utf8(b"https://assets.suipo.app/{image_path}"),
            utf8(b"{description}"),
            utf8(b"https://suipo.app/"),
            utf8(b"Sui POAP"),
        ];

        // Claim the `Publisher` for the package!
        let publisher = package::claim(otw, ctx);

        // Get a new `Display` object for the `PoapNFT` type.
        let display = display::new_with_fields<PoapNFT>(
            &publisher, keys, values, ctx
        );

        // Commit first version of `Display` to apply changes.
        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    public(friend) fun new(
        name: String,
        event_key: String,
        description: String,
        image_path: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ): PoapNFT {
        PoapNFT {
            id: object::new(ctx),
            name,
            event_key,
            description,
            image_path,
            created_by: tx_context::sender(ctx),
            created_at: clock::timestamp_ms(clock),
        }
    }

    public(friend) fun uid_mut_as_owner(
        self: &mut PoapNFT
    ): &mut UID {
        &mut self.id
    }

}
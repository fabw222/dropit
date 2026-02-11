#[allow(lint(self_transfer))]
module dropit::video;

use std::string::String;
use sui::clock::{Self, Clock};

public struct Video has key, store {
    id: UID,
    title: String,
    blob_id: String,
    owner: address,
    created_at: u64,
}

public fun create_video(
    title: String,
    blob_id: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let video = Video {
        id: object::new(ctx),
        title,
        blob_id,
        owner: tx_context::sender(ctx),
        created_at: clock::timestamp_ms(clock),
    };
    transfer::transfer(video, tx_context::sender(ctx));
}

public fun delete_video(video: Video) {
    let Video { id, title: _, blob_id: _, owner: _, created_at: _ } = video;
    object::delete(id);
}

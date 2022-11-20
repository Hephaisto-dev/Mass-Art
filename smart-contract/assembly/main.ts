// A simple smart contract made by Héphaïsto#8899

import { generateEvent, Args, unsafeRandom, Address, transferCoins, transferCoinsOf } from "@massalabs/massa-as-sdk";
import { caller, transferedCoins } from "@massalabs/massa-as-sdk/assembly/std/context";
import { get, set, has } from "@massalabs/massa-as-sdk/assembly/std/storage";

export function draw(stringifyArgs: string): void {
    //if (transferedCoins() <= 0) return;
    const args = new Args(stringifyArgs);
    const id = args.nextU32();
    if (has(id.toString())) {
        const args_str = new Args(get(id.toString()));
        const random : i64 = unsafeRandom();
        let random_mod : i64 = random % 100;
        if (random_mod < 0) random_mod = -random_mod;
        const owner_str = args_str.nextString();
        const owner = Address.fromByteString(owner_str);
        const percentage = args_str.nextU32();
        const url = args_str.nextString();
        let acquired = args_str.nextU32();
        if (acquired == 1) generateEvent("This NFT has already been acquired");
        else {
            transferCoins(owner, transferedCoins() * 80 / 100);
            if (u32(random_mod) < percentage){
                acquired = 1;
                set(id.toString(), new Args().add(caller()).add(percentage).add(url).add(acquired).serialize());
                generateEvent(`{"winner": ${caller()._value}}`);
            }
        } 
        generateEvent("{\"sucess\": true, \"random\": " + random_mod.toString() + ", \"transfered\": " + transferedCoins().toString() + "}");
    }
    else {
        generateEvent("{\"error\": \"no such id in this smart contract\"}");
    }
    return;
}

export function add(stringifyArgs: string): void {
    const args = new Args(stringifyArgs);
    const owner_str = args.nextString();
    const owner = Address.fromByteString(owner_str);
    const percentage = args.nextU32();
    if (!percentage || percentage < 0 || percentage > 100) {
        generateEvent("{\"error\": \"percentage\"}");
        return;
    }
    const url = args.nextString();
    if (!url) {
        generateEvent("{\"error\": \"url\"}");
        return;
    }
    if (!owner.isValid()) {
        generateEvent("{\"error\": \"owner\"}");
        return;
    }
    args.add(0 as u32)
    let id : u32 = 0;
    if (has("currentId")) id = u32.parse(get("currentId")) + 1;
    set("currentId", id.toString());
    set(id.toString(), args.serialize());
    generateEvent(`{"id": "${id.toString()}"}`);
    return;
}

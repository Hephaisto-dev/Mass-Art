import { Address, Args, call } from "@massalabs/massa-as-sdk";

export function main(): i32 {
    const address = new Address(
        "A12EvpYHS7hsmzMVnk7WFiU95btB1LNWpEX9LwtkBZaXXtSHrV6o"
    );
    call(
        address,
        "add",
        new Args()
            .add(new Address("A1FgdE8AqG1tGZzCHgZA6b2FHLbwbeDShFcyvm6Q8ti5AV2n3W2"))
            .add(50 as u32)
            .add("https://www.youtube.com/watch?v=dQw4w9WgXcQ")"),
        0
    );
    call(
        address,
        "draw",
        new Args()
            .add(1 as u32),
        0
    );
    return 0;
}

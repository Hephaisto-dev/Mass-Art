import { Address, Args, call } from "@massalabs/massa-as-sdk";

export function main(): i32 {
    const address = new Address(
        "A12oVQwWi6dHa4HwDZ3NXzmHFNCWfitwmLGYb9ietwpfb6abj6Sb"
    );
    call(
        address,
        "add",
        new Args()
            .add(new Address("A1FgdE8AqG1tGZzCHgZA6b2FHLbwbeDShFcyvm6Q8ti5AV2n3W2"))
            .add(50 as u32)
            .add("https://cdn.discordapp.com/attachments/1042834055126843435/1043796162248986684/epita.png"),
        10
    );
    call(
        address,
        "draw",
        new Args()
            .add(0 as u32),
        10000000
    );
    return 0;
}

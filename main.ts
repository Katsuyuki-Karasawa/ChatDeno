import { Chat } from "./chat.ts"
import { Input, tty } from "./deps.ts"

const chat = new Chat()

await chat.session()

while (true) {
    const message = await Input.prompt("You")

    await chat.send(message, (message) => {
        tty.cursorMove(-1000, 0).text(message)
    })

    // 改行
    console.log()
}

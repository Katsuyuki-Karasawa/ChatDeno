import { Chat } from "./chat.ts"
import { createBot, Intents, startBot, configSync } from "./deps.ts"
configSync({ export: true })

const DISCORD_TOKEN = Deno.env.get("DISCORD_TOKEN")!

const chat = new Chat()

await chat.session()

const bot = createBot({
    token: DISCORD_TOKEN,
    intents: Intents.Guilds | Intents.GuildMessages | Intents.MessageContent | Intents.GuildMembers,
    events: {
        ready() {
            console.log("Successfully connected to gateway")
        },
    },
})

bot.events.messageCreate = async (b, message) => {
    if (message.isFromBot) {
        return
    }

    const replies: string[] = []

    console.log("User: ", message.content)

    const loading = await b.helpers.sendMessage(message.channelId, {
        content: "Thinking...",
    })

    await chat.send(message.content, (m) => {
        replies.push(m)
    })

    const reply = replies[replies.length - 1]

    console.log("BOT: ", reply)

    await b.helpers.editMessage(message.channelId, loading.id, {
        content: reply,
    })
}

await startBot(bot)

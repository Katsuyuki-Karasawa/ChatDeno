import { configSync } from "./deps.ts"
configSync({ export: true })

const COOKIE = Deno.env.get("COOKIE")!

export interface Payload {
    detail?: any
    message: {
        id: string
        role: string
        user: null
        create_time: null
        update_time: null
        content: {
            content_type: string
            parts: string[]
        }
        end_turn: null
        weight: number
        metadata: {}
        recipient: string
    }
    conversation_id: string
    error: null
}

export interface Parameters {
    action: "next"
    messages: {
        id: string //"4686a850-4888-41fe-b52b-11dd2e3b1b2d";
        role: "user"
        content: {
            content_type: "text"
            parts: string[]
        }
    }[]

    // conversation_id?: string // "8b839441-2353-4a95-919e-f49f7304aeb4"
    parent_message_id: string // "ac82627e-889b-4591-80f0-de3370b3204a"
    model: "text-davinci-002-render"
}

export class Chat {
    private readonly url = "https://chat.openai.com/backend-api/conversation"
    private readonly decoder = new TextDecoder("utf-8")
    private token = ""

    session = async () => {
        const url = "https://chat.openai.com/api/auth/session"
        const response = await fetch(url, {
            headers: {
                Cookie: COOKIE,
            },
        })
        const json = await response.json()
        // console.log(json)
        this.token = json.accessToken
    }

    send = async (message: string, onReply: (message: string) => void) => {
        const body = this.newMessage(message)
        const res = await fetch(this.url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })

        if (res.body) {
            for await (const chunk of res.body) {
                const decoded = this.decoder.decode(chunk)
                const regex = /\\u([\d\w]{4})/gi
                const result = decoded
                    .replace(regex, (_match, grp) => {
                        return String.fromCharCode(parseInt(grp, 16))
                    })
                    .replace("data: ", "")
                    .trim()

                // console.log(result)

                try {
                    const payload: Payload = JSON.parse(result)

                    if (payload.detail) {
                        await this.session()
                        return
                    }

                    if (payload.message.content.parts.length > 0) {
                        onReply(payload.message.content.parts[0])
                    }
                } catch {}
            }
        }

        res.body?.cancel()
    }

    newMessage = (message: string): Parameters => {
        return {
            action: "next",
            messages: [
                {
                    id: "820383e9-e2b8-40a3-b8d6-7c8824514236",
                    role: "user",
                    content: {
                        content_type: "text",
                        parts: [message],
                    },
                },
            ],
            // conversation_id: "",
            parent_message_id: "a4fc05e8-938b-4cce-81c2-6479ce928e67",
            model: "text-davinci-002-render",
        }
    }
}

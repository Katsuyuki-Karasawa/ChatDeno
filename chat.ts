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
        id: string
        role: "user"
        content: {
            content_type: "text"
            parts: string[]
        }
    }[]

    conversation_id?: string
    parent_message_id: string
    model: "text-davinci-002-render"
}

export class Chat {
    private readonly url = "https://chat.openai.com/backend-api/conversation"
    private readonly decoder = new TextDecoder("utf-8")
    private token = ""
    private conversation_id?: string = undefined
    private parent_message_id = crypto.randomUUID()

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
                        this.conversation_id = payload.conversation_id
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
                    id: crypto.randomUUID(),
                    role: "user",
                    content: {
                        content_type: "text",
                        parts: [message],
                    },
                },
            ],
            conversation_id: this.conversation_id,
            parent_message_id: this.parent_message_id,
            model: "text-davinci-002-render",
        }
    }
}

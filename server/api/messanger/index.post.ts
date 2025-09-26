import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    try {
        const messanger = await prisma.messanger.create({
            data: {
                agentId: body.agentId,
                date: new Date(body.date),
                count: body.count,
                type: body.type // должно быть "KZ", "KG", "UZ", "BY"
            }
        })

        return messanger
    } catch (err) {
        console.error(err)
        throw createError({ statusCode: 400, statusMessage: err?.message })
    }
})

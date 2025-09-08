import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    try {
        const live = await prisma.live.create({
            data: {
                agentId: body.agentId,
                date: new Date(body.date),
                count: body.count,
                geo: body.geo // должно быть "KZ", "KG", "UZ", "BY"
            }
        })

        return live
    } catch (err) {
        console.error(err)
        throw createError({ statusCode: 400, statusMessage: err.message })
    }
})

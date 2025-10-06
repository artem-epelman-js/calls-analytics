import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    try {
        const agents = await prisma.agent.create({
            data: {
                stage: body.stage,
                isActive: body.isActive
            }
        })
        return agents
    } catch (err) {
        console.error(err)
        throw createError({ statusCode: 400, statusMessage: err.message })
    }
})

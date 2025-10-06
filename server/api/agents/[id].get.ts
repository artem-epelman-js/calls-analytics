// server/api/agents/[id].ts
import { PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'

const prisma = new PrismaClient()
export default defineEventHandler(async (event: H3Event) => {
    const agentId = Number(event.context.params?.id)

    if (!Number.isFinite(agentId)) {
        throw createError({ statusCode: 400, statusMessage: 'ID должен быть числом.' })
    }
    try {
        return await prisma.$transaction(async (tx) => {
            const agent = await tx.agent.findUnique({ where: { id: agentId } })
            if (!agent) {
                throw createError({ statusCode: 404, statusMessage: 'Запись не найдена.' })
            }
            return agent
        })
    } catch (err) {
        console.error('Ошибка при получении данных:', err)
        throw createError({ statusCode: 500, statusMessage: 'Не удалось получить данные о продаже.' })
    }
})

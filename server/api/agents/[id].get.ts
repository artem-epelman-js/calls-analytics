// server/api/agents/[id].ts
import { H3Event, createError } from 'h3'
import prisma from "~~/lib/prisma";


export default defineEventHandler(async (event: H3Event) => {
    const agentId = Number(event.context.params?.id)

    if (!Number.isFinite(agentId)) {
        throw createError({ statusCode: 400, statusMessage: 'ID должен быть числом.' })
    }

    // const q = getQuery(event)
    // const page = Number(q.page) || 1
    // const take = Number(q.take) || 10
    // const orderBy = String(q.orderBy || '')
    // const sortOrder = String(q.sortOrder || '')

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

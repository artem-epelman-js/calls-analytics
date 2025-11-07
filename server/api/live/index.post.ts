// server/api/live/index.post.ts
import { defineEventHandler, readBody, createError, getQuery } from 'h3'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const body = await readBody<{
        agentId: number
        geo: string
        date: string   // 'yyyy-MM-dd' из input[type=date]
        count: number | null
    }>(event)

    if (!Number.isFinite(body.agentId) || body.agentId <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'agentId is required and must be > 0' })
    }
    if (!body.geo)  throw createError({ statusCode: 400, statusMessage: 'geo is required' })
    if (!body.date) throw createError({ statusCode: 400, statusMessage: 'date is required' })

    // нормализация даты к полуночи UTC (стабильный составной ключ)
    const date = body.date.length === 10
        ? new Date(body.date + 'T00:00:00.000Z')
        : new Date(body.date)

    // ПРОВЕРКА FK: агент должен существовать
    const agentExists = await prisma.agent.findUnique({ where: { id: body.agentId }, select: { id: true } })
    if (!agentExists) {
        throw createError({ statusCode: 400, statusMessage: `agentId ${body.agentId} not found` })
    }

    try {
        const live = await prisma.live.create({
            data: {
                agentId: body.agentId,
                geo: body.geo,
                date,
                count: body.count ?? 0,
            }
        })
        return live
    } catch (err: any) {
        // P2002 — дубль (уникальный индекс по (agentId, geo, date))
        if (err?.code === 'P2002') {
            throw createError({ statusCode: 409, statusMessage: 'Duplicate (agentId, geo, date)' })
        }
        console.error(err)
        throw createError({ statusCode: 500, statusMessage: err?.message ?? 'Internal error' })
    }
})

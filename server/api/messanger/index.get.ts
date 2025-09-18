// server/api/live.get.ts
import prisma from '../../../utils/prisma'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
    try {
        const query = getQuery(event)
        const id = query.id as string | undefined
        const agentId = id ? Number(id) : undefined

        const whereClause = agentId ? { agentId } : {}

        const [rows, countAgg] = await Promise.all([
            prisma.messanger.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    agent: { select: { id: true, stage: true } }, // ⬅️ важно
                },
            }),
            prisma.messenger.aggregate({
                where: whereClause,
                _count: true, // вернёт { _count: number }
            }),
        ])

        return {
            messanger: rows,                 // ← единый ключ с массивом
            messangerCount: countAgg._count,     // ← число
        }
    } catch (error) {
        console.error('Error fetching live:', error)
        throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve live data' })
    }
})

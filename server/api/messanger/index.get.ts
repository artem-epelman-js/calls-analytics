import prisma from '../../../utils/prisma'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
    try {
        const query = getQuery(event)
        const agentId = query.agentId ? Number(query.agentId) : undefined

        const whereClause = agentId ? { agentId } : {}

        const [rows, agg] = await Promise.all([
            prisma.messanger.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    agent: { select: { id: true, stage: true } },
                },
            }),
            prisma.messanger.aggregate({
                where: whereClause,
                _sum: { count: true },   // ← суммируем значения колонки count
            }),
        ])

        return {
            messanger: rows,                        // сами записи
            totalMessanger: agg?._sum.count ?? 0,    // сумма count по указанному agentId
        }
    } catch (error) {
        console.error('Error fetching messanger:', error)
        throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve live data' })
    }
})

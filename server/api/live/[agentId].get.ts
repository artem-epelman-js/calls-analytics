// server/api/live/[agentId].get.ts
import prisma from '../../../utils/prisma'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
    try {
        const idParam = event.context.params?.agentId   // 👈 имя папки и файла = [agentId].get.ts
        const agentId = Number(idParam)

        if (!Number.isFinite(agentId)) {
            throw createError({ statusCode: 400, statusMessage: 'agentId must be a number' })
        }

        const [rows, agg] = await Promise.all([
            prisma.live.findMany({
                where: { agentId },
                orderBy: { createdAt: 'desc' },
                include: { agent: { select: { id: true, stage: true } } },
            }),
            prisma.live.aggregate({
                where: { agentId },
                _sum: { count: true },
            }),
        ])

        return {
            live: rows,
            totalLeads: agg._sum.count ?? 0,
        }
    } catch (error) {
        console.error('Error fetching live by agentId:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to retrieve live data',
        })
    }
})

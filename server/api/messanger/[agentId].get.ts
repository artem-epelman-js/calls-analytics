
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
            prisma.messanger.findMany({
                where: { agentId },
                orderBy: { createdAt: 'desc' },
                include: { agent: { select: { id: true, stage: true } } },
            }),
            prisma.messanger.aggregate({
                where: { agentId },
                _sum: { count: true },
            }),
        ])

        return {
            messanger: rows,
            totalMessanger: agg._sum.count ?? 0,
        }
    } catch (error) {
        console.error('Error fetching messanger by agentId:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to retrieve messanger data',
        })
    }
})

// server/api/live/[id].get.ts
import prisma from '../../../utils/prisma'
import type {H3Event} from 'h3'

export default defineEventHandler(async (event: H3Event) => {
    try {
        const idParam = event.context.params?.id   // 👈 имя папки и файла = [id].get.ts
        const id = Number(idParam)

        if (!Number.isFinite(id)) {
            throw createError({statusCode: 400, statusMessage: 'agentId must be a number'})
        }
        return await prisma.live.findUnique({
            where: {id},
            include: {agent: {select: {id: true, stage: true}}},
        })

    } catch (error) {
        console.error('Error fetching live by agentId:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to retrieve live data',
        })
    }
})

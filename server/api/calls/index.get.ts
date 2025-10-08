import prisma from '../../../utils/prisma'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
    try {
        const [calls, count] = await Promise.all([
            prisma.call.findMany({
                orderBy: { createdAt: 'desc' },
            }),
            prisma.call.count()
        ])

        return {
            calls,
            count,
        }
    } catch (error) {
        console.error('Error fetching calls:', error)
        throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve calls data' })
    }
})

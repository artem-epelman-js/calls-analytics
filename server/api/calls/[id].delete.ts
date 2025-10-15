// server/api/calls/[id].delete.ts

import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
    try {
        // Вытаскиваем id независимо от имени параметра
        const params = event.context.params || {}
        const rawId = params.id ?? Object.values(params)[0]
        const id = Number(rawId)

        if (!Number.isFinite(id)) {
            throw createError({ statusCode: 400, statusMessage: 'id must be a number' })
        }
        await prisma.calls.delete({ where: { id } })

        return { ok: true, id }
    } catch (e: any) {
        // Частые ошибки Prisma
        if (e?.code === 'P2025') {
            // Record not found
            throw createError({ statusCode: 404, statusMessage: 'Call not found' })
        }
        if (e?.code === 'P2003') {
            // Foreign key constraint failed
            throw createError({
                statusCode: 409,
                statusMessage: 'Cannot delete: record is referenced by other data'
            })
        }

        console.error('DELETE /api/calls/:id failed:', e)
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
    }
})

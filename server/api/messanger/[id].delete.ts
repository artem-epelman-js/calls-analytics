import prisma from '../../../utils/prisma'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
    try {
        // id берём из params (см. [id].delete.ts)
        const idParam = event.context.params?.id
        if (!idParam || isNaN(Number(idParam))) {
            throw createError({ statusCode: 400, statusMessage: 'Некорректный ID' })
        }

        const id = Number(idParam)

        const deleted = await prisma.messanger.delete({
            where: { id }
        })

        return {
            success: true,
            message: `Messanger #${id} успешно удалён`,
            data: deleted
        }
    } catch (error: any) {
        console.error('Error deleting message:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Не удалось удалить запись'
        })
    }
})

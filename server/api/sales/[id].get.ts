// server/api/sales/[id].ts
import { PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'

const prisma = new PrismaClient()
export default defineEventHandler(async (event: H3Event) => {
    const saleId = Number(event.context.params?.id)

    if (!Number.isFinite(saleId)) {
        throw createError({ statusCode: 400, statusMessage: 'ID должен быть числом.' })
    }
    try {
        return await prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findUnique({ where: { id: saleId } })
            if (!sale) {
                throw createError({ statusCode: 404, statusMessage: 'Запись не найдена.' })
            }
            return sale
        })
    } catch (err) {
        console.error('Ошибка при получении данных:', err)
        throw createError({ statusCode: 500, statusMessage: 'Не удалось получить данные о продаже.' })
    }
})

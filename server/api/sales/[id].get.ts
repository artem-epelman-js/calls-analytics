// server/api/sales/[id].ts
import { PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'

const prisma = new PrismaClient()

export default defineEventHandler(async (event: H3Event) => {
    // ID из params
    const saleId = Number(event.context.params?.id)
    const query = getQuery(event)

    if (!Number.isFinite(saleId)) {
        throw createError({ statusCode: 400, statusMessage: 'ID должен быть числом.' })
    }

    // -------- Параметры с дефолтами --------
    const page = Math.max(1, parseInt(String(query.skip ?? '1'), 10))           // у тебя skip — это номер страницы
    const take = Math.max(1, Math.min(100, parseInt(String(query.take ?? '10'), 10)))
    const orderBy = String(query.orderBy ?? 'id')
    const sortOrder = (String(query.sortOrder ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'
    const status = query.status ? String(query.status) : undefined

    // -------- Фильтр по дате (поле `date`) --------
    const startDateStr = String(query.startDate ?? '').trim()
    const endDateStr = String(query.endDate ?? '').trim()

    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (startDateStr) {
        // YYYY-MM-DD → Date
        dateFilter.gte = new Date(startDateStr)
    }
    if (endDateStr) {
        // включаем конец дня
        const end = new Date(endDateStr)
        end.setHours(23, 59, 59, 999)
        dateFilter.lte = end
    }

    // Разрешённые поля сортировки, чтобы не уронить запрос
    const allowedOrderBy = new Set(['id', 'date', 'duration', 'price', 'status'])
    const safeOrderBy = allowedOrderBy.has(orderBy) ? orderBy : 'id'

    // where для findMany/aggregate
    const where: any = { agentId: saleId }
    if (status) where.status = status
    if (dateFilter.gte || dateFilter.lte) where.date = dateFilter

    try {
        return await prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findUnique({ where: { id: saleId } })
            if (!sale) {
                throw createError({ statusCode: 404, statusMessage: 'Запись не найдена.' })
            }

            const [call, callAgregation] = await Promise.all([
                tx.call.findMany({
                    where,
                    orderBy: { [safeOrderBy]: sortOrder },
                    skip: (page - 1) * take,
                    take,
                }),
                tx.call.aggregate({
                    where,
                    _count: true,
                    _sum: { duration: true, price: true },
                }),
            ])

            return {
                sale,
                call,
                callAgregation,
                // метаданные пагинации (по желанию)
                page,
                take,
                total: callAgregation._count,
            }
        })
    } catch (err) {
        console.error('Ошибка при получении данных:', err)
        throw createError({ statusCode: 500, statusMessage: 'Не удалось получить данные о продаже.' })
    }
})

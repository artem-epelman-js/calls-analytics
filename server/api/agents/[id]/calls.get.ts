import { getQuery, createError } from 'h3'
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
    const id = Number(event.context.params?.id)
    if (!Number.isFinite(id)) {
        throw createError({ statusCode: 400, message: 'ID должен быть числом' })
    }

    const q = getQuery(event)
    const page = Math.max(1, Number(q.page ?? 1))
    const take = Math.min(100, Math.max(1, Number(q.take ?? 20)))
    const orderByRaw = String(q.orderBy ?? 'id')
    const sortOrder = String(q.sortOrder ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
    const status = q.status ? String(q.status) : undefined
    const startDate = q.startDate ? new Date(String(q.startDate) + 'T00:00:00') : undefined
    const endDate = q.endDate ? new Date(String(q.endDate) + 'T23:59:59.999') : undefined

    // белый список сортировки
    const allowed: Array<'id' | 'date' | 'duration'> = ['id', 'date', 'duration']
    const orderByKey: 'id' | 'date' | 'duration' = (allowed as string[]).includes(orderByRaw)
        ? (orderByRaw as any)
        : 'id'
    const orderBy = { [orderByKey]: sortOrder } as any // то, что ждёт Prisma

    // фильтры
    const where: any = { agentId: id }
    if (status) where.status = status
    if (startDate || endDate) {
        where.date = {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
        }
    }

    const [total, items, aggregation] = await Promise.all([
        prisma.call.count({ where }),
        prisma.call.findMany({
            where,
            orderBy,                                // <-- объект, не строка
            skip: (page - 1) * take,
            take,
        }),
        prisma.call.aggregate({
            where,
            _count: { _all: true },
            _sum: { duration: true },
        }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / take))

    return {
        items,
        aggregation,
        meta: {
            page,
            take,
            total,
            totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages,            // <-- фикс
            orderBy: orderByKey,                   // <-- ключ из белого списка
            sortOrder,
        },
    }
})

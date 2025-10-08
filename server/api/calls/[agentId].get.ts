import { PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'

const prisma = new PrismaClient()

export default defineEventHandler(async (event: H3Event) => {
    const idParam = event.context.params?.agentId
    const agentId = Number(idParam)
    if (!Number.isFinite(agentId)) {
        throw createError({ statusCode: 400, statusMessage: 'agentId must be a number' })
    }


    const q = getQuery(event)

    // ---- пагинация ----
    const take = Math.max(1, Math.min(100, parseInt(String(q.take ?? '20'), 10)))
    const page = Math.max(1, parseInt(String(q.page ?? '1'), 10))
    const skip = q.skip != null
        ? Math.max(0, parseInt(String(q.skip), 10))     // если прислали настоящий offset
        : (page - 1) * take                              // иначе считаем из page

    // ---- сортировка ----
    const sortOrder = (String(q.sortOrder ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc') as 'asc'|'desc'
    const orderByRaw = String(q.orderBy ?? 'id')
    const allowed: Record<string, string> = {
        id: 'id',
        date: 'date',           // если у тебя createdAt → поменяй
        createdAt: 'createdAt',
        duration: 'duration',
        price: 'price',
        status: 'status'
    }
    const orderByField = allowed[orderByRaw] ?? 'id'

    // ---- фильтры ----
    const status = q.status ? String(q.status) : undefined
    const startDateStr = String(q.startDate ?? '').trim()
    const endDateStr = String(q.endDate ?? '').trim()
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (startDateStr) dateFilter.gte = new Date(startDateStr)
    if (endDateStr) {
        const end = new Date(endDateStr)
        end.setHours(23, 59, 59, 999)
        dateFilter.lte = end
    }

    // ⚠️ Если FK в Call называется иначе (например agentId) — замени здесь
    const where: any = { agentId }
    if (status) where.status = status
    if (dateFilter.gte || dateFilter.lte) where.date = dateFilter  // или where.createdAt = dateFilter

    try {
        const [call, callAgregation] = await Promise.all([
            prisma.call.findMany({
                where,
                orderBy: { [orderByField]: sortOrder },
                skip,
                take
            }),
            prisma.call.aggregate({
                where,
                _count: true,                            // общее количество
                _sum: { duration: true, price: true }    // суммы
            })
        ])

        return {
            call,                     // список звонков
            callAgregation,           // { _count: number, _sum: { duration: number|null, price: number|null } }
            page,
            take,
            skip,
            total: callAgregation._count
        }
    } catch (err) {
        console.error('Ошибка /api/calls/[agentId]:', err)
        throw createError({ statusCode: 500, statusMessage: 'Failed to fetch calls' })
    }
})

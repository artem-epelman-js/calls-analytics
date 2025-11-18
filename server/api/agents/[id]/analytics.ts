import { H3Event, createError, getQuery } from 'h3'
import prisma from '~~/lib/prisma'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event: H3Event) => {
    const agentId = Number(event.context.params?.id)

    if (!Number.isFinite(agentId)) {
        throw createError({ statusCode: 400, statusMessage: 'ID должен быть числом.' })
    }

    const q = getQuery(event)

    const dateGte = q.date__gte as string | undefined
    const dateLte = q.date__lte as string | undefined

    const dateFilter: Prisma.DateTimeFilter | undefined =
        dateGte || dateLte
            ? {
                gte: dateGte ? new Date(dateGte) : undefined,
                // если хочешь включительно до конца дня:
                lte: dateLte ? new Date(dateLte) : undefined,
            }
            : undefined

    // базовый where для всех таблиц
    const baseWhere = {
        agentId,
        ...(dateFilter ? { date: dateFilter } : {}),
    } as const

    try {
        return await prisma.$transaction(async (tx) => {
            const [
                callsAnalytics,
                allMessengers,
                recovery,
                nonRecovery,
                liveByKZ,
                liveByKG,
                liveByBY,
                liveByUZ,
                allLive,
            ] = await Promise.all([
                // Calls
                tx.calls.aggregate({
                    where: baseWhere, // учитывает и agentId, и date__gte/lte
                    _count: { _all: true },
                    _sum: { duration: true, price: true },
                }),

                // Все мессенджеры
                tx.messanger.aggregate({
                    where: baseWhere,
                    _sum: { count: true, price: true },
                }),

                // Мессенджеры рекавери
                tx.messanger.aggregate({
                    where: { ...baseWhere, isRecovery: true },
                    _sum: { count: true },
                }),

                // Мессенджеры НЕ рекавери
                tx.messanger.aggregate({
                    where: { ...baseWhere, isRecovery: false },
                    _sum: { count: true },
                }),

                // Лайв по GEO
                tx.live.aggregate({
                    where: { ...baseWhere, geo: 'KZ' },
                    _sum: { count: true },
                }),
                tx.live.aggregate({
                    where: { ...baseWhere, geo: 'KG' },
                    _sum: { count: true },
                }),
                tx.live.aggregate({
                    where: { ...baseWhere, geo: 'BY' },
                    _sum: { count: true },
                }),
                tx.live.aggregate({
                    where: { ...baseWhere, geo: 'UZ' },
                    _sum: { count: true },
                }),

                // Все лайвы
                tx.live.aggregate({
                    where: baseWhere,
                    _sum: { count: true },
                }),
            ])

            const callsCount = callsAnalytics._count._all
            const callsDuration = callsAnalytics._sum.duration ?? 0
            const callsPrice = callsAnalytics._sum.price ?? 0

            const allMessengersCount = allMessengers._sum.count ?? 0
            const messangersIsRecoveryCount = recovery._sum.count ?? 0
            const messangersNonRecoveryCount = nonRecovery._sum.count ?? 0

            const allMessengersPrice = allMessengers._sum.price ?? 0
            const messangersIsRecoveryPrice = messangersIsRecoveryCount * 15
            const messangersNonRecoveryPrice = messangersNonRecoveryCount * 10

            const liveByKZCount = liveByKZ._sum.count ?? 0
            const liveByKGCount = liveByKG._sum.count ?? 0
            const liveByBYCount = liveByBY._sum.count ?? 0
            const liveByUZCount = liveByUZ._sum.count ?? 0
            const allLiveCount = allLive._sum.count ?? 0

            const liveByKZPrice = liveByKZCount * 14
            const liveByKGPrice = liveByKGCount * 16
            const liveByBYPrice = liveByBYCount * 14
            const liveByUZPrice = liveByUZCount * 12

            const allLivePrice =
                liveByKZPrice +
                liveByKGPrice +
                liveByBYPrice +
                liveByUZPrice

            const totalPrice =
                allLivePrice +
                allMessengersPrice +
                callsPrice




            return {
                callsCount,
                callsDuration,
                callsPrice,


                allMessengersCount,
                messangersIsRecoveryCount,
                messangersNonRecoveryCount,
                allMessengersPrice,
                messangersIsRecoveryPrice,
                messangersNonRecoveryPrice,

                allLiveCount,
                liveByKZCount,
                liveByKGCount,
                liveByBYCount,
                liveByUZCount,
                liveByKZPrice,
                liveByKGPrice,
                liveByBYPrice,
                liveByUZPrice,
                allLivePrice,

                totalPrice
            }
        })
    } catch (err) {
        console.error('Ошибка при получении данных:', err)
        throw createError({ statusCode: 500, statusMessage: 'Не удалось получить данные об аналитике.' })
    }
})

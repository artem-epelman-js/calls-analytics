import prisma from '../../../utils/prisma'
import type { H3Event } from 'h3'
import {QueryBuilder} from "~~/server/server_helpers/query-builder";
import {Prisma} from "@prisma/client";

export default defineEventHandler(async (event: H3Event) => {
    try {
        const query = getQuery(event) as Record<string, any>
        // 2) Разрешённые поля и поисковые
        const searchFields = ['geo']
        const filterable   = ['agentId', 'date', 'count', 'price', 'geo', 'created__At']
        // 3) Собираем аргументы для Prisma
        const qb = new QueryBuilder<Prisma.LiveFindManyArgs>(
            query,
            searchFields,
            filterable
        )
            .filter()
            .search()
            .sort()
            .paginate()
        const args = qb.build()

        const [live, count] = await Promise.all([
            prisma.live.findMany(args),
            prisma.live.count({where: args.where}),
        ])

        return {
            data: live,
            count,
            meta: {} as any,
        }
    } catch (error) {
        console.error('Error fetching live:', error)
        throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve live data' })
    }
})

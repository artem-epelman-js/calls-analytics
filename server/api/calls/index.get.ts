import prisma from '../../../utils/prisma'
import type { H3Event } from 'h3'
import {QueryBuilder} from "~~/server/server_helpers/query-builder";
import {Prisma} from "@prisma/client";

export default defineEventHandler(async (event: H3Event) => {
    try {
        const query = getQuery(event) as Record<string, any>
        // 2) Разрешённые поля и поисковые
        const searchFields = ['phone']
        const filterable   = ['date']
        // 3) Собираем аргументы для Prisma
        const qb = new QueryBuilder<Prisma.CallsFindManyArgs>(
            query,
            searchFields,
            filterable
        )
            // .useSomeFor([...]) // если будут 1:N фильтры
            .filter()
            .search()
            .sort()
            .paginate()
        const args = qb.build()

        const [calls, count] = await Promise.all([
            prisma.calls.findMany(args),
            prisma.calls.count({where: args.where}),
        ])

        return {
            data: calls,
            count,
            meta: {} as any,
        }
    } catch (error) {
        console.error('Error fetching calls:', error)
        throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve calls data' })
    }
})

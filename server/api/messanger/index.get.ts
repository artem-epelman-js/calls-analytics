import prisma from '../../../utils/prisma'
import type { H3Event } from 'h3'
import { QueryBuilder } from '~~/server/server_helpers/query-builder'
import { Prisma } from '@prisma/client'



export default defineEventHandler(async (event: H3Event) => {
    try {
        // 1) Реальные query из URL
        const query = getQuery(event) as Record<string, any>

        // 2) Разрешённые поля и поисковые
        const searchFields = ['agent__stage']
        const filterable   = ['isRecovery','type', 'createdAt', 'agentId']

        // 3) Собираем аргументы для Prisma
        const qb = new QueryBuilder<Prisma.MessangerFindManyArgs>(
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


        const [messangers, count ] = await Promise.all([
            prisma.messanger.findMany(args),
            prisma.messanger.count({ where: args.where })
        ])


        return {
            data: messangers,
            count,
            meta: {} as any, // добавишь позже, если нужно
        }
    } catch (error) {
        console.error('Error fetching messanger:', error)
        throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve live data' })
    }
})

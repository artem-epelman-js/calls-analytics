import prisma from '../../../utils/prisma'
import { QueryBuilder } from '~~/server/server_helpers/query-builder'
import { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
    try {
        // 1) Реальные query из URL
        const query = getQuery(event) as Record<string, any>

        // 2) Разрешённые поля и поисковые
        const searchFields = ['stage']
        const filterable   = ['isActive', 'createdAt']

        // 3) Собираем аргументы для Prisma
        const qb = new QueryBuilder<Prisma.AgentFindManyArgs>(
            query,
            searchFields,
            filterable
        )
            // .useSomeFor([...]) // если будут 1:N фильтры
            .filter()
            .search()
            .sort({ sortBy: 'createdAt', sortOrder: 'desc' })
            .paginate()

        const args = qb.build()

        // 4) Данные и count
        const [agents, count] = await Promise.all([
            prisma.agent.findMany(args),
            prisma.agent.count({ where: args.where }),
        ])

        return {
            data: agents,
            count,
            meta: {} as any, // добавишь позже, если нужно
        }
    } catch (error: any) {
        console.error('Error fetching agents:', error)
        return {
            error: true,
            message: 'Failed to retrieve agents data.',
        }
    }
})

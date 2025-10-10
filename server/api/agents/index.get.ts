import prisma from "../../../utils/prisma";
import {QueryBuilder} from "~~/server/server_helpers/query-builder";


export default defineEventHandler(async () => {
    try {
        // get query
        const query = {}

        const searchFields = ['stage'];
        const filterable = ['isActive', 'createdAt'];

        const qb = new QueryBuilder(
            query,
            searchFields,
            filterable,
        )
        const args = qb.filter().search().sort().paginate().build();

        const agents = await prisma.agent.findMany(args)
        const count = await prisma.agent.count(args);

        return {
            data: agents,
            count,
            meta:<any>{}
        };
    } catch (error: any) {

        console.error('Error fetching agents:', error);
        return {
            error: true,
            message: 'Failed to retrieve agents data.'
        };
    }
});
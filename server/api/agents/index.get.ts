import prisma from "../../../utils/prisma";


export default defineEventHandler(async () => {
    try {
        const agents = await prisma.agent.findMany({
            orderBy: {
                stage: 'asc'
            },
        })
        const count = await prisma.agent.count();

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
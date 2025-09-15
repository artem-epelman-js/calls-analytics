import prisma from "../../../utils/prisma";
import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
    try {
        // Достаём query-параметры из запроса
        const query = getQuery(event);
        const id = getQuery(event).id as string;
        const agentId = id ? Number(id) : undefined;

        // Определяем условие WHERE, если agentId существует
        const whereClause = agentId ? { agentId: agentId } : {};

        let live = await prisma.live.findMany({
            where: {
                agentId: agentId,
            },
            orderBy: { date: "desc" },
        });
        let liveCount = await prisma.live.aggregate({
            where: whereClause,
            _count: true,
        });


        return {
            live,
            liveCount,
        };

    } catch (error: any) {
        console.error("Error fetching live:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Failed to retrieve live data",
        });
    }
});
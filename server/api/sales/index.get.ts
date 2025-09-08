import prisma from "../../../utils/prisma";


export default defineEventHandler(async () => {
    try {
        const sales = await prisma.sale.findMany({
            orderBy: {
                stage: 'asc'
            }
        });

        return sales;
    } catch (error: any) {

        console.error('Error fetching sales:', error);
        return {
            error: true,
            message: 'Failed to retrieve sales data.'
        };
    }
});
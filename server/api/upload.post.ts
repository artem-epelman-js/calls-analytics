import { H3Event, readMultipartFormData, createError } from 'h3';
import Papa from 'papaparse';
import prisma from "../../utils/prisma";


export default defineEventHandler(async (event: H3Event) => {
    try {
        const form = await readMultipartFormData(event);
        if (!form) {
            throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
        }

        const agentId = form.find(f => f.name === 'saleId')?.data.toString();
        const file = form.find(f => f.name === 'file');

        if (!file || !agentId) {
            console.error('Missing file or agentId in form data.');
            throw createError({ statusCode: 400, statusMessage: 'Missing file or agentId' });
        }

        const existingAgent = await prisma.sale.findUnique({
            where: { id: Number(agentId) },
        });

        if (!existingAgent) {
            console.error(`Sale with ID ${agentId} not found.`);
            throw createError({
                statusCode: 404,
                statusMessage: `Sale with ID ${agentId} not found. Cannot create records.`
            });
        }

        const csvText = file.data.toString('utf-8');
        const { data, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

        if (errors.length > 0) {
            console.error('CSV Parse Errors:', errors);
            throw createError({ statusCode: 400, statusMessage: 'Error parsing CSV file' });
        }

        const callsToCreate = (data as any[]).map(row => {
            const timestampInSeconds = Number(row.Time.split(',')[0]);
            const date = new Date(timestampInSeconds * 1000);

            const cleanedPhone = row.Number.replace(/\D/g, '');
            const phone = cleanedPhone;

            const duration = Number(row.Duration);
            const status = row.Info;
            const price = 0;

            if (isNaN(date.getTime()) || isNaN(duration) || !status) {
                console.warn(`Skipping row due to invalid data:`, row);
                return null;
            }

            return {
                agentId: Number(agentId),
                date: date,
                phone: phone,
                duration: duration,
                price: price,
                status: status,
            };
        }).filter(Boolean);

        if (callsToCreate.length === 0) {
            console.warn('No valid records found in the CSV to save to the database.');
            return { success: false, message: 'No valid records to save.' };
        }

        const result = await prisma.call.createMany({
            data: callsToCreate,
        });

        console.log(`Successfully processed ${result.count} records for agent ID: ${agentId}`);

        return { success: true, message: `Successfully processed ${result.count} records.` };

    } catch (dbError: any) {
        // Log the full error to the console for debugging
        console.error('Database insertion error:', dbError);

        // Return a clean error message to the client
        throw createError({
            statusCode: 500,
            statusMessage: 'Error saving data to the database. Check the server console for details.'
        });
    }
});
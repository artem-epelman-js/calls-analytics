import { H3Event, readMultipartFormData, createError } from 'h3';
import Papa from 'papaparse';
import prisma from "../../utils/prisma";

export default defineEventHandler(async (event: H3Event) => {
    try {
        const form = await readMultipartFormData(event);
        if (!form) {
            throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
        }

        const agentId = form.find(f => f.name === 'agentId')?.data.toString();
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
            // Time может быть "1756709598,..." — берём число секунд до запятой
            const timestampInSeconds = Number(String(row.Time ?? '').split(',')[0]);
            const date = new Date(timestampInSeconds * 1000); // UTC момент

            // Очищаем номер от нецифровых символов
            const cleanedPhone = String(row.Number ?? '').replace(/\D/g, '');
            const phone = cleanedPhone;

            const duration = Number(row.Duration);
            const status = row.Info;
            const price = 0;

            if (!phone || isNaN(date.getTime()) || isNaN(duration) || !status) {
                console.warn(`Skipping row due to invalid data:`, row);
                return null;
            }

            return {
                agentId: Number(agentId),
                date,          // Date в UTC
                phone,         // только цифры
                duration,
                price,
                status,
            };
        }).filter(Boolean) as Array<{
            agentId: number;
            date: Date;
            phone: string;
            duration: number;
            price: number;
            status: string;
        }>;

        if (callsToCreate.length === 0) {
            console.warn('No valid records found in the CSV to save to the database.');
            return { success: false, message: 'No valid records to save.' };
        }

        // ---- ДОБАВЛЕНО: антидубликат внутри загружаемого файла ----
        const seenInFile = new Set<string>();
        const dedupedFromFile = callsToCreate.filter((c) => {
            const key = `${c.phone}|${c.date.toISOString()}`; // ISO всегда в UTC
            if (seenInFile.has(key)) return false;
            seenInFile.add(key);
            return true;
        });

        if (dedupedFromFile.length === 0) {
            console.warn('All records are duplicates within the uploaded file.');
            return { success: false, message: 'All rows are duplicates inside the file.' };
        }

        // ---- ДОБАВЛЕНО: вычитаем те, что уже есть в БД по (phone, date[UTC]) ----
        const keys = Array.from(new Set(dedupedFromFile.map((c) => `${c.phone}|${c.date.toISOString()}`)));
        let existingSet = new Set<string>();

        if (keys.length > 0) {
            const orConditions = keys.map(k => {
                const [phone, iso] = k.split('|');
                return { phone, date: new Date(iso) }; // тот же UTC-момент
            });

            const existing = await prisma.call.findMany({
                where: { OR: orConditions },
                select: { phone: true, date: true },
            });

            existingSet = new Set(existing.map(e => `${e.phone}|${e.date.toISOString()}`));
        }

        const toInsert = dedupedFromFile.filter(c => !existingSet.has(`${c.phone}|${c.date.toISOString()}`));

        if (toInsert.length === 0) {
            console.log(`All ${dedupedFromFile.length} records are duplicates of existing DB rows for agent ID: ${agentId}`);
            return { success: true, message: 'No new records to insert (all were duplicates).' };
        }

        // Сохраняем только новые записи
        const result = await prisma.call.createMany({
            data: toInsert,
            // skipDuplicates: true // включай только если в БД есть @@unique([phone, date])
        });

        console.log(`Successfully processed ${result.count} records for agent ID: ${agentId}`);

        return { success: true, message: `Successfully processed ${result.count} records.` };

    } catch (dbError: any) {
        console.error('Database insertion error:', dbError);
        throw createError({
            statusCode: 500,
            statusMessage: 'Error saving data to the database. Check the server console for details.'
        });
    }
});

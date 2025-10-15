import {geo as GeoEnum, PrismaClient} from '@prisma/client'
import {createError, readMultipartFormData} from "h3";
import {
    isTotalRow,
    normalizeName,
    parseCsv,
    resolveAgentIdByName,
    toIntSafe
} from "~~/server/server_helpers/upload-utils";

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    // GET AND PREPARE DATA
    const form = await readMultipartFormData(event)
    if (!form) {
        throw createError({statusCode: 400, statusMessage: 'No multipart form received'})
    }

    const file = form.find(f => f.name === 'file')
    if (!file || !file.data) {
        throw createError({statusCode: 400, statusMessage: 'CSV file is required (field "file")'})
    }
    const dateStr = form.find(f => f.name === 'date')?.data?.toString('utf8')
    const date = dateStr ? new Date(dateStr) : new Date()
    const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const dryRun = form.find(f => f.name === 'dryRun')?.data?.toString('utf8') === '1'
    // GET AND PREPARE DATA ENDS

    // PAPAPARSE
    const {rows} = parseCsv(file.data)

    const results: {
        name: string
        agentId: number | null
        applied: number
        skipped: string[]
        reasons?: string[]
    }[] = []

    let totalUpserts = 0
    // PAPAPARSE ENDS

    // PRISMA ACTIONS
    for (const r of rows) {
        const rawName = String(r.name ?? '').trim()
        if (!rawName) continue
        if (isTotalRow(rawName)) continue

        const name = normalizeName(rawName)
        const agentId = await resolveAgentIdByName(name)

        const rowReport = {name, agentId, applied: 0, skipped: [] as string[], reasons: [] as string[]}

        if (!agentId) {
            rowReport.reasons?.push('agent not found')
            results.push(rowReport)
            continue
        }

        for (const g of ['KZ', 'BY', 'KG', 'UZ'] as const) {
            const n = toIntSafe(r[g])
            if (n === null || n === 0) {
                rowReport.skipped.push(g)
                continue
            }

            const geo = g as keyof typeof GeoEnum

            if (!dryRun) {
                // upsert по композитному ключу @@unique([agentId, geo, date])
                await prisma.live.upsert({
                    where: {
                        // Prisma генерирует composite unique input: agentId_geo_date
                        agentId_geo_date: {agentId, geo: GeoEnum[geo], date: dateUTC}
                    },
                    update: {count: n},
                    create: {
                        agentId,
                        date: dateUTC,
                        count: n,
                        geo: GeoEnum[geo]
                    }
                })
            }

            rowReport.applied += 1
            totalUpserts += 1
        }

        results.push(rowReport)
    }
    // PRISMA ACTIONS ENDS

    return {
        ok: true,
        dryRun,
        date: dateUTC.toISOString().slice(0, 10),
        totalRows: rows.length,
        totalUpserts,
        details: results
    }
})

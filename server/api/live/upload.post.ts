// server/api/live/upload.post.ts
import { H3Event, readMultipartFormData, createError } from 'h3'
import Papa from 'papaparse'
import { PrismaClient, geo as GeoEnum } from '@prisma/client'

const prisma = new PrismaClient()

type Row = {
    name: string
    KZ?: string
    BY?: string
    KG?: string
    UZ?: string
    [k: string]: unknown
}

function normalizeName(raw: string): string {
    // убираем префиксы "(C) ", пробелы, невидимые символы и т.п.
    return raw
        .replace(/^\(.*?\)\s*/i, '') // (C) и пр.
        .replace(/\s+/g, ' ')
        .trim()
}

function toIntSafe(v: unknown): number | null {
    if (v === null || v === undefined) return null
    const s = String(v).replace(/\s+/g, '').replace(',', '.')
    if (s === '' || s === '-' || s.toLowerCase() === 'na') return null
    const n = Number(s)
    return Number.isFinite(n) ? Math.trunc(n) : null
}

function isTotalRow(name: string): boolean {
    const s = name.toLowerCase()
    return s === 'total' || s.includes('итого') || s.includes('всего')
}

async function resolveAgentIdByName(name: string): Promise<number | null> {
    // предполагаем, что имя агента хранится в Sale.stage (или поменяй поле при необходимости)
    const agent = await prisma.sale.findFirst({
        where: { stage: { equals: name, mode: 'insensitive' } },
        select: { id: true }
    })
    return agent?.id ?? null
}

function parseCsv(buffer: Buffer) {
    const { data, errors, meta } = Papa.parse(buffer.toString('utf8'), {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h) =>
            h
                .replace(/\uFEFF/g, '') // BOM
                .replace(/Surname\s*\\\s*Geo/i, 'name')
                .replace(/^\s+|\s+$/g, '')
    })

    if (errors?.length) {
        // берём первые пару ошибок для отчёта
        const msg = errors.slice(0, 3).map(e => `${e.type}:${e.code} @ row ${e.row}`).join('; ')
        throw createError({ statusCode: 400, statusMessage: `CSV parse error: ${msg}` })
    }

    // Приводим строки к нашему Row-формату
    const rows: Row[] = (data as any[]).map((r) => {
        const entry: Row = {
                name: r['name'] ?? r['Name'] ?? r['Фамилия'] ?? ''
            }
            // допускаем разные регистры заголовков
        ;(['KZ', 'BY', 'KG', 'UZ'] as const).forEach((g) => {
            const val =
                r[g] ?? r[g.toLowerCase()] ?? r[g.toUpperCase()] ?? r[g.replace(/\s/g, '')]
            if (val !== undefined) entry[g] = String(val)
        })
        return entry
    })

    return { rows, meta }
}

export default defineEventHandler(async (event: H3Event) => {
    const form = await readMultipartFormData(event)
    if (!form) {
        throw createError({ statusCode: 400, statusMessage: 'No multipart form received' })
    }

    const file = form.find(f => f.name === 'file')
    if (!file || !file.data) {
        throw createError({ statusCode: 400, statusMessage: 'CSV file is required (field "file")' })
    }

    const dateStr = form.find(f => f.name === 'date')?.data?.toString('utf8')
    const date = dateStr ? new Date(dateStr) : new Date()
    // нормализуем на «начало дня» в UTC, чтобы уникальный ключ совпадал
    const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

    const dryRun = form.find(f => f.name === 'dryRun')?.data?.toString('utf8') === '1'

    const { rows } = parseCsv(file.data)

    const results: {
        name: string
        agentId: number | null
        applied: number
        skipped: string[]
        reasons?: string[]
    }[] = []

    let totalUpserts = 0

    for (const r of rows) {
        const rawName = String(r.name ?? '').trim()
        if (!rawName) continue
        if (isTotalRow(rawName)) continue

        const name = normalizeName(rawName)
        const agentId = await resolveAgentIdByName(name)

        const rowReport = { name, agentId, applied: 0, skipped: [] as string[], reasons: [] as string[] }

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
                        agentId_geo_date: { agentId, geo: GeoEnum[geo], date: dateUTC }
                    },
                    update: { count: n },
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

    return {
        ok: true,
        dryRun,
        date: dateUTC.toISOString().slice(0, 10),
        totalRows: rows.length,
        totalUpserts,
        details: results
    }
})

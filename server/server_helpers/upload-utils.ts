// server/api/live/upload.post.ts
import { H3Event, readMultipartFormData, createError } from 'h3'
import Papa from 'papaparse'
import { PrismaClient, geo as GeoEnum } from '@prisma/client'
import prisma from "~~/lib/prisma";


type Row = {
    name: string
    KZ?: string
    BY?: string
    KG?: string
    UZ?: string
    [k: string]: unknown
}


export function normalizeName(raw: string): string {
    // убираем префиксы "(C) ", пробелы, невидимые символы и т.п.
    return raw
        .replace(/^\(.*?\)\s*/i, '') // (C) и пр.
        .replace(/\s+/g, ' ')
        .trim()
}

export function toIntSafe(v: unknown): number | null {
    if (v === null || v === undefined) return null
    const s = String(v).replace(/\s+/g, '').replace(',', '.')
    if (s === '' || s === '-' || s.toLowerCase() === 'na') return null
    const n = Number(s)
    return Number.isFinite(n) ? Math.trunc(n) : null
}

export function isTotalRow(name: string): boolean {
    const s = name.toLowerCase()
    return s === 'total' || s.includes('итого') || s.includes('всего')
}

export async function resolveAgentIdByName(name: string): Promise<number | null> {
    // предполагаем, что имя агента хранится в Agent.stage (или поменяй поле при необходимости)
    const agent = await prisma.agent.findFirst({
        where: { stage: { equals: name } },
        select: { id: true }
    })
    return agent?.id ?? null
}

export function parseCsv(buffer: Buffer) {
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
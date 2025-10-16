// server/api/calls/upload.post.ts
import { defineEventHandler, createError } from 'h3'
import { readMultipartFormData, isError } from 'h3'
import Papa from 'papaparse'
import type { Prisma } from '@prisma/client'
import prisma from "~~/lib/prisma";

// --- утилиты ---------------------------------------------------------

function toInt(v: unknown): number | null {
    if (v == null) return null
    const s = String(v).trim()
    if (!s) return null
    const n = Number(s.replace(',', '.'))
    return Number.isFinite(n) ? Math.trunc(n) : null
}

function cleanPhone(s: unknown): string {
    return String(s ?? '').replace(/\D/g, '')
}

function pick<T = any>(row: Record<string, any>, keys: string[]): T | undefined {
    for (const k of Object.keys(row)) {
        const nk = k.toLowerCase().replace(/\s+/g, '')
        const hit = keys.find(t => nk === t || nk.includes(t))
        if (hit) return row[k]
    }
    return undefined
}

// --------------------------------------------------------------------

export default defineEventHandler(async (event) => {
    try {
        const form = await readMultipartFormData(event)
        if (!form) throw createError({ statusCode: 400, statusMessage: 'No multipart form received' })

        const file = form.find(f => f.name === 'file')
        const agentIdStr = form.find(f => f.name === 'agentId')?.data?.toString('utf8')

        if (!file?.data) throw createError({ statusCode: 400, statusMessage: 'CSV file (field "file") is required' })
        if (!agentIdStr) throw createError({ statusCode: 400, statusMessage: 'agentId is required' })

        const agentId = Number(agentIdStr)
        if (!Number.isFinite(agentId)) throw createError({ statusCode: 400, statusMessage: 'agentId must be a number' })

        // опционально проверим, что агент существует
        const agent = await prisma.agent.findUnique({ where: { id: agentId }, select: { id: true } })
        if (!agent) throw createError({ statusCode: 404, statusMessage: `Agent ${agentId} not found` })

        // Парсим CSV
        const csv = file.data.toString('utf8')
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
        if (parsed.errors?.length) {
            const sample = parsed.errors.slice(0, 3).map(e => `${e.type}:${e.code} @ row ${e.row}`).join('; ')
            throw createError({ statusCode: 400, statusMessage: `CSV parse error: ${sample}` })
        }

        // Ожидаемые поля (гибко):
        //  - дата/время: Time(UNIX sec) | Date | Datetime
        //  - номер: Number | Phone
        //  - длительность: Duration
        //  - статус: Info | Status
        const rawRows = parsed.data as any[]

        const toCreate: Prisma.CallsUncheckedCreateInput[] = []

        for (const r of rawRows) {
            // время: поддержим UNIX seconds (Time) ИЛИ Date в читаемом виде
            const timeRaw = pick(r, ['time', 'timestamp', 'date', 'datetime'])
            let date: Date | null = null
            if (timeRaw != null) {
                const unix = toInt(String(timeRaw).split(',')[0])
                if (unix != null) {
                    date = new Date(unix * 1000)
                } else {
                    const d = new Date(String(timeRaw))
                    if (!isNaN(d.getTime())) date = d
                }
            }

            const phone = cleanPhone(pick(r, ['number', 'phone']))
            const duration = toInt(pick(r, ['duration']))
            const status = String(pick(r, ['info', 'status']) ?? '').trim()
            // если есть price в CSV — можно взять, иначе 0
            const priceNum = Number(String(pick(r, ['price', 'cost']) ?? '0').replace(',', '.')) || 0

            if (!date || isNaN(date.getTime())) continue
            if (!phone) continue
            if (!Number.isFinite(duration)) continue
            if (!status) continue

            toCreate.push({
                agentId,
                date,
                phone,
                duration: duration!,
                status,
                // если в схеме price Decimal — Prisma сам приведёт number к Decimal
                price: priceNum
            })
        }

        if (!toCreate.length) {
            return { success: false, message: 'No valid rows to insert.' }
        }

        // Дедуп внутри файла по (phone, date)
        const seen = new Set<string>()
        const unique = toCreate.filter(r => {
            const key = `${r.phone}|${r.date.toISOString()}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })

        // Уберём уже существующие в БД у этого агента
        const keys = unique.map(r => ({ phone: r.phone, date: r.date }))
        let existingSet = new Set<string>()
        if (keys.length) {
            const existing = await prisma.calls.findMany({
                where: {
                    agentId,
                    OR: keys.map(k => ({ phone: k.phone, date: k.date }))
                },
                select: { phone: true, date: true }
            })
            existingSet = new Set(existing.map(e => `${e.phone}|${e.date.toISOString()}`))
        }

        const toInsert = unique.filter(r => !existingSet.has(`${r.phone}|${r.date.toISOString()}`))
        if (!toInsert.length) {
            return { success: true, inserted: 0, skipped: unique.length, reason: 'duplicates' }
        }

        const res = await prisma.calls.createMany({
            data: toInsert,
            // если есть @@unique([agentId, phone, date]) — можно включить
            // skipDuplicates: true,
        })

        return {
            success: true,
            inserted: res.count,
            parsed: rawRows.length,
            uniqueInFile: unique.length,
            skippedAsExisting: unique.length - toInsert.length
        }
    } catch (err: any) {
        if (isError(err)) throw err
        console.error('Calls upload error:', err)
        throw createError({ statusCode: 500, statusMessage: 'Upload failed' })
    }
})

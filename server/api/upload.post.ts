// server/api/upload.post.ts
import { H3Event, readMultipartFormData, createError, isError } from 'h3'
import Papa from 'papaparse'
import type { Prisma } from '@prisma/client'
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event: H3Event) => {
    try {
        const form = await readMultipartFormData(event)
        if (!form) throw createError({ statusCode: 400, message: 'No file uploaded' })

        const agentIdStr = form.find(f => f.name === 'agentId')?.data?.toString()
        const file = form.find(f => f.name === 'file')
        if (!file || !agentIdStr) {
            throw createError({ statusCode: 400, message: 'Missing file or agentId' })
        }

        const agentId = Number(agentIdStr)
        if (!Number.isFinite(agentId)) {
            throw createError({ statusCode: 400, message: 'agentId must be a number' })
        }

        const agent = await prisma.agent.findUnique({ where: { id: agentId } })
        if (!agent) {
            throw createError({ statusCode: 404, message: `Agent ${agentId} not found` })
        }

        const csvText = file.data.toString('utf-8')
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
        if (parsed.errors?.length) {
            throw createError({ statusCode: 400, message: 'CSV parse error' })
        }

        // Приводим строки к типам модели Call
        const rows = (parsed.data as any[]).map((row) => {
            const ts = Number(String(row.Time ?? '').split(',')[0])        // секунды
            const date = new Date(ts * 1000)
            const phone = String(row.Number ?? '').replace(/\D/g, '')
            const duration = Number(row.Duration)
            const status = String(row.Info ?? '').trim()
            const price = 0

            if (!phone || !Number.isFinite(duration) || isNaN(date.getTime()) || !status) return null

            // Если у тебя enum в Prisma (например, CallStatus), тут надо маппить строку к enum
            // const statusEnum: Prisma.CallUncheckedCreateInput['status'] = mapStatus(status)

            const one: Prisma.CallUncheckedCreateInput = {
                agentId,
                date,
                phone,
                duration,
                price,
                status, // или statusEnum
            }
            return one
        }).filter(Boolean) as Prisma.CallUncheckedCreateInput[]

        if (rows.length === 0) {
            return { success: false, message: 'No valid records to save.' }
        }

        // Дедуп внутри файла
        const seen = new Set<string>()
        const fileUnique = rows.filter(r => {
            const key = `${r.phone}|${r.date.toISOString()}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })

        // Вычитаем то, что уже есть в БД у ЭТОГО же агента
        const keys = [...seen].map(k => {
            const [phone, iso] = k.split('|')
            return { phone, date: new Date(iso) }
        })

        let existingSet = new Set<string>()
        if (keys.length) {
            const existing = await prisma.calls.findMany({
                where: {
                    agentId,                        // важное отличие — ограничиваем текущим агентом
                    OR: keys.map(k => ({ phone: k.phone, date: k.date })),
                },
                select: { phone: true, date: true },
            })
            existingSet = new Set(existing.map(e => `${e.phone}|${e.date.toISOString()}`))
        }

        const toInsert = fileUnique.filter(r => !existingSet.has(`${r.phone}|${r.date.toISOString()}`))
        if (!toInsert.length) {
            return { success: true, message: 'No new records to insert (duplicates).' }
        }

        const result = await prisma.calls.createMany({
            data: toInsert,
            // skipDuplicates: true // включай, если есть @@unique([agentId, phone, date]) в схеме
        })

        return { success: true, count: result.count }
    } catch (err: any) {
        // Не «съедаем» уже подготовленные H3 ошибки
        if (isError(err)) throw err
        console.error('Upload error:', err)
        throw createError({ statusCode: 500, message: 'Upload failed' })
    }
})

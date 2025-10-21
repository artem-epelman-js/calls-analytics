import { createError, readBody, getRouterParam } from 'h3'
import type { Prisma } from '@prisma/client'
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
    const idParam = event.context.params?.id
    const id = Number(idParam)
    if (!Number.isFinite(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid messanger id' })
    }

    const body = await readBody<{ type?:string, isRecovery?: boolean; count?: number; date?: string, price?: number }>(event)

    const data: Prisma.MessangerUpdateInput = {}
    if (body.isRecovery   !== undefined) data.isRecovery   = body.isRecovery
    if (body.count !== undefined) data.count = body.count
    if (body.price !== undefined) data.price = body.price
    if (body.type !== undefined) data.type = body.type
    if (body.date  !== undefined) data.date  = new Date(body.date)

    if (Object.keys(data).length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
    }

    try {
        return await prisma.messanger.update({
            where: { id },
            data,
            select: { id: true, geo: true, count: true, date: true, updatedAt: true }
        })
    } catch (err: any) {
        if (err?.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'Messanger not found' })
        console.error('messanger.update error:', err)
        throw createError({ statusCode: 500, statusMessage: 'Server Error' })
    }
})

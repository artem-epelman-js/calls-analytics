import { createError, readBody } from 'h3'
import { Prisma } from '@prisma/client'
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
    const body = await readBody<{ id?: number; count?: number; price?: number, geo?:string, date?:string}>(event)
    const id = Number(body?.id)
    if (!Number.isFinite(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid live id' })
    }

    const data: Prisma.LiveUpdateInput = {}
    if (body.count !== undefined) data.count = body.count
    if (body.price !== undefined) data.price = body.price
    if (body.date !== undefined) data.date = body.date
    if (body.geo !== undefined) data.geo = body.geo
    if (Object.keys(data).length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
    }

    try {
        const updated = await prisma.live.update({
            where: { id },
            data,
            select: { id: true, count: true, price: true, geo: true, date: true}
        })
        return updated
    } catch (err: any) {
        if (err?.code === 'P2025') {
            throw createError({ statusCode: 404, statusMessage: 'Live not found' })
        }
        console.error('Live update error:', err)
        throw createError({ statusCode: 500, statusMessage: 'Server Error' })
    }
})

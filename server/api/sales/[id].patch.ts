import {createError, H3Event, readBody} from 'h3'
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event: H3Event) => {
    const idParam = getRouterParam(event, 'id')
    const id = Number(idParam)
    if (!id || Number.isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid sale id' })
    }

    const body = await readBody<{ isActive?: boolean }>(event)
    if (typeof body?.isActive !== 'boolean') {
        throw createError({ statusCode: 400, statusMessage: 'isActive must be boolean' })
    }

    return await prisma.sale.update({
        where: {id},
        data: {isActive: body.isActive},
        select: {id: true, isActive: true},
    })
})
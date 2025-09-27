// server/api/live/[id].delete.ts
import type { H3Event } from 'h3'
import { createError, getQuery, readBody, getRequestURL } from 'h3'
// ВАЖНО: относительный путь до utils/prisma.ts из этого файла
import prisma from '../../../utils/prisma'

function extractIdHard(event: H3Event): number | null {
    // 1) params (если вдруг всё-таки работают)
    // @ts-ignore
    const p = (event as any).context?.params?.id ?? (event as any).context?.params?.['id']
    if (p && Number.isFinite(Number(p))) return Number(p)

    // 2) query/body как запасные варианты
    const q = getQuery(event)
    // readBody может бросать — вызываем снаружи функции (ниже)
    // 3) резерв: парсим прямо из URL
    const url = getRequestURL(event) // полноценный URL
    // ожидаем /api/live/<id> или /api/live/<id>/...
    const m = url.pathname.match(/\/api\/live\/(\d+)(?:\/|$)/)
    if (m && m[1]) return Number(m[1])

    return null
}

export default defineEventHandler(async (event) => {
    try {
        const url = getRequestURL(event)
        const q = getQuery(event)
        let body: any = {}
        try { body = await readBody(event) } catch {}

        let id = extractIdHard(event)
        if (!Number.isFinite(id as number)) {
            // если из params/url не достали — пробуем из query/body
            const candidate = Number((q.id as any) ?? body?.id)
            if (Number.isFinite(candidate)) id = candidate
        }

        // отладка — смотри в консоли сервера
        console.log('[DELETE /api/live/:id] debug ->', {
            path: url.pathname,
            method: event.method,
            params: (event as any).context?.params,
            queryId: q.id,
            bodyId: body?.id,
            finalId: id
        })

        if (!Number.isFinite(id as number) || (id as number) <= 0) {
            throw createError({ statusCode: 400, message: 'Некорректный ID' })
        }

        const deleted = await prisma.live.delete({ where: { id: id as number } })
        return { success: true, message: `Live #${id} успешно удалён`, data: deleted }
    } catch (err: any) {
        if (err?.code === 'P2025') {
            throw createError({ statusCode: 404, message: 'Запись не найдена' })
        }
        if (err?.statusCode) throw err
        console.error('Error deleting live:', err)
        throw createError({ statusCode: 500, message: 'Не удалось удалить запись' })
    }
})

import {z} from "zod";
import {MessangerType} from "@prisma/client";

export const messangerValidator = z.object({
    agentId: z.number(),
    date: z.coerce.date('Выберите дату'),
    count: z.number().min(1, 'Минимум 1 выдача')
        .max(50, 'Максимум 50 выдач на анфас'),
    type: z.enum(MessangerType),
    isRecovery: z.boolean().optional(),
})
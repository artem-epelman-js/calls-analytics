import {z} from "zod";
import {geo} from "@prisma/client";


export const LiveValidator = z.object({
    agentId: z.number('Такого юзера не существует'),
    date: z.coerce.date('Введите корректную дату'),
    count: z.number().min(1,'Минимум 1 лид').max(100, 'Максимум 3000 лидов'),
    geo: z.enum(geo),
})




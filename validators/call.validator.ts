import {z} from "zod";


export const callValidator = z.object({
    agentId: z.number(),
    date: z.coerce.date('Выберите дату'),
    phone: z.string()
        .min(6, 'Минимум 6 цифр')
        .max(12, 'Максимум 12 цифр'),
    duration: z.number(),
    price: z.number().optional(),
    status: z.string(),
})
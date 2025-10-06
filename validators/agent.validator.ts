import {z} from "zod";


export const agentValidator = z.object({
    stage: z.string('Поле не должно быть пустым')
        .min(3, 'Минимум 3 буквы')
        .max(25, 'Максимум 25 буквы'),
    isActive: z.boolean()
})
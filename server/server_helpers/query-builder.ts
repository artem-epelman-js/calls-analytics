import { Prisma } from '@prisma/client';

type QueryParams = {
    page?: number | string;
    pageSize?: number | string;
    limit?: number | string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
    [key: string]: any;
};

type FindManyArgs = {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
};

const RESERVED = new Set([ // todo узнать для чего класс Set
    'page',
    'pageSize',
    'limit',
    'search',
    'sortBy',
    'sortOrder',
]);

type Op =
    | 'eq' // equal
    | 'ne' // not equal
    | 'gt' // greater than
    | 'gte' // greater than ?
    | 'lt' // lower than
    | 'lte' // lower than
    | 'in' // in
    | 'nin' // not in
    | 'contains'
    | 'startsWith'
    | 'endsWith';

const DEFAULT_STRING_MODE: 'default' | 'insensitive' = 'insensitive'; // todo узнать для чего это

export class QueryBuilder<Args extends FindManyArgs> {
    private query: Args; // todo узнать почему именно private
    private queryParams: QueryParams;
    private searchFields: string[];
    private filterableFields: string[];
    // если надо — можно включить 'some' для определённых root-отношений (posts.title → posts.some.title)
    private relationsWithSome = new Set<string>(); // todo узнать для чего это

    constructor( // todo
        queryParams: QueryParams,
        searchFields: string[] = [],
        filterableFields: string[] = [],
    ) {
        this.queryParams = queryParams;
        this.searchFields = searchFields;
        this.filterableFields = filterableFields;
        this.query = {} as Args;
    }

    /** для 1:many связей, где нужен not is, а some */
    useSomeFor(paths: string[]) {
        paths.forEach((p) => this.relationsWithSome.add(p.split('.')[0]));
        return this;
    }

    private static parseScalar(v: any) {
        if (v === 'true') return true;
        if (v === 'false') return false;
        if (v === 'null') return null;
        if (typeof v === 'string') {
            const s = v.trim();
            if (s === '') return undefined; // <-- игнорируем пустые строки
            if (!Number.isNaN(Number(s))) return Number(s);
            // детект даты, если используешь его здесь (опц.)
            if (
                /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$/i.test(s)
            ) {
                const d = new Date(s);
                if (!isNaN(d.getTime())) return d;
            }
            return s;
        }
    }

    private static toArray(val: any): any[] | null {
        if (Array.isArray(val)) {
            const arr = val
                .map((v) => (typeof v === 'string' ? v.trim() : v))
                .filter((v) => !(typeof v === 'string' && v === ''));
            return arr.length ? arr : null;
        }
        if (typeof val === 'string') {
            const s = val.trim();
            if (s === '') return null; // <-- пустая строка
            if (s.includes(',')) {
                const arr = s
                    .split(',')
                    .map((p) => p.trim())
                    .filter(Boolean);
                return arr.length ? arr : null;
            }
        }
        return null;
    }

    private static deepMerge<A extends object, B extends object>(
        a: A,
        b: B,
    ): A & B {
        const out: any = { ...a };
        for (const [k, v] of Object.entries(b)) {
            if (
                v &&
                typeof v === 'object' &&
                !Array.isArray(v) &&
                out[k] &&
                typeof out[k] === 'object'
            ) {
                out[k] = QueryBuilder.deepMerge(out[k], v as any);
            } else {
                out[k] = v;
            }
        }
        return out;
    }

    private relationWrapper(key: string, payload: any) {
        // key = 'user.manager.id' → оборачиваем от конца
        const parts = key.split('.');
        let node: any = { [parts[parts.length - 1]]: payload };
        for (let i = parts.length - 2; i >= 0; i--) {
            const rel = this.relationsWithSome.has(parts[i]) ? 'some' : 'is';
            node = { [parts[i]]: { [rel]: node } };
        }
        return node;
    }

    /** собрать выражение для поля+оператора */
    private buildWhereForFieldOp(baseField: string, op: Op, raw: any) {
        const array = QueryBuilder.toArray(raw);
        const parse = (v: any) => QueryBuilder.parseScalar(v);

        switch (op) {
            case 'eq': {
                const value = parse(raw);
                if (value === undefined) return null; // <-- skip пустое
                return { [baseField]: value };
            }
            case 'ne': {
                const value = parse(raw);
                if (value === undefined) return null;
                return { [baseField]: { not: value } };
            }
            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte': {
                const value = parse(raw);
                if (value === undefined) return null; // <-- skip пустое
                return { [baseField]: { [op]: value } };
            }
            case 'in': {
                const list = (array ?? [raw]).map(parse).filter((v) => v !== undefined);
                if (!list.length) return null; // <-- skip пустой список
                return { [baseField]: { in: list } };
            }
            case 'nin': {
                const list = (array ?? [raw]).map(parse).filter((v) => v !== undefined);
                if (!list.length) return null;
                return { [baseField]: { notIn: list } };
            }
            case 'contains': {
                const s = typeof raw === 'string' ? raw.trim() : '';
                if (!s) return null; // <-- skip пустую строку
                return { [baseField]: { contains: s, mode: DEFAULT_STRING_MODE } };
            }
            case 'startsWith': {
                const s = typeof raw === 'string' ? raw.trim() : '';
                if (!s) return null;
                return { [baseField]: { startsWith: s, mode: DEFAULT_STRING_MODE } };
            }
            case 'endsWith': {
                const s = typeof raw === 'string' ? raw.trim() : '';
                if (!s) return null;
                return { [baseField]: { endsWith: s, mode: DEFAULT_STRING_MODE } };
            }
        }
    }

    /** фильтрация по whitelist полям + операторы __op */
    filter() {
        let where: any = this.query.where ?? {};

        // проход по всем параметрам, кроме служебных
        for (const [key, raw] of Object.entries(this.queryParams)) {
            if (RESERVED.has(key)) continue;

            // распарсим ключ: field__op
            const m = key.match(
                /^(?<field>.+?)(?:__(?<op>eq|ne|gt|gte|lt|lte|in|nin|contains|startsWith|endsWith))?$/,
            );
            if (!m || !m.groups) continue;
            const baseField = m.groups.field;
            const op: Op = (m.groups.op as Op) || 'eq';

            // только разрешённые поля
            if (!this.filterableFields.includes(baseField)) continue;

            // dot-path или плоское поле
            const payload = this.buildWhereForFieldOp(
                baseField.split('.').pop()!,
                op,
                raw,
            );
            if (!payload) continue;

            const node = baseField.includes('.')
                ? this.relationWrapper(baseField, payload[baseField.split('.').pop()!])
                : payload;

            where = QueryBuilder.deepMerge(where, node);
        }

        this.query.where = where;
        return this;
    }

    /** полнотекстовый поиск (contains, insensitive) по списку полей, поддерживает dot-path */
    search() {
        const termRaw = this.queryParams.search;
        const term = typeof termRaw === 'string' ? termRaw.trim() : '';
        if (!term || this.searchFields.length === 0) return this;

        const clauses = this.searchFields.map((field) => {
            if (field.includes('.')) {
                // обёртка relation.contains
                const last = field.split('.').pop()!;
                const inner = { [last]: { contains: term, mode: DEFAULT_STRING_MODE } };
                return this.relationWrapper(field, inner[last]);
            }
            return { [field]: { contains: term, mode: DEFAULT_STRING_MODE } };
        });

        const where = this.query.where ?? {};
        this.query.where = QueryBuilder.deepMerge(where, { OR: clauses });
        return this;
    }

    /** сортировка (поддержка dot-path для 1:1/many-to-one) */
    sort(defaults?: { sortBy?: string; sortOrder?: Prisma.SortOrder }) {
        const sortBy = this.queryParams.sortBy || defaults?.sortBy;
        const sortOrder =
            (this.queryParams.sortOrder as Prisma.SortOrder) ||
            defaults?.sortOrder ||
            'desc';

        if (sortBy) {
            const parts = String(sortBy).split('.');
            const orderBy = parts.reduceRight<any>(
                (acc, k) => ({ [k]: acc }),
                sortOrder,
            );
            (this.query as any).orderBy = orderBy;
        } else {
            (this.query as any).orderBy = { createdAt: 'desc' };
        }
        return this;
    }

    /** пагинация: page + (pageSize | limit), -1 = без лимита */
    paginate() {
        const page = Number(this.queryParams.page ?? 1) || 1;
        const limitParam = this.queryParams.pageSize ?? this.queryParams.limit;
        const limit = limitParam == null ? 10 : Number(limitParam);

        if (limit !== -1) {
            (this.query as any).skip = (page - 1) * limit;
            (this.query as any).take = limit;
        }
        return this;
    }

    build(): Args {
        return this.query;
    }
}







/* eslint-disable @typescript-eslint/no-explicit-any -- minimal in-memory Firestore fake */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLANS } from '@/infrastructure/data/plans';

// In-memory store: collection name -> (doc id -> data)
const store = new Map<string, Map<string, Record<string, unknown>>>();

vi.mock('@/infrastructure/firebase/client', () => ({ db: {}, auth: {} }));

vi.mock('firebase/firestore', () => ({
    collection: (_db: unknown, name: string) => ({ coll: name }),
    doc: (_db: unknown, coll: string, id: string) => ({ coll, id }),
    where: (field: string, op: string, value: unknown) => ({ type: 'where', field, op, value }),
    orderBy: () => ({ type: 'orderBy' }),
    query: (ref: { coll: string }, ...constraints: any[]) => ({
        coll: ref.coll,
        wheres: constraints.filter((c) => c.type === 'where'),
    }),
    getDoc: async (ref: { coll: string; id: string }) => {
        const data = store.get(ref.coll)?.get(ref.id);
        return { id: ref.id, exists: () => data !== undefined, data: () => data };
    },
    getDocs: async (q: { coll: string; wheres?: any[] }) => {
        const entries = [...(store.get(q.coll)?.entries() ?? [])].filter(([, data]) =>
            (q.wheres ?? []).every((w) => data[w.field] === w.value),
        );
        const docs = entries.map(([id, data]) => ({ id, data: () => data }));
        return { empty: docs.length === 0, size: docs.length, docs };
    },
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    setDoc: vi.fn(),
    Timestamp: { now: () => new Date(), fromDate: (d: Date) => d },
}));

import { subscriptionService } from '@/infrastructure/services/subscriptionService';

function put(coll: string, id: string, data: Record<string, unknown>) {
    if (!store.has(coll)) store.set(coll, new Map());
    store.get(coll)!.set(id, data);
}

function seedProperties(userId: string, count: number) {
    for (let i = 0; i < count; i++) put('properties', `p${i}`, { userId });
}

const localBasic = PLANS.find((p) => p.tier === 'basic')!;

describe('trial plan limits', () => {
    beforeEach(() => {
        store.clear();
    });

    it('uses plans/basic properties limit for users without a subscription', async () => {
        put('plans', 'basic', { name: 'Basic', tier: 'basic', limits: { properties: 3, clients: 7 } });
        seedProperties('u1', 3);

        const result = await subscriptionService.checkUsageLimit('u1', 'properties');

        expect(result).toEqual({ allowed: false, current: 3, limit: 3 });
    });

    it('uses plans/basic clients limit for users without a subscription', async () => {
        put('plans', 'basic', { name: 'Basic', tier: 'basic', limits: { properties: 3, clients: 7 } });
        put('inquilinos', 'i1', { userId: 'u1' });
        put('propietarios', 'o1', { userId: 'u1' });

        const result = await subscriptionService.checkUsageLimit('u1', 'clients');

        expect(result).toEqual({ allowed: true, current: 2, limit: 7 });
    });

    it('falls back to the trial plan value when the subscribed plan lacks the resource', async () => {
        put('plans', 'basic', { name: 'Basic', tier: 'basic', limits: { properties: 3, clients: 7 } });
        put('plans', 'custom', { name: 'Custom', tier: 'custom', limits: { properties: 40 } });
        put('subscriptions', 's1', { userId: 'u1', status: 'active', planId: 'custom' });

        const props = await subscriptionService.checkUsageLimit('u1', 'properties');
        const clients = await subscriptionService.checkUsageLimit('u1', 'clients');

        expect(props.limit).toBe(40);
        expect(clients.limit).toBe(7);
    });

    it('getTrialPlan returns plans/basic when it exists', async () => {
        put('plans', 'basic', { name: 'Basic', tier: 'basic', limits: { properties: 3, clients: 7 } });

        const plan = await subscriptionService.getTrialPlan();

        expect(plan?.id).toBe('basic');
        expect(plan?.limits.properties).toBe(3);
    });

    it('getTrialPlan falls back to the first plan with tier basic', async () => {
        put('plans', 'plan-xyz', { name: 'Basic (admin)', tier: 'basic', limits: { properties: 9, clients: 11 } });

        const plan = await subscriptionService.getTrialPlan();

        expect(plan?.id).toBe('plan-xyz');
        expect(plan?.limits.clients).toBe(11);
    });

    it('getTrialPlan falls back to the local PLANS basic entry', async () => {
        // No basic plan in Firestore (by id or tier): the local seed data is used.
        const plan = await subscriptionService.getTrialPlan();

        expect(plan?.tier).toBe('basic');
        expect(plan?.limits).toEqual(localBasic.limits);
    });
});

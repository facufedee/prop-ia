// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Fake Firestore ──────────────────────────────────────────────────────────

type Data = Record<string, unknown>;

const state = {
    posts: [] as { id: string; data: Data }[],
    users: [] as { id: string; data: Data }[],
    newsletters: new Map<string, Data>(),
};
const postUpdateMock = vi.fn();
const newsletterWriteMock = vi.fn();

function newsletterRef(id: string) {
    return {
        id,
        get: async () => ({ exists: state.newsletters.has(id), data: () => state.newsletters.get(id) }),
        set: async (d: Data) => {
            newsletterWriteMock('set', id, d);
            state.newsletters.set(id, d);
        },
        update: async (d: Data) => {
            newsletterWriteMock('update', id, d);
            state.newsletters.set(id, { ...state.newsletters.get(id), ...d });
        },
    };
}

const fakeDb = {
    collection: (name: string) => {
        if (name === 'blog_posts') {
            return {
                where: (field: string, _op: string, value: unknown) => ({
                    get: async () => ({
                        docs: state.posts
                            .filter((p) => p.data[field] === value)
                            .map((p) => ({
                                id: p.id,
                                data: () => p.data,
                                ref: { update: async (d: Data) => postUpdateMock(p.id, d) },
                            })),
                    }),
                }),
            };
        }
        if (name === 'users') {
            return {
                get: async () => ({ docs: state.users.map((u) => ({ id: u.id, data: () => u.data })) }),
            };
        }
        if (name === 'newsletters') {
            return { doc: (id: string) => newsletterRef(id) };
        }
        throw new Error(`unexpected collection ${name}`);
    },
    runTransaction: async <T,>(fn: (tx: unknown) => Promise<T>) =>
        fn({
            get: (ref: ReturnType<typeof newsletterRef>) => ref.get(),
            set: (ref: ReturnType<typeof newsletterRef>, d: Data) => {
                void ref.set(d);
            },
        }),
};

vi.mock('@/infrastructure/firebase/admin', () => ({ adminDb: fakeDb }));

// ── Fake Resend ─────────────────────────────────────────────────────────────

const batchSendMock = vi.fn();
const emailSendMock = vi.fn();

vi.mock('@/lib/resend', () => ({
    resendClient: { batch: { send: batchSendMock }, emails: { send: emailSendMock } },
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

const ts = (iso: string) => ({ toMillis: () => new Date(iso).getTime() });

function post(slug: string, publishedAt: string, extra: Data = {}) {
    return {
        id: `id-${slug}`,
        data: {
            title: `Title ${slug}`,
            slug,
            excerpt: `Excerpt ${slug}`,
            imageUrl: `https://img.example/${slug}.jpg`,
            category: 'Alquileres',
            published: true,
            publishedAt: ts(publishedAt),
            ...extra,
        },
    };
}

function users(n: number) {
    return Array.from({ length: n }, (_, i) => ({
        id: `u${i}`,
        data: { email: `user${i}@example.com`, displayName: `User ${i}` },
    }));
}

type SentEmail = {
    to: string[] | string;
    from: string;
    replyTo: string;
    html: string;
    text: string;
    headers: Record<string, string>;
};

async function load() {
    return import('../lib/newsletter/sendNewsletter');
}

beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    state.posts = [];
    state.users = [];
    state.newsletters = new Map();
    postUpdateMock.mockReset();
    newsletterWriteMock.mockReset();
    batchSendMock.mockReset().mockImplementation(async (emails: unknown[]) => ({
        data: { data: emails.map((_, i) => ({ id: `e${i}` })) },
        error: null,
    }));
    emailSendMock.mockReset().mockResolvedValue({ data: { id: 'single' }, error: null });
});

// ── renderNewsletter ────────────────────────────────────────────────────────

describe('renderNewsletter', () => {
    it('escapes HTML in dynamic strings and includes the unsubscribe link in html and text', async () => {
        const { renderNewsletter } = await import('../lib/newsletter/template');
        const unsubscribeUrl = 'https://zetaprop.com.ar/unsubscribe?u=abc&t=xyz';

        const result = renderNewsletter({
            posts: [
                { title: '<script>alert(1)</script>', slug: 'uno', excerpt: 'A & B "quoted"', category: 'Tips' },
                { title: 'Segunda nota', slug: 'dos', excerpt: 'Otra', category: '<b>Cat</b>', imageUrl: 'https://img/x.jpg' },
            ],
            unsubscribeUrl,
            recipientName: '<Ana>',
        });

        expect(result.html).not.toContain('<script>alert(1)</script>');
        expect(result.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(result.html).toContain('A &amp; B &quot;quoted&quot;');
        expect(result.html).toContain('&lt;b&gt;Cat&lt;/b&gt;');
        expect(result.html).toContain('&lt;Ana&gt;');
        expect(result.html).toContain('https://zetaprop.com.ar/unsubscribe?u=abc&amp;t=xyz');
        expect(result.html).toContain('https://zetaprop.com.ar/blog/uno');
        expect(result.html).toContain('Recibís este correo porque tenés una cuenta en Zeta Prop.');
        expect(result.text).toContain(unsubscribeUrl);
        expect(result.text).toContain('https://zetaprop.com.ar/blog/dos');
        expect(result.text).toContain('Segunda nota');
        expect(result.subject).toBe('Nuevas notas: <script>alert(1)</script> y Segunda nota');
    });
});

// ── sendNewsletter ──────────────────────────────────────────────────────────

describe('sendNewsletter', () => {
    it('skips when fewer than 2 posts are pending', async () => {
        state.posts = [post('a', '2026-10-01'), post('old', '2026-09-01', { newsletterSentAt: ts('2026-09-02') })];
        state.users = users(3);
        const { sendNewsletter } = await load();

        const result = await sendNewsletter({});

        expect(result).toEqual({ status: 'skipped', reason: 'not_enough_posts', pending: 1 });
        expect(batchSendMock).not.toHaveBeenCalled();
        expect(newsletterWriteMock).not.toHaveBeenCalled();
    });

    it('dryRun reports recipients and posts without sending or writing', async () => {
        state.posts = [post('a', '2026-10-01'), post('b', '2026-10-02'), post('draft', '2026-10-03', { published: false })];
        state.users = users(5);
        const { sendNewsletter } = await load();

        const result = await sendNewsletter({ dryRun: true });

        expect(result).toMatchObject({ status: 'dry_run', recipients: 5, posts: ['b', 'a'] });
        expect(batchSendMock).not.toHaveBeenCalled();
        expect(emailSendMock).not.toHaveBeenCalled();
        expect(newsletterWriteMock).not.toHaveBeenCalled();
        expect(postUpdateMock).not.toHaveBeenCalled();
    });

    it('batches 250 recipients into 3 calls with List-Unsubscribe headers and unique unsubscribe URLs', async () => {
        state.posts = [post('a', '2026-10-01'), post('b', '2026-10-02')];
        state.users = users(250);
        const { sendNewsletter } = await load();

        const result = await sendNewsletter({});

        expect(batchSendMock).toHaveBeenCalledTimes(3);
        const sizes = batchSendMock.mock.calls.map((c) => (c[0] as unknown[]).length);
        expect(sizes).toEqual([100, 100, 50]);

        const emails = batchSendMock.mock.calls.flatMap((c) => c[0] as SentEmail[]);
        const listUnsub = new Set<string>();
        for (const email of emails) {
            expect(email.from).toBe('Zeta Prop <newsletter@zetaprop.com.ar>');
            expect(email.replyTo).toBe('contacto@zetaprop.com.ar');
            expect(email.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
            expect(email.headers['List-Unsubscribe']).toMatch(
                /^<https:\/\/zetaprop\.com\.ar\/api\/newsletter\/unsubscribe\?u=[^>]+>, <mailto:contacto@zetaprop\.com\.ar\?subject=unsubscribe>$/
            );
            expect(email.text).toContain('https://zetaprop.com.ar/unsubscribe?u=');
            expect(email.html).toContain('https://zetaprop.com.ar/unsubscribe?u=');
            listUnsub.add(email.headers['List-Unsubscribe']);
        }
        expect(listUnsub.size).toBe(250);

        expect(result).toMatchObject({ status: 'sent', recipients: 250, sent: 250, failed: 0, posts: ['b', 'a'] });
        expect(postUpdateMock).toHaveBeenCalledTimes(2);
        expect(postUpdateMock).toHaveBeenCalledWith('id-a', expect.objectContaining({ newsletterSentAt: expect.anything() }));
        expect(state.newsletters.get('a__b')).toMatchObject({ status: 'sent', sent: 250, failed: 0 });
    });

    it('excludes unsubscribed users, empty emails and duplicate addresses', async () => {
        state.posts = [post('a', '2026-10-01'), post('b', '2026-10-02')];
        state.users = [
            { id: 'u1', data: { email: 'one@example.com' } },
            { id: 'u2', data: { email: 'ONE@example.com' } },
            { id: 'u3', data: { email: 'gone@example.com', unsubscribedMarketing: true } },
            { id: 'u4', data: { email: null } },
            { id: 'u5', data: { email: '   ' } },
            { id: 'u6', data: { email: 'two@example.com', unsubscribedMarketing: false } },
        ];
        const { sendNewsletter } = await load();

        await sendNewsletter({});

        const recipients = batchSendMock.mock.calls
            .flatMap((c) => c[0] as SentEmail[])
            .flatMap((e) => e.to);
        expect(recipients.sort()).toEqual(['one@example.com', 'two@example.com']);
    });

    it('skips when the idempotency doc is already marked sent', async () => {
        state.posts = [post('a', '2026-10-01'), post('b', '2026-10-02')];
        state.users = users(3);
        state.newsletters.set('a__b', { status: 'sent' });
        const { sendNewsletter } = await load();

        const result = await sendNewsletter({});

        expect(result).toMatchObject({ status: 'skipped', reason: 'already_sent' });
        expect(batchSendMock).not.toHaveBeenCalled();
        expect(postUpdateMock).not.toHaveBeenCalled();
    });

    it('keeps sending after a failed chunk and reports a partial send', async () => {
        state.posts = [post('a', '2026-10-01'), post('b', '2026-10-02')];
        state.users = users(150);
        batchSendMock.mockResolvedValueOnce({ data: null, error: { name: 'rate_limit_exceeded', message: 'slow down' } });
        const { sendNewsletter } = await load();

        const result = await sendNewsletter({});

        expect(batchSendMock).toHaveBeenCalledTimes(2);
        expect(result).toMatchObject({ status: 'partial', sent: 50, failed: 100 });
        expect(postUpdateMock).toHaveBeenCalledTimes(2);
        expect(state.newsletters.get('a__b')).toMatchObject({ status: 'partial', failed: 100 });
    });

    it('does not mark posts when every chunk fails, so the next run can retry', async () => {
        state.posts = [post('a', '2026-10-01'), post('b', '2026-10-02')];
        state.users = users(10);
        batchSendMock.mockResolvedValue({ data: null, error: { name: 'application_error', message: 'boom' } });
        const { sendNewsletter } = await load();

        const result = await sendNewsletter({});

        expect(result).toMatchObject({ status: 'failed', sent: 0, failed: 10 });
        expect(postUpdateMock).not.toHaveBeenCalled();
        expect(state.newsletters.get('a__b')).toMatchObject({ status: 'failed' });
    });

    it('testTo sends exactly one email and writes nothing', async () => {
        state.posts = [post('a', '2026-10-01'), post('b', '2026-10-02')];
        state.users = users(3);
        const { sendNewsletter } = await load();

        const result = await sendNewsletter({ testTo: 'USER1@example.com' });

        expect(emailSendMock).toHaveBeenCalledTimes(1);
        const payload = emailSendMock.mock.calls[0][0] as SentEmail;
        expect(payload.to).toEqual(['USER1@example.com']);
        expect(payload.headers['List-Unsubscribe']).toContain('u=u1');
        expect(batchSendMock).not.toHaveBeenCalled();
        expect(postUpdateMock).not.toHaveBeenCalled();
        expect(newsletterWriteMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({ status: 'test_sent', to: 'USER1@example.com', posts: ['b', 'a'] });
    });

    it('testTo for an unknown address signs the unsubscribe link with the literal "test" id', async () => {
        state.posts = [post('a', '2026-10-01'), post('b', '2026-10-02')];
        const { sendNewsletter } = await load();

        await sendNewsletter({ testTo: 'owner@example.com' });

        const payload = emailSendMock.mock.calls[0][0] as SentEmail;
        expect(payload.headers['List-Unsubscribe']).toContain('u=test');
    });
});

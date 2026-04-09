/**
 * Lightweight service for looking up site slugs by custom domain.
 * This is designed to be compatible with Next.js Edge Runtime (Middleware).
 * Uses the Firestore REST API to avoid heavy SDK dependencies.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prop-ia";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
const REST_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`;

export const domainLookupService = {
    /**
     * Finds a site slug associated with a custom domain.
     * @param domain The hostname to look up (e.g., claudiogomezinmuebles.com)
     * @returns The slug if found and verified, null otherwise.
     */
    async findSlugByDomain(domain: string): Promise<string | null> {
        if (!domain) return null;

        // Normalize domain: remove www. if present
        const normalizedDomain = domain.startsWith('www.') ? domain.slice(4) : domain;
        console.log(`[DomainLookup] Looking up: ${domain} (normalized: ${normalizedDomain})`);

        const body = {
            structuredQuery: {
                from: [{ collectionId: "sites" }],
                where: {
                    compositeFilter: {
                        op: "AND",
                        filters: [
                            {
                                fieldFilter: {
                                    field: { fieldPath: "customDomain" },
                                    op: "EQUAL",
                                    value: { stringValue: normalizedDomain }
                                }
                            },
                                {
                                    fieldFilter: {
                                        field: { fieldPath: "customDomainVerified" },
                                        op: "EQUAL",
                                        value: { booleanValue: true }
                                    }
                                },
                                {
                                    fieldFilter: {
                                        field: { fieldPath: "published" },
                                        op: "EQUAL",
                                        value: { booleanValue: true }
                                    }
                                }
                            ]
                        }
                    },
                    limit: 1
                }
            };

        try {
            const response = await fetch(REST_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                console.error("domainLookupService: Firestore REST error", await response.text());
                return null;
            }

            const data = await response.json();
            
            // data is an array of objects like [{ document: { fields: { slug: { stringValue: "..." } } } }]
            if (data && data.length > 0 && data[0].document) {
                return data[0].document.fields.slug?.stringValue || null;
            }

            return null;
        } catch (error) {
            console.error("domainLookupService: Error in findSlugByDomain", error);
            return null;
        }
    }
};

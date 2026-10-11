/**
 * Firestore collection of newsletter subscribers without an account. Kept in a
 * dependency-free module so readers (newsletter send, unsubscribe) do not pull
 * in the subscription flow's email dependencies.
 */
export const SUBSCRIBERS_COLLECTION = 'newsletter_subscribers';

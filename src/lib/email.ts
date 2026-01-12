import { ServerClient } from 'postmark';

const postmarkToken = process.env.POSTMARK_API_TOKEN;

if (!postmarkToken) {
    if (process.env.NODE_ENV === 'production') {
        console.warn('POSTMARK_API_TOKEN is not set in environment variables.');
    }
}

export const postmarkClient = postmarkToken ? new ServerClient(postmarkToken) : null;

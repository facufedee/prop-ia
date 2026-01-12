import { VerificationEmail } from '@/ui/emails/VerificationEmail';

export async function renderVerificationEmail(link: string, name?: string): Promise<string> {
    const ReactDOMServer = (await import('react-dom/server')).default;
    return ReactDOMServer.renderToStaticMarkup(<VerificationEmail verificationLink={link} userName={name} />);
}

import { Head } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';

export default function DocumentationLayout({ children }: PropsWithChildren) {
    return (
        <>
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="min-h-screen bg-background">
                {children}
            </div>
        </>
    );
}

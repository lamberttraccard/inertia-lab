import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            // Shared on every response by HandleInertiaRequests::share(), so the chapter
            // header can read it on any of the 33 chapter pages without each one adding
            // it to its own props type.
            totalChapters: number;
            [key: string]: unknown;
        };
    }
}

/// <reference types="vite/client" />

// Laravel Wayfinder global route function
declare global {
    function route(name: string, params?: unknown): string;
}

// This export makes this file a module, allowing global declarations
export {};

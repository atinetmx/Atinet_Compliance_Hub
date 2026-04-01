export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-12 items-center justify-center">
                <img
                    src="/images/logo-atinet.png"
                    alt="Atinet"
                    className="h-12 w-auto object-contain"
                />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    Atinet Compliance Hub
                </span>
                <span className="text-xs text-muted-foreground hidden group-data-[collapsible=icon]:hidden">
                    Soluciones Notariales
                </span>
            </div>
        </>
    );
}

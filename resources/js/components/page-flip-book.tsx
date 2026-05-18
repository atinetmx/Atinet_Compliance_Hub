import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageFlipBookProps {
    children: React.ReactNode;
    width?: number;
    height?: number;
    className?: string;
    showControls?: boolean;
    onFlip?: (data: { page: number; direction: 'forward' | 'backward' }) => void;
}

export interface PageFlipBookRef {
    nextPage: () => void;
    prevPage: () => void;
    goToPage: (page: number) => void;
    getCurrentPage: () => number;
}

const PageComponent = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
    ({ children, className }, ref) => {
        return (
            <div ref={ref} className={cn('bg-card shadow-lg', className)}>
                <div className="h-full overflow-y-auto overflow-x-hidden">{children}</div>
            </div>
        );
    }
);
PageComponent.displayName = 'Page';

export const PageFlipBook = forwardRef<PageFlipBookRef, PageFlipBookProps>(
    ({ children, width = 900, height = 1200, className, showControls = true, onFlip }, ref) => {
        const bookRef = useRef<any>(null);
        const [currentPage, setCurrentPage] = useState(0);
        const [totalPages, setTotalPages] = useState(0);
        const [isFullscreen, setIsFullscreen] = useState(false);
        const containerRef = useRef<HTMLDivElement>(null);
        const [dimensions, setDimensions] = useState({ width, height });

        // Convertir children a array
        const pages = React.Children.toArray(children);

        useEffect(() => {
            setTotalPages(pages.length);
        }, [pages.length]);

        // Calcular dimensiones basadas en el viewport
        useEffect(() => {
            const updateDimensions = () => {
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                if (isFullscreen) {
                    // En fullscreen, usar el 90% del viewport
                    const maxWidth = viewportWidth * 0.45; // 45% por página (90% total para 2 páginas)
                    const maxHeight = viewportHeight * 0.85;
                    setDimensions({
                        width: Math.min(maxWidth, 1200),
                        height: Math.min(maxHeight, 1600)
                    });
                } else {
                    // En modo normal, usar el 80% del ancho disponible
                    if (viewportWidth < 640) {
                        // Mobile
                        setDimensions({ width: viewportWidth * 0.85, height: viewportWidth * 1.3 });
                    } else if (viewportWidth < 1024) {
                        // Tablet
                        setDimensions({ width: viewportWidth * 0.5, height: viewportWidth * 0.65 });
                    } else {
                        // Desktop - 40% del ancho por página (80% total)
                        const pageWidth = viewportWidth * 0.4;
                        const pageHeight = pageWidth * 1.33; // Ratio 3:4
                        setDimensions({ 
                            width: Math.min(pageWidth, 1200), 
                            height: Math.min(pageHeight, 1600) 
                        });
                    }
                }
            };

            updateDimensions();
            window.addEventListener('resize', updateDimensions);
            return () => window.removeEventListener('resize', updateDimensions);
        }, [isFullscreen]);

        const nextPage = useCallback(() => {
            if (bookRef.current) {
                bookRef.current.pageFlip().flipNext();
            }
        }, []);

        const prevPage = useCallback(() => {
            if (bookRef.current) {
                bookRef.current.pageFlip().flipPrev();
            }
        }, []);

        const goToPage = useCallback((page: number) => {
            if (bookRef.current) {
                bookRef.current.pageFlip().flip(page);
            }
        }, []);

        const getCurrentPage = useCallback(() => {
            return currentPage;
        }, [currentPage]);

        useImperativeHandle(ref, () => ({
            nextPage,
            prevPage,
            goToPage,
            getCurrentPage,
        }));

        const handleFlip = (e: any) => {
            setCurrentPage(e.data);
            onFlip?.({
                page: e.data,
                direction: e.data > currentPage ? 'forward' : 'backward',
            });
        };

        const toggleFullscreen = () => {
            if (!document.fullscreenElement) {
                containerRef.current?.requestFullscreen();
                setIsFullscreen(true);
            } else {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        };

        useEffect(() => {
            const handleFullscreenChange = () => {
                setIsFullscreen(!!document.fullscreenElement);
            };

            document.addEventListener('fullscreenchange', handleFullscreenChange);
            return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
        }, []);

        return (
            <div ref={containerRef} className={cn('flex flex-col items-center gap-4 p-2 sm:p-4 w-full', className, isFullscreen && 'bg-background')}>
                {/* Libro */}
                <div className="relative w-full flex justify-center">
                    <HTMLFlipBook
                        ref={bookRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        size="stretch"
                        minWidth={280}
                        maxWidth={2000}
                        minHeight={400}
                        maxHeight={2500}
                        maxShadowOpacity={0.5}
                        showCover={true}
                        mobileScrollSupport={true}
                        onFlip={handleFlip}
                        className="shadow-2xl"
                        style={{}}
                        startPage={0}
                        drawShadow={true}
                        flippingTime={1000}
                        usePortrait={true}
                        startZIndex={0}
                        autoSize={true}
                        clickEventForward={true}
                        useMouseEvents={true}
                        swipeDistance={30}
                        showPageCorners={true}
                        disableFlipByClick={false}
                    >
                        {pages.map((page, index) => (
                            <PageComponent key={index} className="p-6 md:p-8">
                                {page}
                            </PageComponent>
                        ))}
                    </HTMLFlipBook>
                </div>

                {/* Controles */}
                {showControls && (
                    <div className="flex items-center gap-4 bg-card p-3 rounded-lg shadow-md border">
                        <Button
                            onClick={prevPage}
                            disabled={currentPage === 0}
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>

                        <div className="flex items-center gap-2 min-w-30 justify-center">
                            <span className="text-sm font-medium">
                                Página {currentPage + 1} de {totalPages}
                            </span>
                        </div>

                        <Button
                            onClick={nextPage}
                            disabled={currentPage >= totalPages - 1}
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>

                        <div className="h-6 w-px bg-border mx-2" />

                        <Button onClick={toggleFullscreen} variant="outline" size="icon" className="h-10 w-10">
                            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                        </Button>
                    </div>
                )}

                {/* Ayuda tactil */}
                <p className="text-xs text-muted-foreground">
                    💡 Haz clic en los bordes o arrastra para pasar páginas. Usa las flechas del teclado.
                </p>
            </div>
        );
    }
);

PageFlipBook.displayName = 'PageFlipBook';

export const Page = PageComponent;

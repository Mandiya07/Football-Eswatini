
import React, { useEffect, useRef } from 'react';

interface ExternalWidgetProps {
    type: 'script' | 'iframe';
    source: string; // The URL for iframe or the script source
    containerId?: string; // Specific ID some widgets look for
    height?: string;
    className?: string;
}

/**
 * Safely handles external football widgets from providers like Scoreaxis, LiveScore, etc.
 */
const ExternalWidget: React.FC<ExternalWidgetProps> = ({ type, source, containerId, height = "500px", className = "" }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (type === 'script' && containerRef.current) {
            // Clean up previous script if any
            const existingScript = containerRef.current.querySelector('script');
            if (existingScript) containerRef.current.removeChild(existingScript);

            const script = document.createElement('script');
            script.src = source;
            script.async = true;
            
            // Handle some widgets that might need attributes (e.g. data-instance)
            // You can extend this to pass more data- attributes if needed
            
            containerRef.current.appendChild(script);
        }
    }, [type, source]);

    if (type === 'iframe') {
        return (
            <div className={`w-full overflow-hidden rounded-xl border border-gray-100 shadow-sm ${className}`} style={{ height }}>
                <iframe
                    src={source}
                    className="w-full h-full border-0"
                    title="Football Widget"
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div 
            ref={containerRef} 
            id={containerId} 
            className={`w-full overflow-hidden min-h-[100px] ${className}`}
            style={{ height: type === 'script' ? 'auto' : height }}
        />
    );
};

export default ExternalWidget;

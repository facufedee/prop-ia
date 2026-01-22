import { BlogPost } from "@/infrastructure/services/blogService";
import { forwardRef } from "react";

interface LinkedInCanvasProps {
    post: BlogPost;
    customTitle?: string;
    customImage?: string;
}

const LinkedInCanvas = forwardRef<HTMLDivElement, LinkedInCanvasProps>(({ post, customTitle, customImage }, ref) => {
    return (
        <div
            ref={ref}
            className="w-[1200px] h-[627px] relative bg-white overflow-hidden flex shadow-2xl"
            style={{ width: '1200px', height: '627px', minWidth: '1200px', minHeight: '627px' }}
        >
            {/* Left Image Section (60%) */}
            <div className="relative w-[60%] h-full">
                <img
                    src={customImage || post.imageUrl || "/placeholder-house.jpg"}
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to right, transparent 0%, rgba(15, 23, 42, 0.9) 100%)' }}
                />
            </div>

            {/* Right Content Section (40%) - Dark */}
            <div className="w-[40%] h-full flex flex-col justify-center px-12 relative" style={{ backgroundColor: '#0f172a' }}>

                {/* Logo */}
                <div className="absolute top-12 left-12">
                    <img
                        src="/assets/img/logo_web_ZetaProp_fondonegro.png"
                        alt="ZetaProp"
                        className="h-12 object-contain"
                    />
                </div>

                {/* Content */}
                <div className="mt-8">
                    <span className="inline-block px-3 py-1 rounded text-sm font-semibold mb-6 tracking-wide uppercase"
                        style={{
                            backgroundColor: 'rgba(79, 70, 229, 0.2)',
                            color: '#a5b4fc',
                            borderColor: 'rgba(99, 102, 241, 0.3)',
                            borderWidth: '1px'
                        }}>
                        {post.category || "Novedades Sectoriales"}
                    </span>

                    <h1 className="text-white text-4xl font-bold leading-tight mb-6" style={{ color: '#ffffff', letterSpacing: '0.5px', fontVariantLigatures: 'none' }}>
                        {customTitle || post.title}
                    </h1>

                    <div className="w-16 h-1 rounded-full mb-6" style={{ backgroundColor: '#6366f1' }} />

                    <p className="text-lg leading-relaxed line-clamp-3" style={{ color: '#9ca3af', letterSpacing: '0.2px', fontVariantLigatures: 'none' }}>
                        {post.excerpt || "Descubrí el análisis completo de esta noticia y cómo impacta en el mercado inmobiliario actual."}
                    </p>
                </div>

                {/* Footer */}
                <div className="absolute bottom-10 left-12 flex items-center text-sm font-medium" style={{ color: '#9ca3af' }}>
                    www.zetaprop.com.ar
                </div>
            </div>
        </div>
    );
});

LinkedInCanvas.displayName = "LinkedInCanvas";

export default LinkedInCanvas;

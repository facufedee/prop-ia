import { BlogPost } from "@/infrastructure/services/blogService";
import { forwardRef } from "react";

interface InstagramCanvasProps {
    post: BlogPost;
    customTitle?: string;
    customImage?: string;
}

const InstagramCanvas = forwardRef<HTMLDivElement, InstagramCanvasProps>(({ post, customTitle, customImage }, ref) => {
    return (
        <div
            ref={ref}
            className="w-[1080px] h-[1080px] relative bg-white overflow-hidden flex flex-col shadow-2xl"
            style={{ width: '1080px', height: '1080px', minWidth: '1080px', minHeight: '1080px' }}
        >
            {/* Background Image - Full Size */}
            <div className="absolute inset-0">
                <img
                    src={customImage || post.imageUrl || "/placeholder-house.jpg"}
                    alt="Background"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Gradient Overlay - Dark at bottom (Inline for html2canvas compatibility) */}
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}
            />

            {/* Content Container */}
            <div className="absolute inset-0 p-16 flex flex-col justify-end items-center text-center">

                {/* Logo Area (Floating or Fixed) */}
                <div className="mb-8">
                    {/* Replace with actual high-res white logo */}
                    <div className="flex items-center gap-3">
                        <img
                            src="/assets/img/logo_web_ZetaProp_fondonegro.png"
                            alt="ZetaProp"
                            className="h-16 object-contain" // Not inverted if it's already white/for dark bg
                        />
                    </div>
                </div>

                {/* Separator */}
                <div className="w-24 h-1 mb-8 rounded-full" style={{ backgroundColor: '#6366f1' }} />

                {/* Title */}
                <h1 className="text-white text-6xl font-extrabold leading-tight tracking-tight mb-8 drop-shadow-lg max-w-4xl uppercase" style={{ color: '#ffffff', letterSpacing: '1px', fontVariantLigatures: 'none' }}>
                    {customTitle || post.title}
                </h1>


            </div>

            {/* Top Right Decoration (Optional) */}
            <div className="absolute top-12 right-12 px-6 py-2 rounded-full text-2xl font-bold backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(79, 70, 229, 0.9)', color: '#ffffff' }}>
                BLOG ZETA PROP
            </div>
        </div>
    );
});

InstagramCanvas.displayName = "InstagramCanvas";

export default InstagramCanvas;

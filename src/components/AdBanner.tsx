import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AdBannerProps {
  position?: 'top' | 'bottom';
  variant?: 'horizontal' | 'square';
}

const AdBanner = ({ position = 'bottom', variant = 'horizontal' }: AdBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [adContent, setAdContent] = useState<{url: string, imageUrl: string, altText: string} | null>(null);

  useEffect(() => {
    // Ejemplo de cómo podrías cargar anuncios de forma dinámica
    // En una implementación real, esto podría venir de una API
    const mockAds = [
      {
        url: 'https://example.com/sponsor1',
        imageUrl: 'https://via.placeholder.com/728x90?text=Anuncie+Aquí+728x90',
        altText: 'Anuncie en el anotador de truco'
      },
      {
        url: 'https://example.com/sponsor2',
        imageUrl: 'https://via.placeholder.com/300x250?text=Su+Anuncio+Aquí+300x250',
        altText: 'Publicite su producto'
      }
    ];
    
    // Seleccionar un anuncio según el variant solicitado
    if (variant === 'horizontal') {
      setAdContent(mockAds[0]);
    } else {
      setAdContent(mockAds[1]);
    }
  }, [variant]);

  if (!isVisible || !adContent) return null;

  return (
    <div 
      className={`
        ad-banner-container w-full bg-white/90 shadow-md p-2 text-center relative
        ${position === 'top' ? 'border-b border-gray-200' : 'border-t border-gray-200'}
      `}
    >
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-1 right-1 p-1 bg-black/5 hover:bg-black/10 rounded-full text-gray-600"
        aria-label="Cerrar anuncio"
      >
        <X size={16} />
      </button>
      
      <a 
        href={adContent.url} 
        target="_blank" 
        rel="noopener noreferrer sponsored"
        className="inline-block"
      >
        <img 
          src={adContent.imageUrl} 
          alt={adContent.altText}
          className={`
            mx-auto
            ${variant === 'horizontal' ? 'max-w-full h-auto' : 'max-w-[300px] h-auto'}
          `}
        />
      </a>
      
      <p className="text-xs text-gray-500 mt-1">Publicidad</p>
    </div>
  );
};

export default AdBanner; 
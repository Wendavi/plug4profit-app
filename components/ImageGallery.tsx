
import React from 'react';

interface ImageGalleryProps {
    images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Gevonden Afbeeldingen</h2>
            {images && images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((src, index) => (
                        <div key={index} className="aspect-square bg-gray-700 rounded-lg overflow-hidden">
                            <img
                                src={src}
                                alt={`Gevonden afbeelding ${index + 1}`}
                                className="object-cover w-full h-full"
                                onError={(e) => (e.currentTarget.parentElement as HTMLElement).style.display = 'none'}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 mt-4">Geen relevante afbeeldingen gevonden op de pagina.</p>
            )}
        </div>
    );
};

export default ImageGallery;

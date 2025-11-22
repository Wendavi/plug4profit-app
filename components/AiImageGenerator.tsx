
import React, { useState, useEffect } from 'react';
import type { BrandVoice, SavedItem } from '../types';
import * as geminiService from '../services/geminiService';
import { addLogoToImage, addWatermark } from '../utils/canvasUtils';
import { dataURLtoBlob } from '../utils/blobUtils';
import { addItem } from '../services/dbService';
import { RegenerateIcon, SaveIcon, TinySpinner } from './Icons';
import Loader from './Loader';

interface AiImageGeneratorProps {
    textForAI: string;
    sourceUrl: string;
    language: string;
    initialKeywords?: string;
    brandVoice: BrandVoice;
    onContentSaved: () => void;
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const AiImageGenerator: React.FC<AiImageGeneratorProps> = ({ textForAI, sourceUrl, language, initialKeywords, brandVoice, onContentSaved }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [finalImage, setFinalImage] = useState<string | null>(null); // With logo
    const [keywords, setKeywords] = useState(initialKeywords || '');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [imageStyle, setImageStyle] = useState('Photorealistic');
    const [isSaving, setIsSaving] = useState(false);

    const styles = [
        'Photorealistic', 'Illustration', 'Concept Art', 'Watercolor', 
        'Oil Painting', 'Cyberpunk', 'Minimalist', 'Sketch', 'Pop Art', 'Anime'
    ];

    useEffect(() => {
        if (!generatedImage) {
            setFinalImage(null);
            return;
        }

        const applyBranding = async () => {
            let currentImageSrc = `data:image/png;base64,${generatedImage}`;
            try {
                if (brandVoice.logo) {
                    currentImageSrc = await addLogoToImage(currentImageSrc, brandVoice.logo);
                }
                if (brandVoice.watermarkUrl) {
                    currentImageSrc = await addWatermark(currentImageSrc, brandVoice.watermarkUrl);
                }
                setFinalImage(currentImageSrc);
            } catch (err) {
                console.error("Failed to apply branding:", err);
                setFinalImage(`data:image/png;base64,${generatedImage}`); // Fallback to original
            }
        };

        applyBranding();
    }, [generatedImage, brandVoice.logo, brandVoice.watermarkUrl]);


    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const imageBase64 = await geminiService.generateImage(textForAI, keywords, language, aspectRatio, imageStyle);
            setGeneratedImage(imageBase64);
        } catch (e) {
            const err = e as Error;
            setError(err.message || "Kon afbeelding niet genereren.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveImage = async () => {
        if (!finalImage) return;
        setIsSaving(true);
        try {
            const imageBlob = dataURLtoBlob(finalImage);
            const savedItem: SavedItem = {
                type: 'image',
                content: imageBlob,
                sourceUrl,
                timestamp: Date.now(),
                filename: `p4p-image-${Date.now()}.png`,
            };
            await addItem(savedItem);
            onContentSaved();
            alert('Afbeelding opgeslagen in uw bibliotheek!');
        } catch (err) {
            console.error("Failed to save image:", err);
            alert('Kon de afbeelding niet opslaan.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderAspectRatioButton = (ratio: AspectRatio, label: string, width: string, height: string) => (
        <button
            key={ratio}
            onClick={() => setAspectRatio(ratio)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition ${
                aspectRatio === ratio 
                ? 'border-amber-500 bg-amber-500/20 text-white' 
                : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500'
            }`}
            title={label}
        >
            <div className={`border-2 ${aspectRatio === ratio ? 'border-amber-400' : 'border-gray-400'} mb-1`} style={{ width, height }}></div>
            <span className="text-xs font-medium">{ratio}</span>
        </button>
    );

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">🎨 AI Afbeelding Generator</h2>
            <div className="space-y-6">
                <p className="text-gray-400">Genereer een unieke, royalty-vrije afbeelding op basis van de geanalyseerde tekst.</p>
                
                {/* Controls */}
                <div className="space-y-4 bg-gray-700/50 p-4 rounded-xl">
                     {/* Keywords */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Extra Trefwoorden</label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="bv. modern, kantoor, zonsondergang"
                            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Style & Ratio Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Style Selector */}
                        <div>
                             <label className="block text-sm font-medium text-gray-300 mb-2">Beeldstijl</label>
                             <div className="relative">
                                <select
                                    value={imageStyle}
                                    onChange={(e) => setImageStyle(e.target.value)}
                                    className="w-full appearance-none bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition cursor-pointer"
                                    disabled={isLoading}
                                >
                                    {styles.map(style => <option key={style} value={style}>{style}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                            </div>
                        </div>

                         {/* Aspect Ratio Visual Selector */}
                         <div>
                             <label className="block text-sm font-medium text-gray-300 mb-2">Formaat</label>
                             <div className="flex gap-2 justify-start">
                                {renderAspectRatioButton('16:9', 'Landscape', '28px', '16px')}
                                {renderAspectRatioButton('1:1', 'Square', '20px', '20px')}
                                {renderAspectRatioButton('9:16', 'Portrait', '16px', '28px')}
                                {renderAspectRatioButton('4:3', 'Standard', '24px', '18px')}
                                {renderAspectRatioButton('3:4', 'Tall', '18px', '24px')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Output Area */}
                {isLoading ? (
                    <Loader message="Beeld wordt gegenereerd..." />
                ) : finalImage ? (
                    <div className="mt-4 animate-fade-in">
                        <img src={finalImage} alt="AI gegenereerde afbeelding" className="rounded-lg w-full h-auto object-contain bg-black/20" />
                    </div>
                ) : null}
                
                {error && <p className="text-red-400 mt-4 text-center bg-gray-900/50 p-2 rounded">{error}</p>}

                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center disabled:bg-amber-700 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <TinySpinner /> : <RegenerateIcon />}
                        <span>{generatedImage ? 'Opnieuw Genereren' : 'Genereer Afbeelding'}</span>
                    </button>
                    {finalImage && (
                        <button
                            onClick={handleSaveImage}
                            disabled={isSaving || isLoading}
                            className="w-full flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center disabled:bg-teal-700 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <TinySpinner /> : <SaveIcon />}
                            <span>{isSaving ? 'Opslaan...' : 'Opslaan in Bibliotheek'}</span>
                        </button>
                    )}
                </div>
            </div>
             <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AiImageGenerator;

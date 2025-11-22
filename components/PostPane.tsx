import React, { useState, useEffect } from 'react';
import type { SocialPlatform, BrandVoice, SavedItem } from '../types';
import * as geminiService from '../services/geminiService';
import { addItem } from '../services/dbService';
import { dataURLtoBlob } from '../utils/blobUtils';
import { addLogoToImage, addWatermark } from '../utils/canvasUtils';
import { FacebookIcon, LinkedInIcon, TwitterIcon, InstagramIcon, TiktokIcon, PinterestIcon, RegenerateIcon, SaveIcon, TinySpinner, VideoIcon } from './Icons';
import Loader from './Loader';

interface PostPaneProps {
    platform: SocialPlatform;
    initialText: string;
    url: string;
    isActive: boolean;
    language: string;
    brandVoice?: BrandVoice;
    onContentSaved: () => void;
}

const PostPane: React.FC<PostPaneProps> = ({ platform, initialText, url, isActive, language, brandVoice, onContentSaved }) => {
    const [text, setText] = useState(initialText);
    const [isRewriting, setIsRewriting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [finalImage, setFinalImage] = useState<string | null>(null); // With logo
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setText(initialText);
        setGeneratedImage(null); // Reset image when initial text changes
        setFinalImage(null);
        setError(null);
    }, [initialText]);
    
    useEffect(() => {
        if (!generatedImage) {
            setFinalImage(null);
            return;
        }
        const applyBranding = async () => {
            let currentImageSrc = `data:image/png;base64,${generatedImage}`;
            try {
                if (brandVoice?.logo) {
                    currentImageSrc = await addLogoToImage(currentImageSrc, brandVoice.logo);
                }
                if (brandVoice?.watermarkUrl) {
                    currentImageSrc = await addWatermark(currentImageSrc, brandVoice.watermarkUrl);
                }
                setFinalImage(currentImageSrc);
            } catch (err) {
                console.error("Failed to apply branding:", err);
                setFinalImage(`data:image/png;base64,${generatedImage}`); // Fallback
            }
        };
        applyBranding();
    }, [generatedImage, brandVoice?.logo, brandVoice?.watermarkUrl]);

    const handleRewrite = async () => {
        setIsRewriting(true);
        setError(null);
        try {
            const { newPost } = await geminiService.rewritePost(text, platform, language);
            setText(newPost);
        } catch (e) {
            const err = e as Error;
            setError(err.message || 'Kon post niet herschrijven.');
        } finally {
            setIsRewriting(false);
        }
    };
    
    const handleSavePost = async () => {
        setIsSaving(true);
        try {
            const savedItem: SavedItem = {
                type: 'post',
                content: text,
                platform: platform,
                sourceUrl: url,
                timestamp: Date.now(),
            };
            await addItem(savedItem);
            onContentSaved();
            alert('Post opgeslagen in uw bibliotheek!');
        } catch(err) {
             console.error("Failed to save post:", err);
            alert('Kon de post niet opslaan.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateImage = async () => {
        setIsGeneratingImage(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const images = await geminiService.generateImageForPost(text, platform, language, '', 1);
            if (images.length > 0) {
                setGeneratedImage(images[0]);
            }
        } catch (e) {
            const err = e as Error;
            setError(err.message || 'Kon afbeelding niet genereren.');
        } finally {
            setIsGeneratingImage(false);
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
                platform: platform,
                sourceUrl: url,
                timestamp: Date.now(),
                filename: `p4p-image-${platform}-${Date.now()}.png`
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

    const getPlatformIcon = () => {
        switch (platform) {
            case 'twitter': return <TwitterIcon />;
            case 'facebook': return <FacebookIcon />;
            case 'linkedin': return <LinkedInIcon />;
            case 'instagram': return <InstagramIcon />;
            case 'tiktok': return <TiktokIcon />;
            case 'pinterest': return <PinterestIcon />;
            default: return null;
        }
    }

    if (!isActive) return null;

    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    const supportsDirectShare = ['twitter', 'facebook'].includes(platform);

    const getShareUrl = () => {
        const encodedText = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(url);
        switch (platform) {
            case 'twitter': return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
            case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
            default: return '#';
        }
    };

    const handleAdvancedShare = () => {
        // This function handles platforms that don't have a simple share URL intent
        // or where a multi-step process (like copy + download) is better.
        const platformNameProper = platform.charAt(0).toUpperCase() + platform.slice(1);
    
        // Specific logic for visual platforms that require an image
        if (platform === 'pinterest' || platform === 'instagram') {
            if (!finalImage) {
                const shouldGenerate = window.confirm(`Je moet eerst een afbeelding genereren om deze op ${platformNameProper} te kunnen delen. Wil je er nu een genereren?`);
                if (shouldGenerate) {
                    handleGenerateImage();
                }
                return;
            }
    
            // 1. Copy text to clipboard
            navigator.clipboard.writeText(text).then(() => {
                // 2. Download the generated image
                try {
                    const blob = dataURLtoBlob(finalImage);
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `p4p-image-for-${platform}-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href); // Clean up
                } catch (e) {
                    console.error("Image download failed:", e);
                    alert("Kon afbeelding niet downloaden. Probeer het handmatig op te slaan.");
                    return; // Stop if download fails
                }
    
                // 3. Open the platform and alert the user
                let openUrl = '';
                if (platform === 'pinterest') {
                    openUrl = `https://www.pinterest.com/pin-builder/`;
                } else if (platform === 'instagram') {
                    openUrl = 'https://www.instagram.com';
                }
                
                alert(`Afbeelding gedownload & tekst gekopieerd! Upload de afbeelding in het ${platformNameProper} venster dat nu opent en plak de tekst.`);
                window.open(openUrl, '_blank', 'noopener,noreferrer');
    
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Kon de tekst niet kopiëren.');
            });
            
            return; // End of logic for visual platforms
        }
    
        // Existing logic for other platforms (LinkedIn, TikTok)
        navigator.clipboard.writeText(text).then(() => {
            let shareUrl = '';
            let alertMessage = `Tekst gekopieerd! Open nu ${platformNameProper} en plak de tekst in je nieuwe post.`;
    
            switch (platform) {
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                    alertMessage = `Tekst voor je post is gekopieerd! Plak het in het LinkedIn venster dat nu opent.`;
                    break;
                case 'tiktok':
                    shareUrl = 'https://www.tiktok.com/upload';
                    break;
                // No default case needed as we've handled all non-direct-share platforms
            }
    
            alert(alertMessage);
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'noopener,noreferrer');
            }
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Kon de tekst niet kopiëren.');
        });
    };

    return (
        <div className="space-y-4">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg p-4 h-48 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
            />
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleRewrite}
                    disabled={isRewriting}
                    className="flex-1 min-w-[150px] bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center disabled:opacity-50"
                >
                    {isRewriting ? <TinySpinner /> : <RegenerateIcon />}
                    <span>Herschrijf</span>
                </button>
                
                {supportsDirectShare ? (
                    <a
                        href={getShareUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[150px] bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center"
                    >
                        {getPlatformIcon()}
                        <span className="ml-2">{`Deel op ${platformName}`}</span>
                    </a>
                ) : (
                    <button
                        onClick={handleAdvancedShare}
                        className="flex-1 min-w-[150px] bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center"
                    >
                        {getPlatformIcon()}
                        <span className="ml-2">{`Deel op ${platformName}`}</span>
                    </button>
                )}

                <button
                    onClick={handleSavePost}
                    disabled={isSaving}
                    className="flex-1 min-w-[150px] bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center disabled:opacity-50"
                >
                    {isSaving ? <TinySpinner /> : <SaveIcon />}
                    <span>Sla Post Op</span>
                </button>
            </div>
            {error && <p className="text-red-400 mt-2 text-center">{error}</p>}
            
            <div className="pt-4 mt-4 border-t border-gray-700">
                <h3 className="text-lg font-bold mb-2">Beeldmateriaal voor deze Post</h3>
                {isGeneratingImage ? (
                    <Loader message="Beeld wordt gegenereerd..." />
                ) : finalImage ? (
                    <div className="space-y-3">
                        <img src={finalImage} alt={`AI gegenereerde afbeelding voor ${platform}`} className="rounded-lg w-full max-w-md mx-auto" />
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center disabled:opacity-50">
                                {isGeneratingImage ? <TinySpinner/> : <RegenerateIcon />}
                                <span>Nieuwe Afbeelding</span>
                            </button>
                             <button onClick={handleSaveImage} disabled={isSaving} className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center disabled:opacity-50">
                                {isSaving ? <TinySpinner /> : <SaveIcon />}
                                <span>Sla Afbeelding Op</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center disabled:opacity-50">
                        {isGeneratingImage ? <TinySpinner /> : <VideoIcon className="mr-2" />}
                        <span>Genereer een Afbeelding voor deze Post</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default PostPane;
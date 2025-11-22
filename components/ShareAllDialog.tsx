import React, { useEffect, useState } from 'react';
import type { SocialPosts, SocialPlatform } from '../types';
import { FacebookIcon, LinkedInIcon, TwitterIcon, InstagramIcon, TiktokIcon, PinterestIcon } from './Icons';

interface ShareAllDialogProps {
    isOpen: boolean;
    onClose: () => void;
    posts: SocialPosts;
    url: string;
}

const ShareAllDialog: React.FC<ShareAllDialogProps> = ({ isOpen, onClose, posts, url }) => {
    const [copiedPlatform, setCopiedPlatform] = useState<SocialPlatform | null>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
            setCopiedPlatform(null); // Reset on close
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const platformOrder: SocialPlatform[] = ['twitter', 'facebook', 'linkedin', 'instagram', 'tiktok', 'pinterest'];

    const getShareComponent = (platform: SocialPlatform, postText: string) => {
        const isCopied = copiedPlatform === platform;

        const handleCopy = () => {
             navigator.clipboard.writeText(postText);
             setCopiedPlatform(platform);
             setTimeout(() => setCopiedPlatform(null), 2000);
        };
    
        const handleShareClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (platform === 'linkedin') {
                handleCopy();
            }
        };
    
        const handleSpecialShare = () => {
            handleCopy();
            if (platform === 'instagram') {
                window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
            } else if (platform === 'tiktok') {
                window.open('https://www.tiktok.com/upload', '_blank', 'noopener,noreferrer');
            } else if (platform === 'pinterest') {
                window.open('https://www.pinterest.com/pin-builder/', '_blank', 'noopener,noreferrer');
            }
        };
    
        const getShareUrl = () => {
            const encodedText = encodeURIComponent(postText);
            const encodedUrl = encodeURIComponent(url);
            switch (platform) {
                case 'twitter': return `https://twitter.com/intent/tweet?text=${encodedText}`;
                case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
                case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                default: return '#';
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

        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

        if (platform !== 'instagram' && platform !== 'tiktok' && platform !== 'pinterest') {
            return (
                <a
                    href={getShareUrl()}
                    onClick={handleShareClick}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center w-full sm:w-auto"
                >
                    {getPlatformIcon()}
                    <span className="ml-2">{isCopied ? 'Tekst Gekopieerd!' : `Deel op ${platformName}`}</span>
                </a>
            )
        } else {
             return (
                 <button
                    onClick={handleSpecialShare}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center w-full sm:w-auto"
                >
                    {getPlatformIcon()}
                    <span className="ml-2">{isCopied ? 'Tekst Gekopieerd!' : `Kopieer & Open ${platformName}`}</span>
                </button>
            )
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
            aria-modal="true" 
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">Deel Alle Posts</h3>
                    <button onClick={onClose} aria-label="Sluit dialoog" className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {platformOrder.map(platform => {
                        const postKey = `${platform}Post` as keyof SocialPosts;
                        const postText = posts[postKey];
                        if (!postText) return null;
                        
                        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

                        return (
                            <div key={platform} className="bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-bold text-lg text-amber-300 mb-2">{platformName}</h4>
                                <p className="whitespace-pre-wrap text-gray-200 mb-4">{postText}</p>
                                <div className="flex justify-end">
                                    {getShareComponent(platform, postText)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ShareAllDialog;
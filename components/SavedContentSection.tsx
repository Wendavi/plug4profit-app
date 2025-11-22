
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { getAllSavedItems, deleteSavedItem } from '../services/dbService';
import type { SavedItem, SocialPlatform } from '../types';
import { TrashIcon, TwitterIcon, FacebookIcon, LinkedInIcon, InstagramIcon, TiktokIcon, PinterestIcon, PodcastIcon } from './Icons';
import Loader from './Loader';

const ConfirmationDialog = lazy(() => import('./ConfirmationDialog'));

interface SavedContentSectionProps {
    itemCount: number;
    onContentDeleted: () => void;
}

type FilterType = 'all' | 'post' | 'image' | 'video' | 'audio';

const SavedContentSection: React.FC<SavedContentSectionProps> = ({ itemCount, onContentDeleted }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<SavedItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // Memoize object URLs to avoid re-creating them on every render
    const mediaUrls = useMemo(() => {
        const urlMap = new Map<number, string>();
        items.forEach(item => {
            if (item.id && (item.type === 'image' || item.type === 'video' || item.type === 'audio') && item.content instanceof Blob) {
                urlMap.set(item.id, URL.createObjectURL(item.content));
            }
        });
        return urlMap;
    }, [items]);

    useEffect(() => {
        // Cleanup object URLs when the component unmounts or items change
        return () => {
            mediaUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [mediaUrls]);

    const loadItems = async () => {
        setIsLoading(true);
        try {
            const savedItems = await getAllSavedItems();
            setItems(savedItems);
        } catch (error) {
            console.error("Failed to load saved items:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadItems();
        }
    }, [isOpen]);

    const handleDeleteRequest = (id: number) => {
        setItemToDelete(id);
    };

    const handleConfirmDelete = async () => {
        if (itemToDelete !== null) {
            try {
                await deleteSavedItem(itemToDelete);
                setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete));
                onContentDeleted();
            } catch (error) {
                console.error("Failed to delete item:", error);
                alert("Kon het item niet verwijderen.");
            } finally {
                setItemToDelete(null);
            }
        }
    };

    const handleCancelDelete = () => {
        setItemToDelete(null);
    };
    
    const handleDownload = (item: SavedItem) => {
        const link = document.createElement('a');
        let url: string;

        if (item.content instanceof Blob) {
            url = URL.createObjectURL(item.content);
            link.download = item.filename || `p4p-saved-item-${item.id}.${item.type === 'audio' ? 'wav' : item.type === 'video' ? 'mp4' : 'png'}`;
        } else { // It's a post (string)
            const blob = new Blob([item.content], { type: 'text/plain' });
            url = URL.createObjectURL(blob);
            link.download = `p4p-post-${item.platform}-${item.id}.txt`;
        }
        
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredItems = items.filter(item => filter === 'all' || item.type === filter);

    const getPlatformIcon = (platform?: SocialPlatform) => {
        switch (platform) {
            case 'twitter': return <TwitterIcon />;
            case 'facebook': return <FacebookIcon />;
            case 'linkedin': return <LinkedInIcon />;
            case 'instagram': return <InstagramIcon />;
            case 'tiktok': return <TiktokIcon />;
            case 'pinterest': return <PinterestIcon />;
            default: return null;
        }
    };
    
    const filters: { id: FilterType, label: string }[] = [
        { id: 'all', label: 'Alles' },
        { id: 'post', label: 'Posts' },
        { id: 'image', label: 'Afbeeldingen' },
        { id: 'video', label: 'Video\'s' },
        { id: 'audio', label: 'Audio' },
    ];

    return (
        <>
        <div className="bg-gray-800 rounded-xl shadow-lg mb-8 transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex justify-between items-center text-left"
                aria-expanded={isOpen}
            >
                <div className="flex items-center">
                    <h2 className="text-xl font-bold">📚 Mijn Bibliotheek</h2>
                    <span className="ml-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">{itemCount}</span>
                </div>
                <svg
                    className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                <div className="p-6 pt-2">
                    <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                            {filters.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${filter === f.id ? 'bg-amber-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? <Loader message="Bibliotheek laden..." /> : (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {filteredItems.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">Uw bibliotheek is leeg. Sla content op om hier te bekijken.</p>
                            ) : (
                                filteredItems.map(item => (
                                    <div key={item.id} className="bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row gap-4">
                                        <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-gray-600 rounded-md flex items-center justify-center overflow-hidden relative">
                                            {item.type === 'image' && <img src={mediaUrls.get(item.id!)} className="w-full h-full object-cover" alt="Opgeslagen afbeelding" />}
                                            {item.type === 'video' && <video src={mediaUrls.get(item.id!)} className="w-full h-full object-cover" controls muted loop />}
                                            {item.type === 'post' && <div className="text-5xl">{getPlatformIcon(item.platform)}</div>}
                                            {item.type === 'audio' && (
                                                <div className="flex flex-col items-center justify-center w-full h-full bg-gray-800">
                                                    <PodcastIcon className="w-10 h-10 text-green-400 mb-2" />
                                                    <span className="text-xs text-gray-400">Audio</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold capitalize text-amber-300">{item.type} {item.platform ? `- ${item.platform}` : ''}</p>
                                                    <p className="text-xs text-gray-400">Opgeslagen: {new Date(item.timestamp).toLocaleString('nl-NL')}</p>
                                                    <p className="text-xs text-gray-400 truncate">Bron: {item.sourceUrl}</p>
                                                </div>
                                                 <button onClick={() => handleDeleteRequest(item.id!)} className="text-gray-400 hover:text-red-500 transition" aria-label="Verwijder item">
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                            {item.type === 'post' && <p className="mt-2 text-gray-200 text-sm whitespace-pre-wrap max-h-24 overflow-y-auto">{item.content as string}</p>}
                                            {item.type === 'audio' && (
                                                <div className="mt-2">
                                                    <audio controls src={mediaUrls.get(item.id!)} className="w-full h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 flex sm:flex-col justify-end gap-2">
                                            <button onClick={() => handleDownload(item)} className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition">Download</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
        <Suspense fallback={null}>
            <ConfirmationDialog
                isOpen={itemToDelete !== null}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Verwijdering Bevestigen"
                message="Weet u zeker dat u dit item uit uw bibliotheek wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
            />
        </Suspense>
        </>
    );
};

export default SavedContentSection;

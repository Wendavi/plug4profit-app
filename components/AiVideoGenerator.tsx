import React, { useState } from 'react';
import { generateVideo } from '../services/geminiService';
import type { BrandVoice, SavedItem } from '../types';
import { addItem } from '../services/dbService';
import { SaveIcon, TinySpinner, VideoIcon } from './Icons';

interface AiVideoGeneratorProps {
    textForAI: string;
    initialKeywords?: string;
    sourceUrl: string;
    language: string;
    brandVoice: BrandVoice;
    onContentSaved: () => void;
    onApiKeyError: () => void;
}

const AiVideoGenerator: React.FC<AiVideoGeneratorProps> = ({ textForAI, initialKeywords, sourceUrl, language, onContentSaved, onApiKeyError }) => {
    const [keywords, setKeywords] = useState(initialKeywords || '');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setProgressMessage('Starting video generation...');
        try {
            const url = await generateVideo(textForAI, keywords, language, aspectRatio, (message) => {
                setProgressMessage(message);
            });
            setVideoUrl(url);
        } catch (e) {
            const err = e as Error;
            if (err.message && err.message.includes("Requested entity was not found")) {
                setError("API sleutel is ongeldig of heeft geen toegang. Selecteer een andere sleutel.");
                onApiKeyError();
            } else {
                setError(err.message || 'Kon de video niet genereren.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    };

    const handleSaveVideo = async () => {
        if (!videoUrl) return;
        setIsSaving(true);
        try {
            // Fetch the blob from the object URL
            const response = await fetch(videoUrl);
            const videoBlob = await response.blob();
            
            const savedItem: SavedItem = {
                type: 'video',
                content: videoBlob,
                sourceUrl,
                timestamp: Date.now(),
                filename: `p4p-video-${Date.now()}.mp4`,
            };
            await addItem(savedItem);
            onContentSaved();
            alert('Video opgeslagen in uw bibliotheek!');
        } catch (err) {
            console.error("Failed to save video:", err);
            alert('Kon de video niet opslaan.');
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-500/30">
            <h2 className="text-2xl font-bold mb-2">🎬 AI Video Generator</h2>
             <p className="text-gray-400 mb-4">
                Transformeer uw content in een korte, dynamische video. Ideaal voor social media platforms zoals TikTok, Instagram Reels, of YouTube Shorts.
            </p>
            <div className="space-y-4">
                 <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="Voeg extra focus trefwoorden toe"
                        className="flex-grow w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                        disabled={isLoading}
                    />
                    <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
                        className="w-full sm:w-auto appearance-none bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                        disabled={isLoading}
                    >
                        <option value="16:9">Landscape (16:9)</option>
                        <option value="9:16">Portrait (9:16)</option>
                    </select>
                </div>
                
                {!isLoading && !videoUrl && (
                    <button
                        onClick={handleGenerate}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center"
                    >
                        <VideoIcon className="mr-2" />
                        <span>Genereer Video</span>
                    </button>
                )}

                {isLoading && (
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                        <div className="flex justify-center"><TinySpinner /></div>
                        <p className="text-amber-300 font-semibold mt-2">{progressMessage}</p>
                        <p className="text-sm text-gray-400 mt-1">Dit proces kan enkele minuten duren. Blijf op deze pagina.</p>
                    </div>
                )}

                {error && <p className="text-red-400 text-center p-4">{error}</p>}

                {videoUrl && !isLoading && (
                     <div className="space-y-4">
                        <video src={videoUrl} controls autoPlay loop muted className="w-full rounded-lg" />
                        <div className="flex flex-col sm:flex-row gap-4">
                             <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center"
                            >
                                <VideoIcon className="mr-2" />
                                <span>Genereer Nieuwe Video</span>
                            </button>
                            <button
                                onClick={handleSaveVideo}
                                disabled={isSaving}
                                className="w-full flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center"
                            >
                                {isSaving ? <TinySpinner /> : <SaveIcon />}
                                <span>{isSaving ? 'Opslaan...' : 'Opslaan in Bibliotheek'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiVideoGenerator;
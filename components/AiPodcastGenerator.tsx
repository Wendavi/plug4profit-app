
import React, { useState, useRef } from 'react';
import { generatePodcastAudio } from '../services/geminiService';
import { addItem } from '../services/dbService';
import type { SavedItem } from '../types';
import { PodcastIcon, TinySpinner, SaveIcon } from './Icons';

interface AiPodcastGeneratorProps {
    textForAI: string;
    language: string;
    sourceUrl: string;
    onContentSaved: () => void;
}

const AiPodcastGenerator: React.FC<AiPodcastGeneratorProps> = ({ textForAI, language, sourceUrl, onContentSaved }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
            setAudioBlob(null);
        }

        try {
            const wavBlob = await generatePodcastAudio(textForAI, language);
            const url = URL.createObjectURL(wavBlob);
            setAudioBlob(wavBlob);
            setAudioUrl(url);
        } catch (e) {
            setError("Kon audio niet genereren. Probeer het later opnieuw.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!audioBlob) return;
        setIsSaving(true);
        try {
            const savedItem: SavedItem = {
                type: 'audio',
                content: audioBlob,
                sourceUrl,
                timestamp: Date.now(),
                filename: `p4p-podcast-${Date.now()}.wav`,
            };
            await addItem(savedItem);
            onContentSaved();
            alert('Audio opgeslagen in uw bibliotheek!');
        } catch (err) {
            console.error("Failed to save audio:", err);
            alert('Kon de audio niet opslaan.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-green-500/30">
            <h2 className="text-2xl font-bold mb-2 flex items-center">
                <PodcastIcon className="mr-2 text-green-400" />
                AI Podcast Producer
            </h2>
            <p className="text-gray-400 mb-6">
                Genereer een professionele audio-introductie of samenvatting van dit artikel, klaar om te gebruiken in uw podcast.
            </p>

            {!audioUrl && !isLoading && (
                <button
                    onClick={handleGenerate}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition flex items-center justify-center shadow-lg shadow-green-900/20"
                >
                    <PodcastIcon className="mr-3" />
                    Genereer Podcast Intro
                </button>
            )}

            {isLoading && (
                <div className="text-center py-8 bg-gray-700/50 rounded-lg animate-pulse">
                    <TinySpinner />
                    <p className="mt-3 text-green-300 font-medium">Script schrijven en stem opnemen...</p>
                </div>
            )}

            {error && <p className="text-red-400 mt-4 text-center bg-gray-900/50 p-3 rounded">{error}</p>}

            {audioUrl && !isLoading && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <audio ref={audioRef} controls src={audioUrl} className="w-full" />
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={handleGenerate}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition"
                        >
                            Opnieuw
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center disabled:opacity-50"
                        >
                            {isSaving ? <TinySpinner /> : <SaveIcon />}
                            <span className="ml-2">Opslaan</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiPodcastGenerator;

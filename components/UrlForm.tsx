
import React, { useState } from 'react';
import { AnalyzeIcon, SpinnerIcon } from './Icons';

interface UrlFormProps {
    onAnalyze: (url: string, keywords: string) => void;
    isLoading: boolean;
}

const UrlForm: React.FC<UrlFormProps> = ({ onAnalyze, isLoading }) => {
    const [url, setUrl] = useState('');
    const [keywords, setKeywords] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);
        
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                throw new Error('Protocol not supported');
            }
            onAnalyze(url, keywords);
        } catch (_) {
            setValidationError('Voer een geldige URL in (bijv. https://voorbeeld.nl).');
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            if(validationError) setValidationError(null);
                        }}
                        placeholder="https://example.com/article"
                        required
                        className={`w-full bg-gray-700 text-white placeholder-gray-400 border rounded-lg p-3 focus:ring-2 focus:outline-none transition ${validationError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-amber-500'}`}
                        disabled={isLoading}
                        aria-label="Website URL"
                    />
                    {validationError && (
                        <p className="text-red-400 text-sm mt-1 absolute -bottom-6 left-1">{validationError}</p>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                     <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="Focus trefwoorden (optioneel)"
                        className="flex-grow w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                        disabled={isLoading}
                        aria-label="Focus Keywords"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !url}
                        className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center disabled:bg-amber-700 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                    >
                        {isLoading ? <SpinnerIcon /> : <AnalyzeIcon />}
                        <span>{isLoading ? 'Bezig met analyseren...' : 'Analyseer Website'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UrlForm;


import React, { useState } from 'react';
import { generateCompetitorAnalysis } from '../services/geminiService';
import { SearchGlobeIcon, TinySpinner } from './Icons';

interface AiCompetitorAnalysisProps {
    initialKeywords: string;
    language: string;
}

const AiCompetitorAnalysis: React.FC<AiCompetitorAnalysisProps> = ({ initialKeywords, language }) => {
    const [query, setQuery] = useState(initialKeywords);
    const [result, setResult] = useState<{ text: string, sources: { title: string, uri: string }[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!query) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await generateCompetitorAnalysis(query, language);
            setResult(data);
        } catch (e) {
            setError("Kon marktanalyse niet uitvoeren. Probeer het later opnieuw.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-blue-500/30">
            <h2 className="text-2xl font-bold mb-2 flex items-center">
                <SearchGlobeIcon className="mr-2 text-blue-400" />
                Marktonderzoek & Concurrentie
            </h2>
            <p className="text-gray-400 mb-4">
                Gebruik Google Search Grounding om realtime informatie over concurrenten en markttrends te vinden.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Onderwerp of niche..."
                    className="flex-grow bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !query}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center disabled:opacity-50"
                >
                    {isLoading ? <TinySpinner /> : '🔍'} Analyseer
                </button>
            </div>

            {error && <p className="text-red-400 p-4 bg-gray-900/50 rounded-lg">{error}</p>}

            {result && (
                <div className="space-y-6 animate-fade-in">
                    <div className="prose prose-invert max-w-none bg-gray-900/50 p-6 rounded-lg">
                        <div dangerouslySetInnerHTML={{ 
                            __html: result.text
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-300">$1</strong>')
                                .replace(/\n/g, '<br />')
                                .replace(/- /g, '• ')
                        }} />
                    </div>

                    {result.sources.length > 0 && (
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h4 className="font-bold text-sm text-gray-300 mb-2 uppercase tracking-wide">Bronnen</h4>
                            <ul className="space-y-2">
                                {result.sources.map((source, idx) => (
                                    <li key={idx}>
                                        <a 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 hover:underline text-sm flex items-center truncate"
                                        >
                                            <span className="mr-2">🔗</span>
                                            {source.title || source.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
             <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AiCompetitorAnalysis;

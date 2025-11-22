import React, { useState, useCallback, Suspense, lazy, useEffect } from 'react';
import type { AnalysisResult, HistoryItem, BrandVoice } from './types';
import { scrapeAndParseUrl } from './services/websiteScraper';
import { generateSocialPosts, detectLanguage } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getSavedItemCount } from './services/dbService';
import UrlForm from './components/UrlForm';
import ResultsSkeleton from './components/ResultsSkeleton';

const BrandVoiceForm = lazy(() => import('./components/BrandVoiceForm'));
const HistorySection = lazy(() => import('./components/HistorySection'));
const SavedContentSection = lazy(() => import('./components/SavedContentSection'));
const ResultsSection = lazy(() => import('./components/ResultsSection'));
const ErrorMessage = lazy(() => import('./components/ErrorMessage'));
const ApiKeySelector = lazy(() => import('./components/ApiKeySelector'));


const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [history, setHistory] = useLocalStorage<HistoryItem[]>('aiPostHistory', []);
    const [brandVoice, setBrandVoice] = useLocalStorage<BrandVoice>('aiBrandVoice', {
        tone: 'default',
        style: '',
        keyPhrases: '',
        audience: '',
        watermarkUrl: 'plug4profit.online',
    });
    const [savedItemCount, setSavedItemCount] = useState(0);
    const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchCount = async () => {
            const count = await getSavedItemCount();
            setSavedItemCount(count);
        };
        fetchCount();
    }, []);
    
    useEffect(() => {
        const checkApiKey = async () => {
            if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                setIsKeySelected(hasKey);
            } else {
                // Fallback for environments without aistudio, allows app to run for non-video features.
                setIsKeySelected(true);
            }
        };
        checkApiKey();
    }, []);

    const handleKeySelected = () => {
        setIsKeySelected(true);
    };

    const resetKeySelection = () => {
        setIsKeySelected(false);
    };

    const handleContentSaved = useCallback(() => {
        setSavedItemCount(count => count + 1);
    }, []);

    const handleContentDeleted = useCallback(() => {
        setSavedItemCount(count => count - 1);
    }, []);


    const handleAnalyze = async (url: string, keywords: string) => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        window.scrollTo({ top: 300, behavior: 'smooth' });

        try {
            const { textForAI, images } = await scrapeAndParseUrl(url);
            if (!textForAI) throw new Error("Could not find relevant text on the page to analyze.");

            const language = await detectLanguage(textForAI);
            const posts = await generateSocialPosts(textForAI, url, keywords, brandVoice, language);
            const newResult: AnalysisResult = { textForAI, images, posts, url, keywords, brandVoice, language };
            
            setAnalysisResult(newResult);

            const newHistoryItem: HistoryItem = { id: Date.now(), ...newResult };
            setHistory([newHistoryItem, ...history].slice(0, 20));

        } catch (e) {
            const err = e as Error;
            console.error('Analysis failed:', err);
            setError(err.message || 'An unknown error occurred. Please try another URL.');
            setAnalysisResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewHistory = useCallback((item: HistoryItem) => {
        setError(null);
        setIsLoading(false);
        setAnalysisResult({
            textForAI: item.textForAI,
            images: item.images,
            posts: item.posts,
            url: item.url,
            keywords: item.keywords,
            brandVoice: item.brandVoice,
            language: item.language,
        });
        if(item.brandVoice){
            setBrandVoice(item.brandVoice);
        }
        setTimeout(() => {
            const resultsElement = document.getElementById('results-section');
            resultsElement?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, [setBrandVoice]);

    const handleDeleteHistory = useCallback((id: number) => {
        setHistory(history.filter(item => item.id !== id));
    }, [history, setHistory]);
    
    if (isKeySelected === null) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loader border-solid border-gray-600 border-t-amber-500 rounded-full animate-spin w-16 h-16 border-4"></div>
            </div>
        );
    }
    
    if (!isKeySelected) {
        return (
            <Suspense fallback={<div>Loading...</div>}>
                <ApiKeySelector onKeySelected={handleKeySelected} />
            </Suspense>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
            <div className="w-full max-w-4xl mx-auto">
                <header className="text-center mb-6 flex flex-col items-center">
                    <a href="/" aria-label="Plug 4 Profit Home">
                        <img 
                            src="/logo.png" 
                            alt="Plug 4 Profit logo: a stylized golden power outlet with a lightning bolt inside and two leaves growing at the base" 
                            className="w-56 sm:w-64 md:w-80 h-auto mb-4 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                            fetchPriority="high"
                        />
                    </a>
                    <p className="text-lg text-gray-400">Analyseer een webpagina en genereer direct social media content.</p>
                </header>

                <UrlForm onAnalyze={handleAnalyze} isLoading={isLoading} />
                
                <Suspense fallback={<div className="bg-gray-800 rounded-xl shadow-lg mb-8 h-16 animate-pulse"></div>}>
                    <BrandVoiceForm 
                        brandVoice={brandVoice} 
                        onUpdate={setBrandVoice} 
                        disabled={isLoading} 
                    />
                </Suspense>

                 <Suspense fallback={<div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 h-40 animate-pulse"></div>}>
                    <SavedContentSection
                        itemCount={savedItemCount}
                        onContentDeleted={handleContentDeleted}
                    />
                </Suspense>

                <Suspense fallback={<div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 h-40 animate-pulse"></div>}>
                    <HistorySection
                        history={history}
                        onView={handleViewHistory}
                        onDelete={handleDeleteHistory}
                    />
                </Suspense>

                <div id="results-section" className="min-h-[100px]">
                    {isLoading && <ResultsSkeleton />}
                    {error && (
                        <Suspense fallback={null}>
                            <ErrorMessage message={error} />
                        </Suspense>
                    )}
                    {analysisResult && !isLoading && (
                        <Suspense fallback={<ResultsSkeleton />}>
                            <ResultsSection 
                                result={analysisResult} 
                                brandVoice={brandVoice} 
                                onContentSaved={handleContentSaved}
                                onApiKeyError={resetKeySelection}
                             />
                        </Suspense>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
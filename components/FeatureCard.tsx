import React, { useState } from 'react';
import { TinySpinner } from './Icons';

interface FeatureCardProps<T> {
    title: string;
    description: string;
    buttonText: string;
    buttonClass: string;
    generationFn: () => Promise<T>;
    renderContent: (data: T) => React.ReactNode;
}

const FeatureCard = <T,>({ title, description, buttonText, buttonClass, generationFn, renderContent }: FeatureCardProps<T>) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState<T | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setContent(null);
        try {
            const data = await generationFn();
            setContent(data);
        } catch (e) {
            const err = e as Error;
            setError(err.message || 'Kon de content niet genereren. Probeer het opnieuw.');
            console.error(`Failed to generate for ${title}:`, err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <div className="space-y-4 min-h-[8rem] flex flex-col justify-between">
                <div>
                    {isLoading ? (
                        <div className="space-y-2 py-4 animate-pulse">
                            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        </div>
                    ) : error ? (
                        <p className="text-red-400">{error}</p>
                    ) : content ? (
                        renderContent(content)
                    ) : (
                        <p className="text-gray-400">{description}</p>
                    )}
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className={`mt-4 w-full text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${buttonClass}`}
                >
                    {isLoading ? <TinySpinner /> : '✨'} {buttonText}
                </button>
            </div>
        </div>
    );
};

export default FeatureCard;

import React from 'react';

interface ErrorMessageProps {
    message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    // Check if the message contains a suggested solution (formatted as "**Oplossing:** ...")
    const parts = message.split('**Oplossing:**');
    const mainError = parts[0];
    const solution = parts.length > 1 ? parts[1] : null;

    return (
        <div className="bg-red-900/30 border border-red-500/50 text-red-100 p-4 rounded-xl shadow-lg my-6 flex items-start animate-fade-in">
            <div className="flex-shrink-0 mr-4 mt-1">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-red-200 mb-1">Er is iets misgegaan</h3>
                <p className="text-sm opacity-90">{mainError}</p>
                
                {solution && (
                    <div className="mt-3 bg-red-900/40 p-3 rounded-lg border border-red-500/20">
                        <div className="flex items-center mb-1">
                            <svg className="h-4 w-4 text-amber-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">Suggestie</span>
                        </div>
                        <p className="text-sm text-gray-200 italic">"{solution.trim()}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ErrorMessage;

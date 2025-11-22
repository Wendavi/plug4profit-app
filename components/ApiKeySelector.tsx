import React from 'react';

interface ApiKeySelectorProps {
    onKeySelected: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
    
    const handleSelectKey = async () => {
        try {
            // The `window.aistudio.openSelectKey` is provided by the execution environment.
            await (window as any).aistudio.openSelectKey();
            // Assume selection is successful and notify the parent component to re-render.
            onKeySelected();
        } catch (e) {
            console.error("Could not open API key selector:", e);
            alert("Could not open the API key selector. Please ensure you are in a supported environment.");
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-lg">
                <h1 className="text-2xl font-bold text-amber-400 mb-4">API Sleutel Vereist voor Videogeneratie</h1>
                <p className="text-gray-300 mb-6">
                    Om de AI-videogenerator (Veo) te gebruiken, is een API-sleutel met de juiste rechten en facturering vereist. Selecteer een geschikte sleutel om door te gaan.
                </p>
                <button
                    onClick={handleSelectKey}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg shadow-amber-500/20"
                >
                    Selecteer API Sleutel
                </button>
                 <p className="text-xs text-gray-500 mt-4">
                    Door verder te gaan, gaat u akkoord met de kosten die aan het gebruik van de API zijn verbonden.
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-400 ml-1">
                        Meer informatie over facturering.
                    </a>
                </p>
            </div>
        </div>
    );
};

export default ApiKeySelector;

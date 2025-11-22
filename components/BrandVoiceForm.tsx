import React, { useState, useRef } from 'react';
import type { BrandVoice, Tone } from '../types';

interface BrandVoiceFormProps {
    brandVoice: BrandVoice;
    onUpdate: (newBrandVoice: BrandVoice) => void;
    disabled: boolean;
}

const BrandVoiceForm: React.FC<BrandVoiceFormProps> = ({ brandVoice, onUpdate, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        onUpdate({
            ...brandVoice,
            [e.target.name]: e.target.value
        });
    };
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Ongeldig bestandstype. Selecteer a.u.b. een PNG, JPG of WEBP afbeelding.');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            onUpdate({
                ...brandVoice,
                logo: event.target?.result as string,
            });
            // Reset the file input to allow re-uploading the same file after a successful upload.
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.readAsDataURL(file);
    };

    const removeLogo = () => {
        const newBrandVoice = { ...brandVoice };
        delete newBrandVoice.logo;
        onUpdate(newBrandVoice);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg mb-8 transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex justify-between items-center text-left"
                aria-expanded={isOpen}
            >
                <h2 className="text-xl font-bold">🗣️ Brand Voice Instellingen</h2>
                <svg
                    className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                <div className="p-6 pt-2 space-y-5">
                     <p className="text-sm text-gray-400">Definieer hier een consistente stem voor de AI. Deze instellingen worden onthouden voor toekomstig gebruik.</p>
                    {/* Tone */}
                    <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-1">Toon</label>
                        <p className="text-xs text-gray-400 mb-2">Kies de algemene sfeer van de tekst. Dit beïnvloedt de woordkeuze en de emotionele lading.</p>
                        <select
                            id="tone"
                            name="tone"
                            value={brandVoice.tone}
                            onChange={handleChange}
                            className="w-full appearance-none bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                            disabled={disabled}
                        >
                            <option value="default">Neutraal</option>
                            <option value="professioneel">Professioneel</option>
                            <option value="enthousiast">Enthousiast</option>
                            <option value="geestig">Geestig</option>
                            <option value="informeel">Informeel</option>
                            <option value="overtuigend">Overtuigend</option>
                        </select>
                    </div>
                    {/* Style */}
                    <div>
                        <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-1">Schrijfstijl</label>
                        <p className="text-xs text-gray-400 mb-2">Beschrijf hoe de AI moet schrijven. Gebruik termen als "kort en bondig", "verhalend", of "technisch".</p>
                        <input
                            id="style"
                            name="style"
                            type="text"
                            value={brandVoice.style}
                            onChange={handleChange}
                            placeholder="bv. Kort en krachtig, verhalend, technisch"
                            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                            disabled={disabled}
                        />
                    </div>
                    {/* Key Phrases */}
                    <div>
                        <label htmlFor="keyPhrases" className="block text-sm font-medium text-gray-300 mb-1">Belangrijke zinnen/woorden</label>
                        <p className="text-xs text-gray-400 mb-2">Voer specifieke termen, slogans of productnamen in die de AI moet gebruiken. Scheid met komma's.</p>
                        <textarea
                            id="keyPhrases"
                            name="keyPhrases"
                            value={brandVoice.keyPhrases}
                            onChange={handleChange}
                            placeholder="bv. 'duurzame innovatie', 'klant centraal'"
                            rows={2}
                            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                            disabled={disabled}
                        />
                    </div>
                    {/* Audience */}
                     <div>
                        <label htmlFor="audience" className="block text-sm font-medium text-gray-300 mb-1">Doelgroep</label>
                        <p className="text-xs text-gray-400 mb-2">Beschrijf voor wie je schrijft. Dit helpt de AI de toon en complexiteit aan te passen.</p>
                        <input
                            id="audience"
                            name="audience"
                            type="text"
                            value={brandVoice.audience}
                            onChange={handleChange}
                            placeholder="bv. Jonge professionals, tech-enthousiastelingen"
                            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                            disabled={disabled}
                        />
                    </div>
                    {/* Logo */}
                    <div>
                        <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-300 mb-1">Logo</label>
                        <p className="text-xs text-gray-400 mb-2">Upload uw logo. Het wordt automatisch toegevoegd aan de gegenereerde afbeeldingen.</p>
                        <div className="flex items-center gap-4">
                            <input
                                ref={fileInputRef}
                                id="logo-upload"
                                name="logo"
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleLogoUpload}
                                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-gray-200 hover:file:bg-gray-500 cursor-pointer"
                                disabled={disabled}
                            />
                            {brandVoice.logo && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <img src={brandVoice.logo} alt="Logo Preview" className="h-10 w-10 object-contain bg-white rounded p-1" />
                                    <button onClick={removeLogo} className="text-red-400 hover:text-red-300 text-2xl font-bold" title="Verwijder logo">&times;</button>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Watermark URL */}
                    <div>
                        <label htmlFor="watermarkUrl" className="block text-sm font-medium text-gray-300 mb-1">Watermerk URL (optioneel)</label>
                        <p className="text-xs text-gray-400 mb-2">Voer een URL in om als watermerk op gegenereerde afbeeldingen te plaatsen. Wordt linksonder geplaatst.</p>
                        <input
                            id="watermarkUrl"
                            name="watermarkUrl"
                            type="url"
                            value={brandVoice.watermarkUrl || ''}
                            onChange={handleChange}
                            placeholder="bv. https://jouwwebsite.nl"
                            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                            disabled={disabled}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandVoiceForm;

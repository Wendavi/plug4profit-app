import React, { useState, Suspense, lazy } from 'react';
import type { HistoryItem } from '../types';

const ConfirmationDialog = lazy(() => import('./ConfirmationDialog'));

interface HistorySectionProps {
    history: HistoryItem[];
    onView: (item: HistoryItem) => void;
    onDelete: (id: number) => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({ history, onView, onDelete }) => {
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const handleDeleteRequest = (id: number) => {
        setItemToDelete(id);
    };

    const handleConfirmDelete = () => {
        if (itemToDelete !== null) {
            onDelete(itemToDelete);
            setItemToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setItemToDelete(null);
    };

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-2xl font-bold mb-4">💾 Analyse Geschiedenis</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {history.length === 0 ? (
                        <p className="text-gray-400">Nog geen geschiedenis. Analyseer een website om te beginnen.</p>
                    ) : (
                        history.map(item => (
                            <div key={item.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                <div className="truncate">
                                    <p className="font-semibold text-white truncate">{item.url}</p>
                                    <p className="text-xs text-gray-400">{new Date(item.id).toLocaleString('nl-NL')}</p>
                                </div>
                                <div className="flex-shrink-0 flex gap-2">
                                    <button
                                        onClick={() => onView(item)}
                                        className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-1 px-3 rounded-lg transition text-sm"
                                    >
                                        Bekijk
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRequest(item.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-lg transition text-sm"
                                    >
                                        Verwijder
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <Suspense fallback={null}>
                <ConfirmationDialog
                    isOpen={itemToDelete !== null}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    title="Verwijdering bevestigen"
                    message="Weet u zeker dat u dit item uit de geschiedenis wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
                />
            </Suspense>
        </>
    );
};

export default React.memo(HistorySection);
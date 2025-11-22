

import React, { useState, useEffect } from 'react';

// FIX: Corrected function signature to use `React.Dispatch` and `React.SetStateAction` which requires `React` to be in scope.
// FIX: Merged initialValue with the stored item to gracefully add new properties for existing users.
export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            if (!item) {
                return initialValue;
            }
            
            const stored = JSON.parse(item);

            // If both the initial value and the stored value are non-array objects,
            // merge them to ensure new keys from code updates are added to the state.
            if (
                typeof initialValue === 'object' && !Array.isArray(initialValue) && initialValue !== null &&
                typeof stored === 'object' && !Array.isArray(stored) && stored !== null
            ) {
                return { ...initialValue, ...stored };
            }
            
            return stored;

        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            const valueToStore = JSON.stringify(storedValue);
            window.localStorage.setItem(key, valueToStore);
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}
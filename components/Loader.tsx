

import React from 'react';

interface LoaderProps {
    message?: string;
    size?: 'small' | 'large';
}

const Loader: React.FC<LoaderProps> = ({ message, size = 'large' }) => {
    const loaderSize = size === 'large' ? 'w-16 h-16 border-4' : 'w-10 h-10 border-2';
    return (
        <div className="flex justify-center items-center flex-col my-8">
            <div className={`loader border-solid border-gray-600 border-t-amber-500 rounded-full animate-spin ${loaderSize}`}></div>
            {message && <p className="mt-4 text-gray-300">{message}</p>}
        </div>
    );
};

export default Loader;

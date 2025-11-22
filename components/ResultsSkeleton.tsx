import React from 'react';

const SkeletonElement: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-gray-700 rounded ${className}`}></div>
);

const ResultsSkeleton: React.FC = () => {
    return (
        <div className="space-y-8 mt-8 animate-pulse">
            {/* Title Skeleton */}
            <SkeletonElement className="h-9 w-2/3 mx-auto" />

            {/* Tabs Skeleton */}
            <div className="border-b border-gray-700">
                <div className="flex space-x-4 pb-2">
                    <SkeletonElement className="h-8 w-40" />
                    <SkeletonElement className="h-8 w-44" />
                    <SkeletonElement className="h-8 w-32" />
                </div>
            </div>

            <div className="space-y-8">
                {/* Social Posts Skeleton */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <SkeletonElement className="h-8 w-3/5 mb-4" />
                    <div className="border-b border-gray-700 mb-6">
                        <div className="flex space-x-4 pb-2">
                            <SkeletonElement className="h-7 w-20" />
                            <SkeletonElement className="h-7 w-24" />
                            <SkeletonElement className="h-7 w-24" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <SkeletonElement className="h-4 w-full" />
                        <SkeletonElement className="h-4 w-full" />
                        <SkeletonElement className="h-4 w-5/6" />
                        <SkeletonElement className="h-4 w-3/4" />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <SkeletonElement className="h-10 w-32 rounded-lg" />
                        <SkeletonElement className="h-10 w-36 rounded-lg" />
                    </div>
                </div>

                {/* AI Image Generator Skeleton */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <SkeletonElement className="h-8 w-1/2 mb-4" />
                    <SkeletonElement className="h-10 w-full mb-4" />
                    <div className="aspect-video bg-gray-700 rounded-lg mb-4"></div>
                    <SkeletonElement className="h-12 w-full rounded-lg" />
                </div>

                {/* Image Gallery Skeleton */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <SkeletonElement className="h-8 w-2/5 mb-4" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="aspect-square bg-gray-700 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsSkeleton;

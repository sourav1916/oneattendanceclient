export default function Skeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                    <div className="h-5 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>

                {/* Filters Skeleton */}
                <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
                        </div>
                        <div className="w-full md:w-48">
                            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Desktop Table Skeleton (hidden on mobile) */}
                <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></th>
                                    <th className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></th>
                                    <th className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
                                    <th className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
                                    <th className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></th>
                                    <th className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {[1, 2, 3, 4, 5].map((item) => (
                                    <tr key={`desktop-skeleton-${item}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                                                <div>
                                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                                                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                                                <div>
                                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                                                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                                                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile/Tablet Card Skeleton (visible on mobile/tablet) */}
                <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={`mobile-skeleton-${item}`} className="bg-white rounded-2xl shadow-sm p-5">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                                    <div>
                                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                            </div>

                            {/* Invited By */}
                            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                                    <div>
                                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                                        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="flex gap-1">
                                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                                <div className="flex-1 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                                <div className="flex-1 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="mt-4 bg-white rounded-2xl shadow-sm px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex gap-2">
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
'use client';

interface TabNavigationProps {
  activeTab: 'recommendations' | 'favorites';
  onTabChange: (tab: 'recommendations' | 'favorites') => void;
  favoritesCount: number;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
  favoritesCount,
}: TabNavigationProps) {
  return (
    <div className="flex border-b border-gray-200 mb-4">
      <button
        onClick={() => onTabChange('recommendations')}
        className={`px-6 py-3 text-sm font-medium transition-colors relative ${
          activeTab === 'recommendations'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        추천 공고
      </button>
      <button
        onClick={() => onTabChange('favorites')}
        className={`px-6 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
          activeTab === 'favorites'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        즐겨찾기
        {favoritesCount > 0 && (
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'favorites'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {favoritesCount}
          </span>
        )}
      </button>
    </div>
  );
}

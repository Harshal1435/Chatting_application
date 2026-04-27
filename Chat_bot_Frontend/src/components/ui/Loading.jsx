function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-gray-900 transition-colors">
      <div className="w-72 space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-md" />
          </div>
        </div>
        <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="space-y-3">
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export default Loading;

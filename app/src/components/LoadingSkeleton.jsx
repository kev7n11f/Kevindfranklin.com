// Reusable loading skeleton components

export const EmailListSkeleton = () => {
  return (
    <div className="divide-y divide-gray-200">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export const EmailViewSkeleton = () => {
  return (
    <div className="p-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  )
}

export const DraftListSkeleton = () => {
  return (
    <div className="divide-y divide-gray-200">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  )
}

export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </div>
  )
}

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {[...Array(cols)].map((_, i) => (
              <th key={i} className="text-left py-3 px-4">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, i) => (
            <tr key={i} className="border-b border-gray-100">
              {[...Array(cols)].map((_, j) => (
                <td key={j} className="py-3 px-4">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const ChartSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center justify-between mb-1">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

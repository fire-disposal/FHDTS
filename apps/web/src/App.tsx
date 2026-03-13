import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useState } from 'react'
import { createTRPCClient, trpc } from './lib/trpc'
import { Router } from './pages/Router'

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            retry: 1,
          },
        },
      })
  )

  const [trpcClient] = useState(() => createTRPCClient())

  return (
    // @ts-expect-error - tRPC typed client
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <ConfigProvider locale={zhCN}>
        <QueryClientProvider client={queryClient}>
          <Router />
        </QueryClientProvider>
      </ConfigProvider>
    </trpc.Provider>
  )
}

export default App

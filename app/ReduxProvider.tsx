'use client'

import { Provider } from 'react-redux'
import { store } from '@/lib/redux/store'
import { AuthGuard } from '../components/AuthGuard'

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthGuard>
        {children}
      </AuthGuard>
    </Provider>
  )
}
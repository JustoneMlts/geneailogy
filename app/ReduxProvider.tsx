'use client'

import { store, persistor } from '@/lib/redux/store'
import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}

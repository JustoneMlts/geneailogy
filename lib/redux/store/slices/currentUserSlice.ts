import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CurrentUserState {
  id: string | null
  name?: string
}

const initialState: CurrentUserState = {
  id: null,
  name: undefined,
}

const currentUserSlice = createSlice({
  name: 'currentUser',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<CurrentUserState>) => {
      state.id = action.payload.id
      state.name = action.payload.name
    },
    clearCurrentUser: (state) => {
      state.id = null
      state.name = undefined
    },
  },
})

export const { setCurrentUser, clearCurrentUser } = currentUserSlice.actions
export default currentUserSlice.reducer

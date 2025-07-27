import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { UserType } from '@/lib/firebase/models'

interface UserState {
  user: UserType | null,
  isLoading: boolean
}

const initialState: UserState = {
  user: null,
  isLoading: true, 
};

const currentUserSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<UserType | null>) => {
      state.user = action.payload
    },
    clearCurrentUser: (state) => {
      state.user = null
    },
  },
})

export const { setCurrentUser, clearCurrentUser } = currentUserSlice.actions
export const selectUser = (state: RootState) => state.user.user
export default currentUserSlice.reducer

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface MinimalUser {
  id: string
  firstName: string
  lastName: string
  avatar: string
}

interface UsersLiveState {
  cache: Record<string, MinimalUser>
}

const initialState: UsersLiveState = {
  cache: {},
}

const usersLiveSlice = createSlice({
  name: "usersLive",
  initialState,
  reducers: {
    setLiveUser: (state, action: PayloadAction<MinimalUser>) => {
      state.cache[action.payload.id] = action.payload;
    },
    removeLiveUser: (state, action: PayloadAction<string>) => {
      delete state.cache[action.payload];
    }
  }
})

export const { setLiveUser, removeLiveUser } = usersLiveSlice.actions;

export const selectLiveUserById = (id: string) => (state: any) =>
  state.usersLive?.cache[id] || null;

export default usersLiveSlice.reducer;

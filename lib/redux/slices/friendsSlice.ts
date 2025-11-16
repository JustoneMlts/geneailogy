import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getUsersByFriendsIds } from "@/app/controllers/usersController";
import { UserType } from "@/lib/firebase/models";

interface FriendsState {
  friends: UserType[];
  loading: boolean;
  error: string | null;
}

const initialState: FriendsState = {
  friends: [],
  loading: false,
  error: null,
};

/**
 * 🔥 Récupère la liste complète des amis via ta méthode
 */
export const fetchFriends = createAsyncThunk(
  "friends/fetchFriends",
  async (friendIds: string[], { rejectWithValue }) => {
    try {
      const users = await getUsersByFriendsIds(friendIds);
      return users; // tableau UserType[]
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const friendsSlice = createSlice({
  name: "friends",
  initialState,
  reducers: {
    /**
     * Ajouter un ami dans le state
     */
    addFriend: (state, action: PayloadAction<UserType>) => {
      const exists = state.friends.some((u) => u.id === action.payload.id);
      if (!exists) state.friends.push(action.payload);
    },

    /**
     * Supprimer un ami dans le state
     */
    removeFriend: (state, action: PayloadAction<string>) => {
      state.friends = state.friends.filter((u) => u.id !== action.payload);
    },

    /**
     * Reset (logout)
     */
    clearFriends: (state) => {
      state.friends = [];
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload;
      })

      .addCase(fetchFriends.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload ?? "Erreur inconnue";
      });
  },
});

export const { addFriend, removeFriend, clearFriends } = friendsSlice.actions;

export const selectFriends = (state: any) => state.friends.friends;
export const selectFriendsLoading = (state: any) => state.friends.loading;
export const selectFriendsError = (state: any) => state.friends.error;

export default friendsSlice.reducer;

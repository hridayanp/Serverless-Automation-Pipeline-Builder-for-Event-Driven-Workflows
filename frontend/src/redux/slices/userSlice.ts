import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// === Existing Interfaces ===
interface Role {
  id: number;
  name: string;
}

interface UserLocation {
  id: number;
  latitude: string;
  longitude: string;
  name: string;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  locations: UserLocation;
}

// === Managed User for Admin/CRUD ===
interface ManagedUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  status: string;
  locations: UserLocation;
}

// === Combined State ===
interface UserState {
  userProfile: UserProfile | null;
  userRoleStore: Role | null;
  userLocationStore: UserLocation | null;

  isSideNavigationExpanded: boolean;

  // NEW: User Management (Admin Panel)
  managedUsers: ManagedUser[];
}

const initialState: UserState = {
  userProfile: null,
  userRoleStore: null,
  userLocationStore: null,
  isSideNavigationExpanded: true,

  managedUsers: [],
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 🔹 Profile & App-specific Roles
    setUserProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.userProfile = action.payload;
      state.userRoleStore = action.payload?.role ?? null;
      state.userLocationStore = action.payload?.locations ?? null;
    },
    setUserRoleStore: (state, action: PayloadAction<Role | null>) => {
      state.userRoleStore = action.payload;
    },

    // 🔹 Admin/User Management
    setManagedUsers: (state, action: PayloadAction<ManagedUser[]>) => {
      state.managedUsers = action.payload;
    },
    addManagedUser: (state, action: PayloadAction<ManagedUser>) => {
      state.managedUsers.push(action.payload);
    },
    updateManagedUser: (state, action: PayloadAction<ManagedUser>) => {
      const index = state.managedUsers.findIndex(
        (user) => user.id === action.payload.id
      );
      if (index !== -1) {
        state.managedUsers[index] = action.payload;
      }
    },
    deleteManagedUser: (state, action: PayloadAction<string>) => {
      state.managedUsers = state.managedUsers.filter(
        (user) => user.id !== action.payload
      );
    },
  },
});

export const {
  setUserProfile,
  setUserRoleStore,
  setManagedUsers,
  addManagedUser,
  updateManagedUser,
  deleteManagedUser,
} = userSlice.actions;

// ✅ Selectors
export const selectUserProfile = (state: RootState) => state.user.userProfile;
export const selectUserRoleObject = (state: RootState) =>
  state.user.userRoleStore;
export const selectManagedUsers = (state: RootState) => state.user.managedUsers;

export const userReducer = userSlice.reducer;

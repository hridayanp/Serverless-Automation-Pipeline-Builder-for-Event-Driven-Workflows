/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type RootState } from '../store';

interface FieldsState {
  fieldDetails: Record<string, any>; // You can replace 'any' with a specific type if you have field details structure
  isFieldsLoading: boolean;
  isSeasonsLoading: boolean;
  fieldsListData: any[];
  fieldSelected: any;
  seasonsListData: any[];
  seasonSelected: any;

  isSideNavigationExpanded: any;
}

const initialState: FieldsState = {
  fieldDetails: {},
  isFieldsLoading: false,
  isSeasonsLoading: false,
  fieldsListData: [],
  fieldSelected: '',
  seasonsListData: [],
  seasonSelected: '',
  isSideNavigationExpanded: {},
};

export const fieldsSlice = createSlice({
  name: 'field',
  initialState,
  reducers: {
    setFieldDetails: (state, action: PayloadAction<Record<string, any>>) => {
      state.fieldDetails = action.payload;
    },
    setFieldsLoading: (state, action: PayloadAction<boolean>) => {
      state.isFieldsLoading = action.payload;
    },
    setSeasonsLoading: (state, action: PayloadAction<boolean>) => {
      state.isSeasonsLoading = action.payload;
    },
    setFieldsListData: (state, action: PayloadAction<any[]>) => {
      state.fieldsListData = action.payload;
    },
    setFieldSelected: (state, action: PayloadAction<any>) => {
      state.fieldSelected = action.payload;
    },
    setSeasonsListData: (state, action: PayloadAction<any[]>) => {
      state.seasonsListData = action.payload;
    },

    setSeasonSelected: (state, action: PayloadAction<any[]>) => {
      state.seasonSelected = action.payload;
    },

    setIsSideNavigationExpanded: (state, action: PayloadAction<any>) => {
      state.isSideNavigationExpanded = action.payload;
    },
  },
});

export const {
  setFieldDetails,
  setFieldsLoading,
  setSeasonsLoading,
  setFieldsListData,
  setFieldSelected,
  setSeasonsListData,
  setSeasonSelected,

  setIsSideNavigationExpanded,
} = fieldsSlice.actions;

// Selectors
export const selectFieldDetails = (state: RootState) =>
  state.field.fieldDetails;
export const selectFieldsLoading = (state: RootState) =>
  state.field.isFieldsLoading;
export const selectSeasonsLoading = (state: RootState) =>
  state.field.isSeasonsLoading;
export const selectFieldsListData = (state: RootState) =>
  state.field.fieldsListData;
export const selectFieldSelected = (state: RootState) =>
  state.field.fieldSelected;
export const selectSeasonsListData = (state: RootState) =>
  state.field.seasonsListData;

export const selectSeasonSelected = (state: RootState) =>
  state.field.seasonSelected;

export const selectIsSideNavigationExpanded = (state: RootState) =>
  state.field.isSideNavigationExpanded;

export const fieldReducer = fieldsSlice.reducer;

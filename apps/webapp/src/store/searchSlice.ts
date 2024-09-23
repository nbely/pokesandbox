import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export enum SearchType {
  Any = "Any",
  Servers = "Servers",
  Regions = "Regions",
  Users = "Users",
}

export interface SearchState {
  search: string;
  searchTypes: SearchType[];
}

const initialState: SearchState = {
  search: "",
  searchTypes: [SearchType.Any],
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setSearchType: (state, action: PayloadAction<SearchType[]>) => {
      state.searchTypes = action.payload;
    },
  },
});

export const { setSearch, setSearchType } = searchSlice.actions;
export default searchSlice.reducer;

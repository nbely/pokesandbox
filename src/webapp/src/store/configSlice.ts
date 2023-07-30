import { createSlice } from "@reduxjs/toolkit";


export interface ConfigState {
  isDarkMode: boolean;
}

const initialState: ConfigState = {
  isDarkMode: true,
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
  },
});

export const { toggleDarkMode } = configSlice.actions;
export default configSlice.reducer;

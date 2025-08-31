import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

const initialState = {
  courses: [],
  loading: false,
  error: null,
};

// Example async thunk for fetching courses
export const fetchCourses = createAsyncThunk(
  "courses/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/courses");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const courseSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default courseSlice.reducer; 
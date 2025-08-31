import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

const initialState = {
  students: [],
  loading: false,
  error: null,
};

// Example async thunk for fetching students
export const fetchStudents = createAsyncThunk(
  "students/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/students");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const studentSlice = createSlice({
  name: "students",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default studentSlice.reducer; 
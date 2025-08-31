import { configureStore } from "@reduxjs/toolkit";
import studentReducer from "./studentSlice";
import courseReducer from "./courseSlice";

export default configureStore({
  reducer: {
    students: studentReducer,
    courses: courseReducer,
  },
}); 
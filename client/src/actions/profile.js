import { GET_PROFILE, PROFILE_ERROR } from "./types";
import axios from "axios";

// Load user
export const getCurrentProfile = () => async (dispatch) => {
  const res = await axios.get(`http://localhost:5000/api/profile/me`);
  try {
    dispatch({
      type: GET_PROFILE,
      payload: res.data,
    });
  } catch (error) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: error.res.statusText, status: error.res.status },
    });
  }
};

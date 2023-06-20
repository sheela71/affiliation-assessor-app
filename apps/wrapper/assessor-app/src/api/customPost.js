import axios from "axios";
import { getCookie } from "../utils";
import { logUserEvents } from "../utils/captureUserEvent";
import { constants as C } from "../utils/constants";

const BASE_URL = process.env.REACT_APP_HASURA_SERVICE_URL;

const customPost = axios.create({
  baseURL: BASE_URL,
});

customPost.interceptors.request.use(
  (request) => {
    const user_data = getCookie("userData");
    request.headers["Accept"] = "application/json";
    request.headers["Content-Type"] = "application/json";
    request.headers["Authorization"] = `Bearer ${user_data.token}`;
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);
customPost.interceptors.response.use(
  (response) => {
    console.log("response - ", response);
    logUserEvents("API Call","success",response)
    return response;
  },
  (error) => {
    console.log("error response - ", error.response);
    logUserEvents("API error response","error",error.response)
    if (error.response.status === 404) {
      // Do something
    }

    if (error.response.status === 400) {
      // Do something
    }

    if (error.response.status === 500) {
      // Do something
    }
  }
);

export default customPost;

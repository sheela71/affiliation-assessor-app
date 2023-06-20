import axios from "axios";
import { getCookie } from "../utils";

const BASE_URL = process.env.REACT_APP_USER_LOGGING_SERVICE_URL;

const customPostUserEvent = axios.create({
  baseURL: BASE_URL,
});

customPostUserEvent.interceptors.request.use(
  (request) => {
    const user_data = getCookie("userData");
    request.headers["Accept"] = "application/json";
    request.headers["Content-Type"] = "application/json";

    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default customPostUserEvent;

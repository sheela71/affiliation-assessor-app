import axios from "axios";
import { getCookie } from "../utils";

const BASE_URL = process.env.REACT_APP_HASURA_SERVICE_URL;
const HASURA_CLIENT_NAME =
  process.env.REACT_APP_HASURA_CLIENT_NAME || "hasura-console";
const X_HASURA_ADMIN_SECRET_KEY =
  process.env.REACT_APP_HASURA_ADMIN_SECRET_KEY || "myadminsecretkey";
const REACT_APP_HASURA_URL =
  process.env.REACT_APP_HASURA_URL || "https://hasura.upsmfac.org/v1/graphql/";

const customPost = axios.create({
  baseURL: BASE_URL,
});

customPost.interceptors.request.use(
  (request) => {
    const user_data = getCookie("userData");
    request.headers["Accept"] = "application/json";
    request.headers["Content-Type"] = "application/json";
    // request.headers['Authorization'] = `Bearer ${user_data.token}`;
    request.headers["Hasura-Client-Name"] = HASURA_CLIENT_NAME;
    request.headers["x-hasura-admin-secret"] = X_HASURA_ADMIN_SECRET_KEY;
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// const customPost = axios.create({
//   baseURL: BASE_URL,
// });

// customPost.interceptors.request.use(
//   (request) => {
//     const user_data = getCookie("userData");
//     request.headers["Accept"] = "application/json";
//     request.headers["Content-Type"] = "application/json";
//     request.headers["Authorization"] = `Bearer ${user_data.accessToken}`;
//     return request;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

export default customPost;

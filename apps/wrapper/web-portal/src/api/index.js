import API_URL from "./apiUrl";
import adminCustomPost from "./adminCustomApi";
import fileConversionCustomPost from "./fileConversionCustomApi";
import axios from "axios";
import { getCookie } from "../utils/common";

const BASE_URL_KEYCLOAK =
  process.env.REACT_APP_WEB_PORTAL_USER_SERVICE_URL ||
  "https://auth.upsmfac.org/api/v1/";

export const registerUser = async (postData) => {
  const res = await adminCustomPost.post(API_URL.auth.register, postData);
  return res;
};

export const getRegulator = async (postData) => {
  const res = await adminCustomPost.post(API_URL.auth.getRegulator, postData);
  return res;
};

export const getFormData = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.groundAnalysis.viewForm,
    postData
  );
  return res;
};

export const getOnGroundAssessorData = async (postData) => {
  const res = await adminCustomPost.post(API_URL.groundAnalysis.list, postData);
  return res;
};

export const getAcceptApplicantNoc = async (postData) => {
  const res = await adminCustomPost.put(
    API_URL.groundAnalysis.acceptApplicantNoc,
    postData
  );
  return res;
};

export const getAcceptApplicantCertificate = async (postData) => {
  const res = await adminCustomPost.put(
    API_URL.groundAnalysis.acceptApplicantCertificate,
    postData
  );
  return res;
};

export const getRejectApplicant = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.groundAnalysis.rejectApplicant,
    postData
  );
  return res;
};

export const getStatus = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.viewStatus.getViewStatus,
    postData
  );
  return res.data;
};

export const markReviewStatus = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.groundAnalysis.markStatus,
    postData
  );
  return res;
};

export const filterOGA = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.groundAnalysis.filterOGA,
    postData
  );
  return res;
};

// Manage forms APIs
export const convertODKtoXML = async (postData) => {
  const res = await fileConversionCustomPost.post(
    API_URL.manageForms.convertODKtoXML,
    postData
  );
  return res;
};

export const nocPdfUploader = async (postData) => {
  const res = await fileConversionCustomPost.post(
    API_URL.manageForms.nocPdfUpload,
    postData
  );
  return res;
};

export const createForm = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageForms.createForm,
    postData
  );
  return res;
};

export const getForms = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageForms.getForms,
    postData
  );
  return res;
};

export const publishForms = async (postData) => {
  const res = await adminCustomPost.put(
    API_URL.manageForms.publishForms,
    postData
  );
  return res;
};

export const unpublishForms = async (postData) => {
  const res = await adminCustomPost.put(
    API_URL.manageForms.unpublishForms,
    postData
  );
};

export const viewForm = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageForms.viewForm,
    postData
  );
  return res;
};

export const duplicateForms = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageForms.duplicateForm,
    postData
  );
  return res;
};

export const deleteForm = async (postData) => {
  return await adminCustomPost.delete(API_URL.manageForms.deleteForm, {
    data: postData,
  });
};

export const filterForms = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageForms.filterForms,
    postData
  );
  return res;
};

export const createCourse = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageForms.createCourses,
    postData
  );
  return res;
};

export const updateForms = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageForms.updateForms,
    postData
  );
  return res;
};

// Manage users API's...
export const getAllAssessors = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageUsers.getAllAssessors,
    postData
  );
  return res;
};

export const getAllRegulators = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageUsers.getAllRegulators,
    postData
  );
  return res;
};

export const getUsersForScheduling = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.desktopAnalysis.getUsersForSchedulingAssessment,
    postData
  );
  return res;
};
export const handleActiveUser = async (postData) => {
  const res = await adminCustomPost.put(
    API_URL.manageUsers.setActivate,
    postData
  );
  return res;
};

export const handleDeleteUser = async (postData) => {
  return await adminCustomPost.delete(API_URL.manageUsers.deleteUser, {
    data: postData,
  });
};

export const handleInctiveUser = async (postData) => {
  const res = await adminCustomPost.put(
    API_URL.manageUsers.setDeactive,
    postData
  );
  return res;
};

export const getSpecificUser = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageUsers.specificUser,
    postData
  );
  return res;
};

export const filterUsers = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageUsers.filterUsers,
    postData
  );
  return res;
};

export const editUserHasura = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageUsers.editUser,
    postData
  );
  return res;
};

// Desktop Analysis APIs...
export const getScheduleAssessment = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.desktopAnalysis.scheduleAssessment,
    postData
  );
  return res;
};
export const addInstituteCourse = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.desktopAnalysis.addInstituteCourse,
    postData
  );
  return res;
};
export const getDesktopAnalysisForms = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.desktopAnalysis.getDesktopAnalysisForms,
    postData
  );
  return res;
};

export const getAllTheCourses = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.desktopAnalysis.getCourseOGA,
    postData
  );
  return res;
};

export const filterDesktopAnalysis = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.desktopAnalysis.filterDesktopAnalysis,
    postData
  );
  return res;
};

// Schedule Management APIs...
export const getAssessmentSchedule = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.scheduleManagement.getAssessmentSchedule,
    postData
  );
  return res;
};

export const filterAssessments = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.scheduleManagement.filterAssessments,
    postData
  );
  return res;
};

export const addAssessmentSchedule = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.scheduleManagement.addAssessmentSchedule,
    postData
  );
  return res;
};

export const deleteSchedule = async (postData) => {
  return await adminCustomPost.delete(
    API_URL.scheduleManagement.deleteSchedule,
    {
      data: postData,
    }
  );
};

// Bulk create users keycloak
export const createBulkUsersKeyCloak = async (postData) => {
  const res = await axios.post(
    `${BASE_URL_KEYCLOAK}${API_URL.SIGNUP.CREATE_USER}`,
    postData,
    {
      headers: {
        "Content-Type": "application/json",
        // "Authorization": getCookie("access_token")
        Authorization: process.env.REACT_APP_AUTH_TOKEN,
      },
    }
  );
  return res;
};

// Edit user keycloak
export const editUserKeycloak = async (postData) => {
  const res = await axios.put(
    `${BASE_URL_KEYCLOAK}${API_URL.SIGNUP.EDIT_USER}`,
    postData,
    {
      headers: {
        "Content-Type": "application/json",
        // "Authorization": getCookie("access_token")
        Authorization: process.env.REACT_APP_AUTH_TOKEN,
      },
    }
  );
  return res;
};

// Bulk create users Hasura
export const createBulkUserHasura = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageUsers.addUsers,
    postData
  );
  return res;
};

export const getScheduleDetails = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.manageUsers.viewSchedule,
    postData
  );
  return res;
};

// delete users
// export const deleteUsers = async (postData) => {
//   const res = await adminCustomPost.post(
//     API_URL.manageUsers.addUsers,
//     postData
//   );
//   return res;
// };

//global search
export const searchUsers = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.GLOBAL_SEARCH.searchUsers,
    postData
  );
  return res;
};

export const searchDesktop = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.GLOBAL_SEARCH.searchDesktop,
    postData
  );
  return res;
};

export const searchOGA = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.GLOBAL_SEARCH.searchOGA,
    postData
  );
  return res;
};

export const searchForms = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.GLOBAL_SEARCH.searchForms,
    postData
  );
  return res;
};

export const searchAssessments = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.GLOBAL_SEARCH.searchAssessments,
    postData
  );
  return res;
};

export const registerEvent = async (postData) => {
  const events = {
    events: [],
  };
  events.events.push(postData);
  // console.log("events - ", events);

  const res = await adminCustomPost.post(API_URL.common.registerEvent, events);
  return res;
};

// Notifications APIs
export const insertNotifications = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.notifications.insertNotifications,
    postData
  );
  return res;
};

export const getNotifications = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.notifications.getNotifications,
    postData
  );
  return res;
};

export const readNotification = async (postData) => {
  const res = await adminCustomPost.put(
    API_URL.notifications.readNotification,
    postData
  );
  return res;
};

export const viewNotification = async (postData) => {
  const res = await adminCustomPost.post(
    API_URL.notifications.viewNotification,
    postData
  );
  return res;
};

export const updateFormStatus = async (postData) => {
  const res = await adminCustomPost.put(API_URL.common.updateForm, postData);
  return res;
};

export const updatePaymentStatus = async (postData) => {
  const res = await adminCustomPost.put(
    API_URL.desktopAnalysis.updatePaymentStatus,
    postData
  );
  return res;
};

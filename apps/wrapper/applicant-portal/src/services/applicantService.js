import { APIS } from "../constants";
import axiosService from "./axiosService";
import paymentService from "./paymentService";

const addInstitute = (instituteDetails) => {
  return axiosService.post(APIS.APPLICANT.ADD_INSTITUTE, instituteDetails);
};

const addInstitutePoc = (institutePocDetails) => {
  return axiosService.post(
    APIS.APPLICANT.ADD_INSTITUTE_POC,
    institutePocDetails
  );
};

const getApplicantDetails = (applicantDetails) => {
  return axiosService.post(
    APIS.APPLICANT.GET_APPLICANT_DETAILS,
    applicantDetails
  );
};

// Notifications APIs
const insertNotifications = async (postData) => {
  const res = await axiosService.post(
    APIS.notifications.insertNotifications,
    postData
  );
  return res;
};

const getNotifications = async (postData) => {
  const res = await axiosService.post(
    APIS.notifications.getNotifications,
    postData
  );
  return res;
};

const readNotification = async (postData) => {
  const res = await axiosService.put(
    APIS.notifications.readNotification,
    postData
  );
  return res;
};

// payment service
const initiatePayment = async (postData) => {
  const res = await paymentService.post(APIS.PAYMENT.GENERATE_LINK, postData);
  return res;
};
const transactionStatus = async (postData) => {
  const res = await axiosService.post(APIS.APPLICANT.ADD_TRANSACTION, postData);
  return res;
};
const updatePaymentStatus = async (postData) => {
  const res = await axiosService.put(APIS.PAYMENT.UPDATE_PAYMENT_STATUS, postData);
  return res;
};
export const applicantService = {
  addInstitute,
  addInstitutePoc,
  getApplicantDetails,
  insertNotifications,
  getNotifications,
  readNotification,
  initiatePayment,
  transactionStatus,
  updatePaymentStatus
};

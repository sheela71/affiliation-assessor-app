import XMLParser from "react-xml-parser";
import localforage from "localforage";
import Cookies from "js-cookie";
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';

import { getMedicalAssessments, getPrefillXML, getSubmissionXML, registerEvent } from "../api";

const ENKETO_URL = process.env.REACT_APP_ENKETO_URL;
const GCP_URL = process.env.REACT_APP_GCP_AFFILIATION_LINK;

export const makeHasuraCalls = async (query) => {
  const userData = getCookie("userData");
  return fetch(process.env.REACT_APP_HASURA_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Hasura-Client-Name": process.env.REACT_APP_HASURA_CLIENT_NAME,
      "x-hasura-admin-secret": process.env.REACT_APP_HASURA_ADMIN_SECRET_KEY
    },
    body: JSON.stringify(query),
  })
    .then(async (response) => await validateResponse(response))
    .catch((error) => {
      return error;
    });
};

const validateResponse = async (response) => {
  const apiRes = await response.json();

  const jsonResponse = {
    ...apiRes,
    responseStatus: false,
  };
  return jsonResponse;
};

export const makeDataForPrefill = (prev, xmlDoc, key, finalObj, formName) => {
  if (Array.isArray(xmlDoc) && xmlDoc.length == 0 && prev.value) {
    finalObj[key] = prev.value;
  } else {
    for (const el in xmlDoc) {
      makeDataForPrefill(
        xmlDoc[el],
        xmlDoc[el].children,
        key + "_*_" + xmlDoc[el].name,
        finalObj,
        formName
      );
    }
  }
};

export const updateFormData = async (startingForm) => {
  try {
    // TODO: check if formdata has to have value, check line 65 for getcookie connect with Sheela
    let data = await getFromLocalForage(`${startingForm}_${new Date().toISOString().split("T")[0]}`);
    
    const GCP_form_url = `${GCP_URL}${startingForm}.xml`;
    let prefilledForm = await getSubmissionXML(
      GCP_form_url,
      data.formData,
      data.imageUrls
    );
    return prefilledForm;
  } catch (err) {}
};

export const setCookie = (cname, cvalue) => {
  try {
    Cookies.set(cname, JSON.stringify(cvalue));
  } catch (error) {
    return false;
  }
};

export const getCookie = (cname) => {
  try {
    let cookie = Cookies.get(cname);
    if (cookie) return JSON.parse(cookie);
  } catch (error) {
    return false;
  }
};

export const logout = () => {
  localStorage.clear();
  sessionStorage.clear();
  localforage.clear();
  window.location = "/";
  removeCookie("userData");
  serviceWorkerRegistration.unregister();
};

export const removeCookie = (cname) => {
  try {
    Cookies.remove(cname);
    return true;
  } catch (error) {
    return false;
  }
};

export const isImage = (key, filename) => {
  if (
    filename.includes(".png") ||
    filename.includes(".tif") ||
    filename.includes(".tiff") ||
    filename.includes(".jpg") ||
    filename.includes(".jpeg") ||
    filename.includes(".bmp") ||
    filename.includes(".gif") ||
    filename.includes(".eps")
  )
    return true;
  if (key.includes("img") || key.includes("image")) return true;
  return false;
};

export const getFromLocalForage = async (key) => {
  const user = getCookie("userData");
  try {
    return await localforage.getItem(`${user?.userRepresentation?.id}_${key}`);
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const getAllKeysFromForage = async () => {
  let keys = [];
  await localforage.keys().then((keysOfArray) => {
    keys = keysOfArray;
  });
  return keys;
};

export const setToLocalForage = async (key, value) => {
  const storedData = await getSpecificDataFromForage(key);
  if (storedData) {
    const newData = { ...storedData, ...value };
    await localforage.setItem(key, newData);
  } else {
    await localforage.setItem(key, value);
  }
};

export const getSpecificDataFromForage = async (key) => {
  return await localforage.getItem(key);
};

export const removeItemFromLocalForage = (key) => {
  localforage.removeItem(key);
};

export const handleFormEvents = async (startingForm, afterFormSubmit, e) => {
  const user = getCookie("userData");
  
  if (
    (e.origin + '/enketo') === ENKETO_URL &&
    typeof e?.data === "string" &&
    JSON.parse(e?.data)?.state !== "ON_FORM_SUCCESS_COMPLETED"
  ) {
    var formData = new XMLParser().parseFromString(JSON.parse(e.data).formData);
    if (formData) {
      let images = JSON.parse(e.data).fileURLs;
      let prevData = await getFromLocalForage(
        startingForm + `${new Date().toISOString().split("T")[0]}`
      );
      await setToLocalForage(`${user?.userRepresentation?.id}_${startingForm}_${new Date().toISOString().split("T")[0]}`,
        {
          formData: JSON.parse(e.data).formData,
          imageUrls: { ...prevData?.imageUrls, ...images },
        }
      );
    }
  }
  afterFormSubmit(e);
};

export const getFormData = async ({
  loading,
  scheduleId,
  formSpec,
  startingForm,
  formId,
  setData,
  setEncodedFormSpec,
  setEncodedFormURI,
  isPreview
}) => {
  const GCP_form_url = `${GCP_URL}${startingForm}.xml`;
  const res = await getMedicalAssessments(formSpec.date);
  let formData, prefillXMLArgs;
  if (res?.data?.assessment_schedule?.[0]) {
    loading.current = true;
    let assessment = res?.data?.assessment_schedule?.[0];
    scheduleId.current = assessment.id;
    setData({
      schedule_id: assessment.id,
      id: assessment.institute.id,
      district: assessment.institute.district,
      instituteName: assessment.institute.name,
      specialization:
        assessment.institute?.institute_specializations?.[0]?.specializations,
      courses: assessment.institute?.institute_types?.[0]?.types,
      type: assessment.institute.sector,
      latitude: assessment.institute.latitude,
      longitude: assessment.institute.longitude,
    });

    formData = await getFromLocalForage(`${startingForm}_${new Date().toISOString().split("T")[0]}`);
    if (formData) {
      setEncodedFormSpec(encodeURI(JSON.stringify(formSpec.forms[formId])));
      prefillXMLArgs = [
        `${GCP_form_url}`,
        formSpec.forms[formId].onSuccess,
        formData.formData,
        formData.imageUrls,
      ];
    } else {
      prefillXMLArgs = [`${GCP_form_url}`, formSpec.forms[formId].onSuccess];
    }

    let prefilledForm = await getPrefillXML(...prefillXMLArgs);
    setEncodedFormURI(prefilledForm);
  } else setData(null);
  loading.current = false;
};

export const getLocalTimeInISOFormat = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localTime = new Date(now - offset * 60 * 1000);
  return localTime.toISOString();
}

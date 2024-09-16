import React, { useContext, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { FaAngleRight } from "react-icons/fa";
import StatusLogModal from "../ground-analysis/StatusLogModal";
import XMLParser from "react-xml-parser";
import { getCookie, readableDate } from "../../utils";

// import NocModal from "./NocModal";
// import RejectNocModal from "./RejectNocModal";
import { getLocalTimeInISOFormat } from "../../utils";
import { Card, Button } from "./../../components";
import CommonModal from "./../../Modal";
import ScheduleInspectionModal from "./ScheduleInspectionModal";
import Sidebar from "../../components/Sidebar";

import {
  getFormData,
  registerEvent,
  getStatus,
  updateFormStatus,
  updatePaymentStatus,
} from "../../api";
import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import {
  getFormURI,
  updateFormSubmission,
  getPrefillXML,
} from "./../../api/formApi";
import {
  updateFormData,
  removeItemFromLocalForage,
  getFromLocalForage,
  setToLocalForage,
} from "../../forms";
import { ContextAPI } from "../../utils/ContextAPI";

const ENKETO_URL = process.env.REACT_APP_ENKETO_URL;

export default function DesktopAnalysisView() {
  // const [rejectModel, setRejectModel] = useState(false)
  // const [openModel, setOpenModel] = useState(false);
  const navigate = useNavigate();
  const [openScheduleInspectionModel, setOpenSheduleInspectionModel] =
    useState(false);
  const [encodedFormURI, setEncodedFormURI] = useState("");
  let { formName, formId } = useParams();
  const [formDataFromApi, setFormDataFromApi] = useState();
  const [openStatusModel, setOpenStatusModel] = useState(false);
  const { setSpinner, setToast } = useContext(ContextAPI);

  const formSpec = {
    skipOnSuccessMessage: true,
    prefill: {},
    submissionURL: "",
    name: formName,
    successCheck: "async (formData) => { return true; }",
    onSuccess: {
      notificationMessage: "Feedback submitted successfully",
      sideEffect: "async (formData) => { console.log(formData); }",
    },
    onFailure: {
      message: "Form submission failed",
      sideEffect: "async (formData) => { console.log(formData); }",
      next: {
        type: "url",
        id: "google",
      },
    },
    start: formName,
  };

  const startingForm = formSpec.start;
  const [onFormSuccessData, setOnFormSuccessData] = useState(undefined);
  const [onFormFailureData, setOnFormFailureData] = useState(undefined);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [onSubmit, setOnSubmit] = useState(false);
  const [encodedFormSpec, setEncodedFormSpec] = useState(
    encodeURI(JSON.stringify(formSpec.formId))
  );

  const userDetails = getCookie("userData");
  const userId = userDetails?.userRepresentation?.id;

  const fetchFormData = async () => {
    let formData = {};
    let filePath =
      process.env.REACT_APP_GCP_AFFILIATION_LINK + formName + ".xml";

    let data = await getFromLocalForage(
      `${userId}_${formName}_${new Date().toISOString().split("T")[0]}`
    );

    const postData = { form_id: formId };
    try {
      const res = await getFormData(postData);
      formData = res.data.form_submissions[0];

      setPaymentStatus(formData?.payment_status);
      const postDataEvents = { id: formId };
      const events = await getStatus(postDataEvents);
      setFormStatus(events?.events);
      setFormDataFromApi(res.data.form_submissions[0]);
      await setToLocalForage(
        `${userId}_${startingForm}_${new Date().toISOString().split("T")[0]}`,
        {
          formData: formData?.form_data,
          imageUrls: { ...data?.imageUrls },
        }
      );

      let formURI = await getPrefillXML(
        `${filePath}`,
        formSpec.onSuccess,
        formData?.form_data,
        formData?.imageUrls
      );
      setEncodedFormURI(formURI);
    } catch (error) {
      console.log(error);
    } finally {
      // setSpinner(false);
    }
  };

  const afterFormSubmit = async (e) => {
    const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
    try {
      const { nextForm, formData, onSuccessData, onFailureData } = data;
      if (data?.state === "ON_FORM_SUCCESS_COMPLETED") {
        setSpinner(true);
        handleSubmit();
      }

      if (nextForm?.type === "form") {
        setOnFormSuccessData(onSuccessData);
        setOnFormFailureData(onFailureData);
        setEncodedFormSpec(encodeURI(JSON.stringify(formSpec.forms[formId])));
        setEncodedFormURI(
          getFormURI(
            nextForm.id,
            onSuccessData,
            formSpec.forms[nextForm.id].prefill
          )
        );
      } else if (nextForm?.type === "url") {
        window.location.href = nextForm.url;
      }
    } catch (e) {
      console.log("error = ", e);
    }
  };

  const handleSubmit = async () => {
    const updatedFormData = await updateFormData(formSpec.start, userId);

    const res = await updateFormSubmission({
      form_id: formId,
      form_data: updatedFormData,
      assessment_type: "applicant",
      form_name: formName?.replace("admin", "applicant"),
      submission_status: true,
      applicant_id: formDataFromApi?.institute?.id,
      updated_at: getLocalTimeInISOFormat(),
      form_status: "Returned",
    });

    if (res) {
      // Register Event of the form.
      await registerEvent({
        created_date: getLocalTimeInISOFormat(),
        entity_id: formId.toString(),
        entity_type: "form",
        event_name: "Returned",
        remarks: `${userDetails?.userRepresentation?.username} has returned application with remarks`,
      });
    }

    // Delete the data from the Local Forage
    const key = `${userId}_${formSpec.start}_${
      new Date().toISOString().split("T")[0]
    }`;
    removeItemFromLocalForage(key);

    // setOnSubmit(false);
    setToast((prevState) => ({
      ...prevState,
      toastOpen: true,
      toastMsg: "Remarks added successfully!",
      toastType: "success",
    }));

    setSpinner(false);
    setTimeout(
      () => navigate(`${ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.home}`),
      1500
    );
  };

  const handleFormEvents = async (startingForm, afterFormSubmit, e) => {
    if (typeof e.data === "string" && e.data.includes("webpackHot")) {
      return;
    }

    if (
      ENKETO_URL === e.origin + "/enketo/" &&
      typeof e?.data === "string" &&
      JSON.parse(e?.data)?.state !== "ON_FORM_SUCCESS_COMPLETED"
    ) {
      var formData = new XMLParser().parseFromString(
        JSON.parse(e.data).formData
      );
      if (formData) {
        let images = JSON.parse(e.data).fileURLs;
        let prevData = await getFromLocalForage(
          `${userId}_${startingForm}_${new Date().toISOString().split("T")[0]}`
        );

        await setToLocalForage(
          `${userId}_${startingForm}_${new Date().toISOString().split("T")[0]}`,
          {
            formData: JSON.parse(e.data).formData,
            // imageUrls: { ...prevData?.imageUrls, ...images },
          }
        );
      }
    }
    afterFormSubmit(e);
  };

  const handleEventTrigger = async (e) => {
    handleFormEvents(startingForm, afterFormSubmit, e);
  };

  const bindEventListener = () => {
    window.addEventListener("message", handleEventTrigger);
  };

  const otherInfo = {
    instituteId: formDataFromApi?.institute?.id,
    course_applied: formDataFromApi?.institute?.course_applied,
    formId: formId,
    course_type: formDataFromApi?.course_type,
    course_level: formDataFromApi?.course_level,
    round: formDataFromApi?.round,
  };

  const desktopVerification = () => {
    updatePaymentStatus({ form_id: formId, payment_status: "Pending" });
    registerEvent({
      created_date: getLocalTimeInISOFormat(),
      entity_id: formId,
      entity_type: "form",
      event_name: "DA Completed",
      remarks: `${
        getCookie("regulator")[0]["full_name"]
      } has completed the Desktop Analysis`,
    });

    updateFormStatus({
      form_id: formId * 1,
      form_status: "DA Completed",
    });

    setTimeout(
      () => navigate(`${ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.home}`),
      1500
    );
  };

  const checkIframeLoaded = () => {
    if (window.location.host.includes("regulator.upsmfac")) {
      const iframeElem = document.getElementById("enketo_DA_preview");
      var iframeContent =
        iframeElem?.contentDocument || iframeElem?.contentWindow.document;
      if (
        formDataFromApi &&
        formDataFromApi?.form_status?.toLowerCase() !==
          "application submitted" &&
        formDataFromApi?.form_status?.toLowerCase() !== "resubmitted"
      ) {
        var section = iframeContent?.getElementsByClassName("or-group");
        if (!section) return;
        for (var i = 0; i < section?.length; i++) {
          var inputElements = section[i].querySelectorAll("input");
          inputElements.forEach((input) => {
            input.disabled = true;
          });
        }

        iframeContent.getElementById("submit-form").style.display = "none";
        iframeContent.getElementById("save-draft").style.display = "none";
      }

      // Need to work on Save draft...
      var draftButton = iframeContent.getElementById("save-draft");
      draftButton?.addEventListener("click", function () {
        alert("Hello world!");
      });
    }
    setSpinner(false);
  };

  useEffect(() => {
    setSpinner(true);
    fetchFormData();
    bindEventListener();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      checkIframeLoaded();
    }, 2500);
  }, [formDataFromApi]);

  return (
    <>
      <div className="h-[48px] bg-white flex justify-start drop-shadow-sm">
        <div className="container mx-auto flex px-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.home}>
              <span className="text-primary-400">
                Desktop analysis - All applications
              </span>
            </Link>
            <FaAngleRight className="text-[16px]" />
            <span className="text-gray-500 uppercase">
              {formDataFromApi?.course?.course_name.split("_").join(" ")}
            </span>
          </div>
        </div>
      </div>

      <div className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}>
        <div className="flex flex-col gap-12">
          <div className="flex flex-row">
            <div className="flex grow gap-4 justify-end items-center">
              {paymentStatus?.toLowerCase() === "paid" &&
                formDataFromApi?.form_status?.toLowerCase() ===
                  "da completed" && (
                  <button className="flex flex-wrap items-center justify-center gap-2 border border-gray-500 bg-white text-gray-500 w-fit h-fit p-2 font-semibold rounded-[4px]">
                    <span>
                      <BsArrowLeft />
                    </span>
                    Return to institute
                  </button>
                )}
              {paymentStatus?.toLowerCase() === "paid" &&
                formDataFromApi?.form_status?.toLowerCase() ===
                  "da completed" && (
                  <button
                    onClick={() => setOpenSheduleInspectionModel(true)}
                    className="flex flex-wrap items-center justify-center gap-2 border border-gray-500 bg-white text-gray-500 w-fit h-fit p-2 font-semibold rounded-[4px]"
                  >
                    Send for inspection
                    <span>
                      <BsArrowRight />
                    </span>
                  </button>
                )}
              {(formDataFromApi?.form_status?.toLowerCase() !==
                  "da completed" && paymentStatus?.toLowerCase() !== "paid") && (
                  <button
                    onClick={() => desktopVerification()}
                    className="flex flex-wrap items-center justify-center gap-2 border border-gray-500 bg-white text-gray-500 w-fit h-fit p-2 font-semibold rounded-[4px]"
                  >
                    Initiate Payment
                  </button>
                )}

              <div
                className={`${
                  formDataFromApi?.form_status === "Inspection Scheduled"
                    ? "invisible"
                    : "inline-block h-[40px] min-h-[1em] w-0.5 border opacity-100 dark:opacity-50"
                }`}
              />
              <button
                onClick={() => setOpenStatusModel(true)}
                className="border border-gray-500 text-blue-600 bg-gray-100 w-[140px] h-[40px] font-medium rounded-[4px]"
              >
                View status log
              </button>
            </div>
          </div>

          <div className="flex flex-row gap-4">
            {/* <div className="flex w-[30%]">
              <Sidebar />
            </div> */}
            <div className="flex w-full flex-col gap-4">
              <Card
                moreClass="flex flex-col shadow-md border border-[#F5F5F5] gap-4"
                styles={{ backgroundColor: "#F5F5F5" }}
              >
                <div
                  className="p-1 flex justify-center border border-[#D9D9D9] rounded-[4px]"
                  style={{ backgroundColor: "#EBEBEB" }}
                >
                  <h4
                    className={`font-medium ${
                      formDataFromApi?.form_status?.toLowerCase() ===
                      "in progress"
                        ? "text-yellow-400"
                        : formDataFromApi?.form_status?.toLowerCase() ===
                          "resubmitted"
                        ? "text-orange-400"
                        : formDataFromApi?.form_status?.toLowerCase() ===
                          "inspection scheduled"
                        ? "text-blue-400"
                        : formDataFromApi?.form_status?.toLowerCase() ===
                          "application submitted"
                        ? "text-green-400"
                        : formDataFromApi?.form_status?.toLowerCase() === "na"
                        ? "text-red-400"
                        : formDataFromApi?.form_status?.toLowerCase() ===
                          "oga completed"
                        ? "text-purple-400"
                        : formDataFromApi?.form_status?.toLowerCase() ===
                          "approved"
                        ? "text-teal-400"
                        : formDataFromApi?.form_status?.toLowerCase() ===
                          "rejected"
                        ? "text-pink-400"
                        : "text-white"
                    }`}
                  >
                    Status: {formDataFromApi?.form_status}
                  </h4>
                </div>
                <div className="flex text-gray-500 justify-center">
                  This application was last updated on{" "}
                  {readableDate(formStatus?.[0]?.created_date)}
                </div>
              </Card>
              <Card moreClass="shadow-md">
                <iframe
                  id="enketo_DA_preview"
                  title="form"
                  src={`${ENKETO_URL}/preview?formSpec=${encodeURI(
                    JSON.stringify(formSpec)
                  )}&xform=${encodedFormURI}&userId=${userId}`}
                  style={{ minHeight: "100vh", width: "100%" }}
                />
              </Card>
            </div>
          </div>

          {/* { openModel && <NocModal closeModal={setOpenModel}/> } */}
          {/* { rejectModel && <RejectNocModal closeRejectModal={setRejectModel}/> } */}
          {/* {openCertificateModel && <IssueCertificateModal closeCertificateModal={setOpenCertificateModel}/>} */}
          {openStatusModel && (
            <StatusLogModal
              closeStatusModal={setOpenStatusModel}
              formId={formId}
            />
          )}
          {openScheduleInspectionModel && (
            <ScheduleInspectionModal
              closeSchedule={setOpenSheduleInspectionModel}
              otherInfo={otherInfo}
            />
          )}
        </div>
      </div>

      {/* {onSubmit && (
        <CommonModal>
          <p className="text-secondary text-2xl text-semibold font-medium text-center">
            Are you sure, do you want to submit?
          </p>

          <div className="flex flex-row justify-center w-full py-4 gap-5">
            <div
              className="border border-primary bg-primary py-3 px-8 rounded-[4px] cursor-pointer items-center"
              onClick={() => setOnSubmit(false)}
            >
              No
            </div>
            <div
              className="bg-primary-900 py-3 rounded-[4px] px-8 text-white items-center gap-3 border border-primary py-3 px-7 cursor-pointer"
              onClick={() => handleSubmit()}
            >
              Yes! Submit
            </div>
          </div>
        </CommonModal>
      )} */}
    </>
  );
}

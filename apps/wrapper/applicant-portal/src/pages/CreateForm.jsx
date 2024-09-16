import React, { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import XMLParser from "react-xml-parser";

import {
  FaAngleRight,
  FaArrowLeft,
  FaFileDownload,
  FaDownload,
  FaRegTimesCircle,
} from "react-icons/fa";

import {
  getCookie,
  getFromLocalForage,
  setToLocalForage,
  updateFormData,
  getSpecificDataFromForage,
  removeAllFromLocalForage,
} from "./../forms";

import APPLICANT_ROUTE_MAP from "../routes/ApplicantRoute";
import { setCookie,  } from "../utils";
import { Button, Card } from "../components";
import CommonModal from "../Modal";
import Toast from "../components/Toast";
import "./loading.css";

import { getFormData, base64ToPdf, getLocalTimeInISOFormat } from "../api";
import {
  getPrefillXML,
  saveFormSubmission,
  getFormURI,
  updateFormSubmission,
} from "../api/formApi";
import { generate_uuidv4 } from "../utils";
import { applicantService } from "../services";

const ENKETO_URL = process.env.REACT_APP_ENKETO_URL;

const CreateForm = (props) => {
  const navigate = useNavigate();

  let { formName, formId, applicantStatus } = useParams();
  let [encodedFormURI, setEncodedFormURI] = useState("");
  let [paymentDetails,setPaymentDetails] = useState("")
  let [onFormSuccessData, setOnFormSuccessData] = useState(undefined);
  let [formDataNoc, setFormDataNoc] = useState({});
  let [onFormFailureData, setOnFormFailureData] = useState(undefined);
  let [isDownloading, setIsDownloading] = useState(false);
  let [previewModal, setPreviewModal] = useState(false);
  let previewFlag = false;

  // Spinner Element
  const spinner = document.getElementById("backdrop");

  const [assData, setData] = useState({
    district: "",
    instituteName: "",
    nursing: "",
    paramedical: "",
    type: "",
    latitude: null,
    longitude: null,
  });
  const [onSubmit, setOnSubmit] = useState(false);

  const { userRepresentation } = getCookie("userData");
  const userId = userRepresentation?.id;
  const instituteDetails = getCookie("institutes");

  let formData = {};

  const formSpec = {
    skipOnSuccessMessage: true,
    prefill: {},
    submissionURL: "",
    name: formName,
    successCheck: "async (formData) => { return true; }",
    onSuccess: {
      notificationMessage: "Form submitted successfully",
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
    formId: formId,
  };

  const [toast, setToast] = useState({
    toastOpen: false,
    toastMsg: "",
    toastType: "",
  });

  const startingForm = formSpec.start;
  const [encodedFormSpec, setEncodedFormSpec] = useState(
    encodeURI(JSON.stringify(formSpec?.formId))
  );

  const fetchFormData = async () => {
    let formData = {};

    let data = await getFromLocalForage(
      `${userId}_${formName}_${new Date().toISOString().split("T")[0]}`
    );

    if (data) {
      formData = data;
    } else {
      if (formId) {
        const postData = { form_id: formId };
        const res = await getFormData(postData);
        formData = res?.data?.form_submissions[0];
        setPaymentDetails(formData?.payment_status)
        setFormDataNoc(formData);
      }
    }

    let fileGCPPath =
      process.env.REACT_APP_GCP_AFFILIATION_LINK + formName + ".xml";

    let formURI = await getPrefillXML(
      `${fileGCPPath}`,
      formSpec.onSuccess,
      formData?.formData || formData?.form_data,
      formData?.imageUrls
    );
    setEncodedFormURI(formURI);
  };

  const afterFormSubmit = async (e) => {
    const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;

    try {
      const { nextForm, formData, onSuccessData, onFailureData } = data;
      if (data?.state === "ON_FORM_SUCCESS_COMPLETED") {
        if (!previewFlag) {
          fetchFormData();
          handleRenderPreview();
        } else {
          handleSubmit();
        }
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
      console.log(e);
    }
  };

  const handleRenderPreview = () => {
    setPreviewModal(true);
    previewFlag = true;
    setTimeout(() => {
      const iframeElem = document.getElementById("preview-enketo-form");
      if (window.location.host.includes("localhost")) {
        return;
      }
      let iframeContent =
        iframeElem?.contentDocument || iframeElem?.contentWindow.document;
      if (!iframeContent) return;
      let section = iframeContent?.getElementsByClassName("or-group");
      if (!section) return;
      for (var i = 0; i < section?.length; i++) {
        var inputElements = section[i].querySelectorAll("input");
        inputElements.forEach((input) => {
          input.disabled = true;
        });
      }
      iframeContent.getElementById("save-draft").style.display = "none";
    }, 1500);
  };

  const handleSubmit = async () => {
    const updatedFormData = await updateFormData(formSpec.start, userId);
    const course_details = await getSpecificDataFromForage("course_details");

    setTimeout(() => {
      console.log("updatedFormData - ", updatedFormData);
    }, 1000);

    const common_payload = {
      form_data: updatedFormData,
      assessment_type: "applicant",
      form_name: formName,
      submission_status: true,
      round: course_details?.form?.round,
      course_type: course_details?.course_type,
      course_level: course_details?.course_level,
      course_id: course_details?.course_id,
    };

    console.log("applicantStatus - ", applicantStatus);

    if (!applicantStatus) {
      await saveFormSubmission({
        schedule_id: null,
        assessor_id: null,
        applicant_id: instituteDetails?.[0]?.id,
        submitted_on: new Date().toJSON().slice(0, 10),
        form_status: "Application Submitted",
        ...common_payload,
      });
    } else {
      await updateFormSubmission({
        form_id: formId,
        updated_at: getLocalTimeInISOFormat(),
        form_status: "Resubmitted",
        ...common_payload,
      });
    }

    // Delete the form and course details data from the Local Forage
    removeAllFromLocalForage();

    setOnSubmit(false);
    setToast((prevState) => ({
      ...prevState,
      toastOpen: true,
      toastMsg: "Form Submitted Successfully!.",
      toastType: "success",
    }));

    setTimeout(
      () =>
        setToast((prevState) => ({
          ...prevState,
          toastOpen: false,
          toastMsg: "",
          toastType: "",
        })),
      1500
    );

    setTimeout(
      () => navigate(`${APPLICANT_ROUTE_MAP.dashboardModule.my_applications}`),
      1500
    );
  };

  const handleDownloadNocOrCertificate = () => {
    if (formDataNoc.round == 1) {
      window.open(formDataNoc?.noc_Path, "_blank");
    } else {
      window.open(formDataNoc?.certificate_Path, "_blank");
    }
  };

  const handleFormEvents = async (startingForm, afterFormSubmit, e) => {
    if (typeof e.data === "string" && e.data.includes("webpackHot")) {
      return;
    }

    if (
      ENKETO_URL === e.origin + "/enketo" &&
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

  const handleGoBack = () => {
    navigate(`${APPLICANT_ROUTE_MAP.dashboardModule.my_applications}`);
  };

  const handlePayment = async () => {
    // setcookies here
    setCookie(
      "formId",formId
    );
    const instituteDetails = getCookie("institutes");
    const instituteId = instituteDetails?.[0]?.id;
    const postData = {
      endpoint: "https://eazypayuat.icicibank.com/EazyPG",
      returnUrl: "https://payment.uphrh.in/api/v1/user/payment",
      paymode: "9",
      secret: "",
      merchantId: "600547",
      mandatoryFields: {
        referenceNo: generate_uuidv4(),
        submerchantId: "45",
        transactionAmount: "10",
        invoiceId: "x1",
        invoiceDate: "x",
        invoiceTime: "x",
        merchantId: "x",
        payerType: "affiliation",
        payerId: `${instituteId}`,
        transactionId: "x",
        transactionDate: "x",
        transactionTime: "x",
        transactionStatus: "x",
        refundId: "x",
        refundDate: "x",
        refundTime: "x",
        refundStatus: "x",
        module: "affiliation"
      },
      optionalFields: "affiliation",
    };
    try {
      const paymentRes = await applicantService.initiatePayment(postData);
      await window.open(paymentRes?.data?.redirectUrl);
    } catch (error) {}
  };


  const handleFormDownload = async () => {
    try {
      setIsDownloading(true);
      const formUrl = `${ENKETO_URL}/preview?formSpec=${encodeURI(
        JSON.stringify(formSpec)
      )}&xform=${encodedFormURI}&userId=${userId}`;
      const res = await base64ToPdf(formUrl);

      const linkSource = `data:application/pdf;base64,${res.data}`;
      const downloadLink = document.createElement("a");
      const fileName = "enketo_form.pdf";
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.target = window.safari ? "" : "_blank";
      downloadLink.click();
      setIsDownloading(false);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIframeLoaded = () => {
    if (spinner) {
      spinner.style.display = "none";
    }

    if (window.location.host.includes("applicant.upsmfac")) {
      const iframeElem = document.getElementById("enketo-applicant-form");
      var iframeContent =
        iframeElem?.contentDocument || iframeElem?.contentWindow.document;
      if (!iframeContent) return;
      if (applicantStatus && applicantStatus?.toLowerCase() !== "returned") {
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
  };

  useEffect(() => {
    fetchFormData();
    bindEventListener();

    if (spinner) {
      spinner.style.display = "flex";
    }

    setTimeout(() => {
      checkIframeLoaded();
    }, 2500);

    // To clean all variables
    return () => {
      setEncodedFormURI("");
      setOnFormSuccessData(undefined);
      setFormDataNoc({});
      setOnFormFailureData(undefined);
      setIsDownloading(false);
      setPreviewModal(false);
      previewFlag = false;
      removeAllFromLocalForage();
      console.log("Create form is closed!");
    };
  }, []);

  return (
    <div>
      {toast.toastOpen && (
        <Toast toastMsg={toast.toastMsg} toastType={toast.toastType} />
      )}
      <div className="h-[48px] bg-white drop-shadow-sm">
        <div className="container mx-auto px-3 py-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={APPLICANT_ROUTE_MAP.dashboardModule.my_applications}>
              <div className="text-primary-400 flex flex-row gap-2">
                <div className="flex items-center">
                  <FaArrowLeft className="text-[16px]" />
                </div>
                My Applications
              </div>
            </Link>
            <FaAngleRight className="text-[16px]" />
            <span className="text-gray-500">Create form</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-3 min-h-[40vh]">
        <div className="flex flex-row justify-between">
          <div className="flex flex-grow gap-3 justify-end">
            <button
              onClick={handleGoBack}
              className="bg-gray-100 py-2 mb-8 font-medium rounded-[4px] px-2 text-blue-900 border border-gray-500 flex flex-row items-center gap-3"
            >
              Back to my application
            </button>

            <button
              onClick={handleDownloadNocOrCertificate}
              disabled={formData.form_status !== "Approved" ? true : false}
              className={`${
                formData.form_status !== "Approved"
                  ? "cursor-not-allowed border border-gray-500 bg-white rounded-[4px] text-gray-200 px-2 h-[44px]"
                  : "border border-blue-900 bg-blue-900 text-white rounded-[4px] px-2 h-[44px]"
              }`}
            >
              Download NOC/Certificate
            </button>
            <button
          className={`${
            paymentDetails === "Pending"
              ? "border border-blue-900 bg-blue-900 text-white rounded-[4px] px-2 h-[44px]"
              : "cursor-not-allowed border border-gray-500 bg-white rounded-[4px] text-gray-200 px-2 h-[44px]"
          }`}
          disabled={paymentDetails === "Pending" ? false : true}
          onClick={handlePayment}
          
        >Pay</button>
          </div>
        </div>

        <Card moreClass="shadow-md">
          <div className="flex flex-col gap-5">
            <div className="flex flex-grow gap-3 justify-end">
              <button
                className={`bg-primary-900 py-3 font-medium rounded-[4px] px-6 text-white flex flex-row items-center gap-3 ${
                  isDownloading ? "cursor-not-allowed" : ""
                }  `}
                onClick={handleFormDownload}
                disabled={isDownloading}
              >
                <FaFileDownload />
                <span>{isDownloading ? "Downloading..." : "Download"}</span>
              </button>
            </div>
            <div className="flex">
              <iframe
                id="enketo-applicant-form"
                title="form"
                src={`${ENKETO_URL}/preview?formSpec=${encodeURI(
                  JSON.stringify(formSpec)
                )}&xform=${encodedFormURI}&userId=${userId}`}
                style={{ minHeight: "100vh", width: "100%" }}
              />
            </div>
          </div>
        </Card>

        {onSubmit && (
          <CommonModal>
            <p className="text-secondary text-2xl text-semibold font-medium text-center">
              Once form is submitted, it cannot be modified! Are you sure, do
              you want to submit?
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
        )}

        {previewModal && (
          <CommonModal
            moreStyles={{
              padding: "1rem",
              maxWidth: "95%",
              minWidth: "90%",
              maxHeight: "90%",
            }}
          >
            <div className="flex flex-row w-full items-center cursor-pointer gap-4">
              <div className="flex flex-grow font-bold text-xl">
                Preview and Submit form
              </div>
              <div className="flex flex-grow gap-3 justify-end items-center">
                {!isDownloading && (
                  <div onClick={handleFormDownload}>
                    <FaDownload className="text-[36px]" />
                  </div>
                )}
                {isDownloading && <div className="loader"></div>}

                <FaRegTimesCircle
                  className="text-[36px]"
                  onClick={() => {
                    setPreviewModal(false);
                    previewFlag = false;
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col justify-center w-full py-4">
              <iframe
                title="form"
                id="preview-enketo-form"
                src={`${ENKETO_URL}/preview?formSpec=${encodeURI(
                  JSON.stringify(formSpec)
                )}&xform=${encodedFormURI}&userId=${userId}`}
                style={{ height: "80vh", width: "100%" }}
              />
            </div>
          </CommonModal>
        )}
      </div>
    </div>
  );
};

export default CreateForm;

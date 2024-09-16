import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AiOutlineClose, AiOutlineCheck } from "react-icons/ai";
import { FaAngleRight } from "react-icons/fa";

import { Card, Button } from "./../../components";

import NocModal from "./NocModal";
import StatusLogModal from "./StatusLogModal";
import IssueNocModal from "./IssueNocModal.jsx";
import RejectNocModal from "./RejectNocModal";
import Sidebar from "../../components/Sidebar";

import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import { getFormData } from "../../api";
import { getPrefillXML } from "./../../api/formApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ContextAPI } from "../../utils/ContextAPI";

const ENKETO_URL = process.env.REACT_APP_ENKETO_URL;
const GCP_URL = process.env.REACT_APP_GCP_AFFILIATION_LINK;

export default function ApplicationPage({
  closeModal,
  closeRejectModal,
  closeStatusModal,
  closeCertificateModal,
}) {
  const reportTemplateRef = useRef(null);
  const [formStatus, setFormStatus] = useState("");
  const [formDataFromApi, setFormDataFromApi] = useState();
  const [rejectModel, setRejectModel] = useState(false);
  const [rejectStatus, setRejectStatus] = useState(false);
  const [openModel, setOpenModel] = useState(false);
  const [openStatusModel, setOpenStatusModel] = useState(false);
  const [openIssueNocModel, setOpenIssueNocModel] = useState(false);
  const [encodedFormURI, setEncodedFormURI] = useState("");
  let { formName, formId, instituteName, round } = useParams();
  let [instituteNameModal, setInstituteNameModal] = useState(instituteName);
  let [selectRound, setSelectRound] = useState(round);
  const { setSpinner } = useContext(ContextAPI);

  const userId = "427d473d-d8ea-4bb3-b317-f230f1c9b2f7";
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
  };

  const fetchFormData = async () => {
    const postData = { form_id: formId };
    try {
      // setSpinner(true);
      const res = await getFormData(postData);
      const formData = res.data.form_submissions[0];
      setFormDataFromApi(res.data.form_submissions[0]);
      console.log("formData - ", formData);
      const statusOfForm = formData?.form_status;
      setFormStatus(statusOfForm);
      const form_path = `${GCP_URL}${formData?.form_name}.xml`;

      let formURI = await getPrefillXML(
        `${form_path}`,
        "",
        formData.form_data,
        formData.imageUrls
      );
      setEncodedFormURI(formURI);
    } catch (error) {
      console.log(error);
    } finally {
      // setSpinner(false);
    }
  };

  const checkIframeLoaded = () => {
    if (window.location.host.includes("regulator.upsmfac")) {
      const iframeElem = document.getElementById("enketo_OGA_preview");
      var iframeContent =
        iframeElem?.contentDocument || iframeElem?.contentWindow.document;
      if (!iframeContent) return;

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
    setTimeout(() => {
      checkIframeLoaded();
    }, 2500);
  }, []);

  return (
    <>
      {/* Breadcrum */}
      {/* <Breadcrumb data={breadCrumbData} /> */}

      <div className="h-[48px] bg-white flex justify-start drop-shadow-sm">
        <div className="container mx-auto flex px-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={ADMIN_ROUTE_MAP.adminModule.onGroundInspection.home}>
              <span className="text-primary-400">
                On Ground Inspection - All applications
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
            <div className="flex grow justify-start items-center"></div>
            <div className="flex grow gap-4 justify-end items-center">
              <button
                onClick={() => setRejectModel(true)}
                disabled={
                  formStatus == "Approved" ||
                  formStatus == "Rejected" ||
                  rejectStatus
                    ? true
                    : false
                }
                className={
                  formStatus == "Approved" ||
                  formStatus == "Rejected" ||
                  rejectStatus
                    ? "invisible cursor-not-allowed flex flex-wrap items-center justify-center gap-2 border border-gray-500 text-gray-500 bg-white w-[140px] h-[40px] font-medium rounded-[4px]"
                    : "flex flex-wrap items-center justify-center gap-2 border border-gray-500 text-gray-500 bg-white w-[140px] h-[40px] font-medium rounded-[4px]"
                }
              >
                Reject
                <span>
                  <AiOutlineClose />
                </span>
              </button>
              <button
                onClick={() => setOpenIssueNocModel(true)}
                disabled={
                  formStatus == "Approved" ||
                  formStatus == "Rejected" ||
                  rejectStatus
                    ? true
                    : false
                }
                className={
                  formStatus == "Approved" ||
                  formStatus == "Rejected" ||
                  rejectStatus
                    ? "invisible cursor-not-allowed flex flex-wrap items-center justify-center gap-2 border border-gray-500 text-gray-500 bg-white w-[140px] h-[40px] font-medium rounded-[4px]"
                    : "flex flex-wrap items-center justify-center gap-2 border border-gray-500 text-gray-500 bg-white w-[140px] h-[40px] font-medium rounded-[4px]"
                }
              >
                Approve
                <span>
                  <AiOutlineCheck />
                </span>
              </button>
              <div
                className={
                  formStatus == "Approved" ||
                  formStatus == "Rejected" ||
                  rejectStatus
                    ? "invisible"
                    : "inline-block h-[40px] min-h-[1em] w-0.5 border opacity-100 dark:opacity-50"
                }
              ></div>
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
                      formStatus.toLowerCase() === "in progress"
                        ? "text-yellow-400"
                        : formStatus.toLowerCase() === "resubmitted"
                        ? "text-orange-400"
                        : formStatus.toLowerCase() === "inspection scheduled"
                        ? "text-blue-400"
                        : formStatus.toLowerCase() === "application submitted"
                        ? "text-green-400"
                        : formStatus.toLowerCase() === "na"
                        ? "text-red-400"
                        : formStatus.toLowerCase() === "oga completed"
                        ? "text-purple-400"
                        : formStatus.toLowerCase() === "approved"
                        ? "text-teal-400"
                        : formStatus.toLowerCase() === "rejected"
                        ? "text-pink-400"
                        : "text-white"
                    }`}
                  >
                    {" "}
                    Status: {formStatus}
                  </h4>
                </div>
              </Card>
              <Card moreClass="shadow-md">
                <iframe
                  id="enketo_OGA_preview"
                  title="form"
                  src={`${ENKETO_URL}/preview?formSpec=${encodeURI(
                    JSON.stringify(formSpec)
                  )}&xform=${encodedFormURI}&userId=${userId}`}
                  style={{ minHeight: "100vh", width: "100%" }}
                  ref={reportTemplateRef}
                />
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* {openModel && <NocModal closeModal={setOpenModel}  setOpenIssueNocModel={setOpenIssueNocModel} setToast={setToast} />} */}
      {rejectModel && (
        <RejectNocModal
          closeRejectModal={setRejectModel}
          setRejectStatus={setRejectStatus}
          formId={formId}
        />
      )}
      {/* {openCertificateModel && <IssueCertificateModal closeCertificateModal={setOpenCertificateModel}/>} */}
      {openStatusModel && (
        <StatusLogModal closeStatusModal={setOpenStatusModel} formId={formId} />
      )}
      {openIssueNocModel && (
        <IssueNocModal
          selectRound={round}
          // setRejectStatus={setRejectStatus}
          selectInstituteName={instituteName}
          formId={formId}
          setOpenIssueNocModel={setOpenIssueNocModel}
        />
      )}
    </>
  );
}

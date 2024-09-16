import React, { useEffect, useState } from "react";
import { Select, Option } from "@material-tailwind/react";
import { Link } from "react-router-dom";
import "./UploadForm.css";

import { HiOutlineInformationCircle } from "react-icons/hi";
import { Card, Button, Label, Input } from "./../../components";
import { MdEventBusy } from "react-icons/md";
import axios from "axios";
import { getPrefillXML } from "../../api/formApi";
import { getCookie } from "../../utils";

const ENKETO_URL = process.env.REACT_APP_ENKETO_URL;

const UploadForm = ({
  setFormStage,
  handleFile,
  xmlData,
  formData,
  formStatus,
}) => {
  const [fileName, setFileName] = useState("");
  const hiddenFileInput = React.useRef(null);
  const [encodedFormURI, setEncodedFormURI] = useState("");
  let formURI = "";

  const handleClick = (e) => {
    hiddenFileInput.current.click();
  };

  const handleChange = (e) => {
    console.log("e.target.files",e.target.files[0])
    const fileUploaded = e?.target?.files[0];    
      setFileName(
      fileUploaded.name.substring(0, fileUploaded.name.lastIndexOf("."))
    );
    handleFile(fileUploaded);
  };

  const downloadXmlFile = () => {
    var filename = `${fileName}.xml`;
    var element = document.createElement("a");
    var file = new Blob([xmlData], { type: "text/plain" });

    element.setAttribute("href", window.URL.createObjectURL(file));
    element.setAttribute("download", filename);

    element.dataset.downloadurl = [
      "text/plain",
      element.download,
      element.href,
    ].join(":");
    element.draggable = true;
    element.classList.add("dragout");

    element.click();
  };

  const user_details = getCookie("userData");
  const userId = user_details?.userRepresentation?.id;
  const formSpec = {
    skipOnSuccessMessage: true,
    prefill: {},
    submissionURL: "",
    name: formData?.file_name,
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
    const res = await axios.get(formData?.path, { responseType: "text" });
    console.log("res",res)
    formURI = await getPrefillXML(
      formData?.path,
      formSpec.onSuccess
      // res.data //tried passing xmlData here
    );
    setEncodedFormURI(formURI);
  };

  const handleFormPreview = async () => {
    await fetchFormData();
    let src = `${ENKETO_URL}/preview?formSpec=${encodeURI(
      JSON.stringify(formSpec)
    )}&xform=${formURI}&userId=${userId}`;
    window.open(src, "_blank");
  };

  useEffect(() => {
    console.log(formData);
  }, [formData]);

  return (
    <>
      <div className="container">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-6">
            <div className=" w-[30%] h-full bg-white">
              <div className="flex flex-col">
                <div className="flex flex-row gap-4 p-6 text-2xl font-semibold border-b-gray-400 border-b-[2px]">
                  <span className="mt-1">
                    <HiOutlineInformationCircle />
                  </span>
                  <h1>Instruction</h1>
                </div>

                <div className="inst_list flex flex-col p-6">
                  <ul className="flex flex-col gap-3">
                    <li>Download ODK template (in .xlsx format)</li>
                    <li>
                      Create a new Form by referring{" "}
                      <a
                        className="text-primary-600"
                        href="https://docs.getodk.org"
                        target="_blank"
                      >
                        https://docs.getodk.org
                      </a>
                    </li>
                    <li>Upload ODK file to get XML file</li>
                  </ul>
                </div>
                <div className="flex justify-center p-6">
                  <Link
                    to="/files/Template_Form_Creation.xlsx"
                    target="_blank"
                    download
                  >
                    <Button
                      moreClass="text-primary-600 border border-primary-600 bg-white"
                      text="Download Template"
                    />
                  </Link>
                </div>
              </div>
            </div>

            <div className="w-full bg-white p-8">
              <div className="flex flex-col h-[48vh] gap-8 justify-between">
                <div className="font-semibold text-xl">Upload ODK</div>
                <div className="flex flex-row m-auto">
                  <input
                    type="file"
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    ref={hiddenFileInput}
                    onChange={handleChange}
                    style={{ display: "none" }}
                  />
                  <Button
                    moreClass={`${
                      formStatus == "Published" || formStatus == "Unpublished"
                        ? "cursor-not-allowed border w-full px-6 border-gray-500 bg-white text-gray-500 "
                        : "text-white w-full px-6"
                    }`}
                    text="Browse file to upload"
                    onClick={handleClick}
                    otherProps={{
                      disabled:
                        formStatus == "Published" || formStatus == "Unpublished"
                          ? true
                          : false,
                    }}
                  />
                  {formData?.path && (
                    <>
                      <div className="text-black px-6 flex items-center">
                        OR
                      </div>
                      <Button
                        moreClass="text-white w-full px-6"
                        text="Form Preview"
                        onClick={handleFormPreview}
                      />
                    </>
                  )}
                </div>
                <div className="">
                  <Button
                    moreClass="text-gray-500 w-1/6 bg-white border border-gray-500"
                    text="Back"
                    onClick={() => setFormStage(1)}
                  ></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadForm;

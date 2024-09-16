import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, ApplicationCard, FormCard } from "../components";
import APPLICANT_ROUTE_MAP from "../routes/ApplicantRoute";
import { applicationService, formService } from "../services";
import { getCookie } from "../utils";
import { setToLocalForage } from "../forms";

const MyApplications = () => {
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [applications, setApplications] = useState([]);
  const [availableForms, setAvailableForms] = useState([]);
  const instituteDetails = getCookie("institutes");
  const navigate = useNavigate();

  useEffect(() => {
    getApplications();
    getAvailableForms();
  }, []);

  const getApplications = async () => {
    if (!instituteDetails || !instituteDetails?.length) {
      return;
    }

    setLoadingApplications(true);
    const requestPayload = { applicant_id: instituteDetails?.[0].id || 11 };
    const applicationsResponse = await applicationService.getData(
      requestPayload
    );

    if (applicationsResponse?.data?.form_submissions) {
      setApplications(applicationsResponse?.data?.form_submissions);
    }
    setLoadingApplications(false);
  };

  const getAvailableForms = async () => {
    if (!instituteDetails || !instituteDetails?.length) {
      return;
    }

    setLoadingForms(true);
    const requestPayload = {
      condition: {
        assignee: {
          _eq: "applicant",
        },
      },
    };

    const formsResponse = await formService.getData(requestPayload);
    if (formsResponse?.data?.courses) {
      setAvailableForms(formsResponse?.data?.courses.slice(0, 4));
    }
    setLoadingForms(false);
  };

  const handleViewApplicationHandler = (formObj) => {
    navigate(
      `${APPLICANT_ROUTE_MAP.dashboardModule.createForm}/${
        formObj?.form_name
      }/${formObj?.form_id}/${formObj.form_status?.toLowerCase()}`
    );
  };

  const handleApplyFormHandler = async (obj) => {
    await setToLocalForage("course_details", obj);
    let form_obj = obj?.formObject;
    if (typeof form_obj === "string") {
      form_obj = JSON.parse(form_obj);
    }
    let file_name = form_obj[0].name;
    file_name = file_name.substr(0, file_name.lastIndexOf("."));
    navigate(`${APPLICANT_ROUTE_MAP.dashboardModule.createForm}/${file_name}`);
  };

  return (
    <>
      <div className="h-[48px] bg-white drop-shadow-sm">
        <div className="container mx-auto px-3 py-3">
          <div className="text-primary-400 font-bold">My Application</div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-3 min-h-[40vh]">
        <div className="flex flex-col gap-3">
          <div className="text-xl font-semibold">My Applications</div>
          {!loadingApplications && applications.length === 0 && (
            <div className="text-sm">
              There is no active applications. Select one from the below list to
              apply.
            </div>
          )}
          {!loadingApplications && applications.length > 0 && (
            <div className="flex flex-wrap">
              {applications.map((application) => (
                <ApplicationCard
                  application={application}
                  key={application.form_id}
                  onView={handleViewApplicationHandler}
                />
              ))
          }
              {console.log("applications",applications)}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white drop-shadow-sm">
        <div className="container mx-auto px-3 py-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-row">
              <div className="flex grow">
                <div className="flex flex-col gap-3">
                  <div className="text-xl font-semibold">Application form</div>
                  {!loadingForms && availableForms.length === 0 && (
                    <div className="text-sm">There is no form available</div>
                  )}
                  {!loadingForms && availableForms.length > 0 && (
                    <div className="text-sm">
                      These are the available forms for you to apply. Click on
                      any of them to start filling
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                {!loadingForms && availableForms.length > 0 && (
                  <Link
                    to={APPLICANT_ROUTE_MAP.dashboardModule.all_applications}
                  >
                    <Button
                      moreClass="text-primary-500 font-bold uppercase border-gray-500"
                      style={{
                        backgroundColor: "#fff",
                        border: "1px solid #d1d5db",
                      }}
                      text="See all"
                    ></Button>
                  </Link>
                )}
              </div>
            </div>
            {!loadingForms && availableForms.length > 0 && (
              <div className="flex flex-wrap">
                {availableForms.map((form, index) => (
                  <FormCard
                    form={form}
                    key={index}
                    onApply={handleApplyFormHandler}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MyApplications;

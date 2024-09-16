import React, { useState, useEffect, useRef, useContext } from "react";
import { Stepper, Step } from "@material-tailwind/react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { GrDocumentPdf } from "react-icons/gr";
import { AiOutlineClose } from "react-icons/ai";
import { ContextAPI } from "../../utils/ContextAPI";

import Calendar from "react-calendar";
import Select from "react-select";
import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import "react-calendar/dist/Calendar.css";
import "./calendar.css";

import { Label, Button } from "../../components";
import {
  formatDate,
  getInitials,
  readableDate,
  getLocalTimeInISOFormat,
} from "../../utils/common";
import {
  getUsersForScheduling,
  getAllTheCourses,
  getScheduleAssessment,
  addInstituteCourse,
  registerEvent,
  updateFormStatus,
} from "../../api";

// import Toast from "../../components/Toast";

function ScheduleInspectionModal({ closeSchedule, otherInfo }) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [isLastStep, setIsLastStep] = React.useState(false);
  const [isFirstStep, setIsFirstStep] = React.useState(false);
  const { setSpinner, setToast } = useContext(ContextAPI);
  const { formId } = useParams();
  const navigate = useNavigate();
  const handleNext = () => !isLastStep && setActiveStep((cur) => cur + 1);
  const handlePrev = () => !isFirstStep && setActiveStep((cur) => cur - 1);

  // Common state variables...
  let selectInputRef = useRef();
  let selectAARef = useRef();
  const [payload, setPayload] = useState({});

  // Section 1, where active === 0
  const [OGAObject, setOGAObject] = useState({});
  const [selectedOGA, setSelectedOGA] = useState({});
  let [assistingAssessorList, setAssistingAssessorList] = useState([{}]);
  const [AAObject, setAAObject] = useState([]);
  const [selectedAA, setSelectedAA] = useState([]);
  const [assessorList, setAssessorList] = useState([]);

  // Section 2, where active === 1
  const [formList, setFormList] = useState([]);
  const [selectedFormList, setSelectedFormList] = useState([]);

  useEffect(() => {
    getTheCourses();
    handleOnChangeDate(new Date());
  }, []);

  const handleOnChangeDate = async (date) => {
    let tempDate = formatDate(date);

    setPayload((prevState) => ({ ...prevState, date: tempDate }));
    const postData = { todayDate: tempDate };
    try {
      setSpinner(true);
      const res = await getUsersForScheduling(postData);
      setAssessorList(
        res?.data?.assessors.map((item) => ({
          value: item.code,
          label: item.name,
          phonenumber: item.phonenumber,
          other: item,
        }))
      );
    } catch (error) {
      console.log(error);
    } finally {
      setSpinner(false);
    }
  };

  const handleSelectOGA = (e) => {
    setOGAObject(e);
  };

  const handleAssignOGA = () => {
    setSelectedOGA(OGAObject);
    setAssistingAssessorList(
      assessorList.filter((el) => {
        return el?.phonenumber !== OGAObject?.phonenumber;
      })
    );
  };

  const handleClearOGA = () => {
    setSelectedOGA({});
    setOGAObject({});
    selectInputRef.clearValue();
  };

  const handleSelectAA = (e) => {
    setAAObject(e);
  };

  // aa - Assisting assessor
  const handleClearAA = (aaObj) => {
    const newAA = selectedAA.filter(
      (obj) => obj.phonenumber !== aaObj.phonenumber
    );
    selectAARef.setValue(newAA);
    setSelectedAA(newAA);
  };

  const handleAddAA = () => {
    setSelectedAA(AAObject);
  };

  const getTheCourses = async () => {
    let payload = {
      course_type: otherInfo?.course_type,
      course_level: otherInfo?.course_level,
    };

    try {
      setSpinner(true);
      const res = await getAllTheCourses(payload);
      setFormList(
        res?.data?.courses?.map((item) => ({
          value: item.course_name,
          label: item.course_name,
          level: item.course_level,
          formObj: item.formObject,
          course_id: item.course_id,
        }))
      );
    } catch (error) {
      console.log(error);
    } finally {
      setSpinner(false);
    }
  };

  const handleFormSelection = (e) => {
    setSelectedFormList(e);
  };

  const handleScheduleAssessment = async () => {
    let coursesObj = selectedFormList.map((obj) => {
      let institute_form = {};
      institute_form.course_id = obj.course_id;
      institute_form.applicant_form_id = +formId;
      institute_form.institute_id = otherInfo?.instituteId;
      institute_form.assessment_date = payload?.date;
      return institute_form;
    });

    const postData = {
      institute_course: [
        {
          institute_id: otherInfo?.instituteId,
          institute_type: JSON.stringify([
            {
              courseType: otherInfo?.course_type,
              courseLevel: otherInfo.course_level,
            },
          ]),
        },
      ],
      institute_form: coursesObj,
    };

    const formData = {
      assessment_schedule: [
        {
          assessor_code: OGAObject.other.code,
          date: payload?.date,
          institute_id: otherInfo?.instituteId,
          assisstant_code: selectedAA?.[0]?.other?.code,
        },
      ],
    };

    try {
      setSpinner(true);
      const res = await getScheduleAssessment(formData);
      const addCourse = await addInstituteCourse(postData);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Inspection scheduled successfully!",
        toastType: "success",
      }));
      closeSchedule(false);

      registerEvent({
        created_date: getLocalTimeInISOFormat(),
        entity_id: otherInfo?.formId,
        entity_type: "form",
        event_name: "Inspection Scheduled",
        remarks: "Round 1 inspection scheduled",
      });

      updateFormStatus({
        form_id: otherInfo?.formId * 1,
        form_status: "Inspection Scheduled",
      });
      setTimeout(
        () => navigate(`${ADMIN_ROUTE_MAP.adminModule.desktopAnalysis.home}`),
        500
      );
    } catch (error) {
      let date = new Date(formData.assessment_schedule.date);
      if (error?.response?.data.code === "constraint-violation") {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg:
            "Inspection already scheduled for " + date.toDateString() + ".",
          toastType: "error",
        }));
      } else {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "Error occurred while scheduling inspection!",
          toastType: "error",
        }));
      }
    } finally {
      setSpinner(false);
    }
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center fixed inset-0 bg-opacity-24 z-10 backdrop-blur-sm">
        <div className="flex bg-white rounded-xl shadow-xl border border-gray-400 w-[900px] h-fit">
          <div className="flex flex-col w-full">
            <div className="flex p-4">
              <div className="flex flex-col items-center w-full">
                {/* <div className="w-[40%] p-3"> */}
                {/* <div
                  className="flex flex-col" */}
                {/* activeStep={activeStep}
                 isLastStep={(value) => setIsLastStep(value)}
                   isFirstStep={(value) => setIsFirstStep(value)} */}
                {/* > */}
                <div className="flex flex-row gap-2 items-center w-[40%] p-3">
                  <div
                    className={`${
                      activeStep == 1
                        ? "flex items-center bg-gray-300 text-white justify-center text-[18px] font-bold rounded-[50%] h-[48px] w-[48px] p-5"
                        : "flex items-center bg-blue-500 text-white justify-center text-[18px] font-bold rounded-[50%] h-[48px] w-[48px] p-5"
                    }`}
                    // className="flex items-center bg-blue-500 text-white justify-center text-[18px] font-bold rounded-[50%] h-[48px] w-[48px] p-5"
                  >
                    1
                  </div>
                  <span className="w-full h-0 border-t-[2px] border-gray-500"></span>
                  <div
                    className={`${
                      activeStep == 0
                        ? "flex items-center bg-gray-300 text-white justify-center text-[18px] font-bold rounded-[50%] h-[48px] w-[48px] p-5"
                        : "flex items-center bg-blue-500 text-white justify-center text-[18px] font-bold rounded-[50%] h-[48px] w-[48px] p-5"
                    }`}
                    // className="flex items-center text-white bg-blue-500 justify-center text-[18px] font-bold rounded-[50%] h-[48px] w-[48px] p-5"
                  >
                    2
                  </div>
                </div>

                {/* </div> */}
                {/* </div> */}
                {/* <div className="w-[60%] p-2"> */}
                <div className="flex flex-row w-[48%] justify-between">
                  <div className="flex font-semibold justify-center text-[#000]">
                    Schedule inspection
                  </div>
                  <div className="flex font-semibold justify-center text-[#000]">
                    Select the applications
                  </div>
                </div>
                {/* </div> */}
              </div>
            </div>

            <div className="flex flex-col p-4 border-t-gray-300 border-2 rounded-b-xl">
              <section>
                {activeStep === 0 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex text-xl font-semibold">
                      Schedule the inspection
                    </div>
                    <div className="flex flex-row gap-4">
                      <div className="flex flex-col gap-3 border-gray-400 border-[1px] rounded-md p-4">
                        <div className="flex flex-row gap-2 items-center">
                          <div className="flex justify-center items-center w-[28px] h-[28px] rounded-full bg-gray-300 border-1 border-gray-400 text-bold text-primary-500">
                            1
                          </div>
                          <Label
                            text="Select a date to select an assessor"
                            moreClass="text-[16px]"
                            required
                          ></Label>
                        </div>
                        <div className="no-absolute">
                          <Calendar
                            className="bg-blue-400 rounded-[8px]"
                            onChange={handleOnChangeDate}
                            minDate={new Date()}
                          />
                        </div>
                        <div className="font-medium">
                          Selected date : {readableDate(payload.date)}
                        </div>
                      </div>
                      <div className="flex flex-grow flex-col gap-4">
                        <div className="flex flex-col gap-3 flex-grow p-4 border-gray-400 border-[1px] rounded-md">
                          <div className="flex flex-row gap-2 items-center">
                            <div className="flex justify-center items-center w-[28px] h-[28px] rounded-full bg-gray-300 border-1 border-gray-400 text-bold text-primary-500">
                              2
                            </div>
                            <div className="font-medium">
                              <Label
                                text="Add on ground assessor"
                                moreClass="text-[16px]"
                                required
                              ></Label>
                            </div>
                          </div>
                          <div className="flex flex-row gap-3">
                            <Select
                              name="assessor_name"
                              label="Assessor Name"
                              onChange={handleSelectOGA}
                              options={assessorList}
                              ref={(ref) => {
                                selectInputRef = ref;
                              }}
                              isDisabled={selectedOGA.label ? true : false}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            ></Select>
                            <Button
                              onClick={() => handleAssignOGA()}
                              moreClass={`${
                                !selectedOGA?.label
                                  ? "border border-blue-400 bg-white text-blue-400 px-8 h-[44px]"
                                  : "cursor-not-allowed border border-gray-500 bg-white text-gray-500 px-8 h-[44px]"
                              }`}
                              text="Add"
                            ></Button>
                          </div>

                          {selectedOGA?.label && (
                            <>
                              <div className="bg-gray-100 items-center flex border border-gray-100 justify-between rounded-xl p-1">
                                <div className="gap-2 flex items-center">
                                  <span className="border-green-500 w-[36px] h-fit items-center bg-green-500 inline-flex justify-center gap-x-1.5 rounded-md px-2 py-2 text-sm font-semibold text-white-500 shadow-sm">
                                    {getInitials(selectedOGA?.label)}
                                  </span>
                                  <span className="font-semibold">
                                    {selectedOGA?.label}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleClearOGA()}
                                  className="justify-end flex"
                                >
                                  <AiOutlineClose />
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex flex-col flex-grow gap-3 p-4 border-gray-400 border-[1px] rounded-md">
                          <div className="flex flex-row gap-2 items-center">
                            <div className="flex justify-center items-center w-[28px] h-[28px] rounded-full bg-gray-300 border-1 border-gray-400 text-bold text-primary-500">
                              3
                            </div>
                            <div className="flex flex-row gap-1 items-center">
                              <Label
                                text="Add an assisting assessor"
                                moreClass="text-[16px] font-medium"
                              ></Label>

                              <span className="text-[11px]">
                                (only one member allowed)
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-row gap-3">
                            <Select
                              isMulti
                              isOptionDisabled={() => AAObject.length >= 1}
                              name="assisting_assessor"
                              label="Assisting Assessor/s"
                              ref={(ref) => {
                                selectAARef = ref;
                              }}
                              onChange={handleSelectAA}
                              options={assistingAssessorList}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            />

                            <Button
                              onClick={() => handleAddAA()}
                              moreClass={`border border-blue-400 bg-white text-blue-400 px-8 h-[44px]`}
                              text="Add"
                            ></Button>
                          </div>

                          <div className="flex flex-col gap-3 max-h-[120px] overflow-auto">
                            {selectedAA.map((aa) => {
                              return (
                                <div
                                  className="bg-gray-100 items-center flex border border-gray-100 justify-between rounded-xl p-1"
                                  key={aa.phonenumber}
                                >
                                  <div className="gap-2 flex items-center">
                                    <span className="border-green-500 w-[36px] h-3/4 items-center bg-green-500 inline-flex justify-center gap-x-1.5 rounded-md px-2 py-2 text-sm font-semibold text-white-500 shadow-sm">
                                      {getInitials(aa.label)}
                                    </span>
                                    <span className="font-semibold">
                                      {aa.label}
                                    </span>
                                  </div>
                                  <button
                                    className="justify-end flex"
                                    onClick={() => {
                                      handleClearAA(aa);
                                    }}
                                  >
                                    <AiOutlineClose />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section>
                {activeStep === 1 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex text-xl font-semibold">
                      Select the applications
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex flex-col rounded-xl border border-gray-400 p-4 gap-3">
                        <Label
                          htmlFor={"institute_name"}
                          required
                          text="Form filled by the institute"
                          moreClass="text-[16px]"
                        ></Label>

                        <div className="bg-gray-100 items-center flex gap-4 border border-gray-100 rounded-md">
                          <span className="font-semibold p-2">
                            {otherInfo?.course_type} - {otherInfo?.course_level}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 rounded-xl border border-gray-400 p-4">
                        <Label
                          required
                          text="Select forms"
                          moreClass="text-[16px]"
                        ></Label>

                        <div className="flex flex-row">
                          <Select
                            isMulti
                            key={"form_name"}
                            name="form_name"
                            label="Form Name"
                            onChange={handleFormSelection}
                            options={formList}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          />
                        </div>

                        <div className="flex flex-col gap-3 max-h-[120px] overflow-auto">
                          {selectedFormList.map((form, index) => {
                            return (
                              <div
                                className="flex items-center bg-gray-100 border border-gray-100 rounded-md font-semibold"
                                key={index}
                              >
                                <div className="flex w-[36px] h-[36px] items-center justify-center">
                                  <GrDocumentPdf />
                                </div>
                                <div>{form.label}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <footer className="mt-4">
                {activeStep === 0 && (
                  <div className="flex flex-row justify-between w-full">
                    <Button
                      onClick={() => {
                        closeSchedule(false);
                      }}
                      moreClass={`px-8 border border-primary-500 bg-white text-primary-500`}
                      text="Close"
                    ></Button>
                    <Button
                      onClick={handleNext}
                      otherProps={{
                        disabled: selectedOGA?.value ? false : true,
                      }}
                      moreClass={`${
                        selectedOGA?.value
                          ? "px-8 text-white"
                          : "cursor-not-allowed border border-gray-500 bg-white text-gray-500 px-8 h-[44px]"
                      }`}
                      text="Next"
                    ></Button>
                  </div>
                )}
                {activeStep === 1 && (
                  <div className="flex flex-row w-full justify-between">
                    <Button
                      onClick={handlePrev}
                      moreClass={`px-8 border border-primary-500 bg-white text-primary-500`}
                      text="Previous"
                    ></Button>
                    <Button
                      onClick={handleScheduleAssessment}
                      otherProps={{
                        disabled:
                          selectedOGA?.value && selectedFormList[0]?.value
                            ? false
                            : true,
                      }}
                      moreClass={`${
                        selectedOGA?.value && selectedFormList[0]?.value
                          ? "px-8 text-white"
                          : "cursor-not-allowed border border-gray-500 bg-white text-gray-500 px-8 h-[44px]"
                      }`}
                      text="Submit"
                    ></Button>
                  </div>
                )}
              </footer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ScheduleInspectionModal;

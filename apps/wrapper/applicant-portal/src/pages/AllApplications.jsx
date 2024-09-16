import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { FormCard } from "../components";
import { useForm } from "react-hook-form";
import { setToLocalForage } from "../forms";

import { Select, Option } from "@material-tailwind/react";

import { FaAngleRight } from "react-icons/fa";
import { MdFilterList } from "react-icons/md";

import { formService } from "../services";
import { getCookie } from "../utils";
import APPLICANT_ROUTE_MAP from "../routes/ApplicantRoute";

const AllApplications = () => {
  const [loadingForms, setLoadingForms] = useState(false);
  const [value, setValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState("false");
  const [formData, setFormData] = useState({
    condition: {
      assignee: {
        _eq: "applicant",
      },
    },
  });
  const [availableForms, setAvailableForms] = useState([]);
  const instituteDetails = getCookie("institutes");
  const navigate = useNavigate();

  const handleChange = (name, value) => {
    setFormData({
      condition: {
        ...formData.condition,
        [name]: {
          _eq: value,
        },
        assignee: {
          _eq: "applicant",
        },
      },
    });
  };

  const handleSearch = async (value) => {
    setValue(value);
    setIsSearchOpen(value ? true : false);
    // setPaginationInfo((prevState) => ({
    //   ...prevState,
    //   offsetNo: 0,
    // }));

    const postData = { searchString: `%${value}%` };
    if (value.trim() == "" || value.trim().length >= 3) {
      let formsResponse = await formService.searchForm(postData);
      if (formsResponse?.data?.courses) {
        setAvailableForms(formsResponse?.data?.courses);
      }
    }
  };

  const getAvailableForms = async () => {
    const formsResponse = await formService.getData(formData);
    if (formsResponse?.data?.courses) {
      setAvailableForms(formsResponse?.data?.courses);
    }
    setLoadingForms(false);
  };

  const applyFormHandler = async (obj) => {
    await setToLocalForage("course_details", obj);
    let form_obj = obj?.formObject;
    if (typeof form_obj === "string") {
      form_obj = JSON.parse(form_obj);
    }
    let file_name = form_obj[0].name;
    file_name = file_name.substr(0, file_name.lastIndexOf("."));
    navigate(`${APPLICANT_ROUTE_MAP.dashboardModule.createForm}/${file_name}`);
  };

  const handleClearFilter = () => {
    setFormData({
      condition: {
        assignee: {
          _eq: "applicant",
        },
      },
    });
  };

  useEffect(() => {
    getAvailableForms();
  }, [formData]);

  return (
    <>
      <div className="h-[48px] bg-white drop-shadow-sm">
        <div className="container mx-auto px-3 py-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={APPLICANT_ROUTE_MAP.dashboardModule.my_applications}>
              <span className="text-primary-400 cursor-pointer">
                My Application
              </span>
            </Link>
            <FaAngleRight className="text-[16px]" />
            <span className="text-gray-500">Available Forms</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-3 min-h-[40vh]">
        <div className="flex flex-col gap-4">
          <div className="flex mb-12 justify-between grid grid-cols-10 gap-x-5 gap-y-8 sm:grid-cols-10">
            <div className="sm:col-span-3">
              <Select
                name="application_type"
                id="application_type"
                value={formData?.condition?.application_type?._eq}
                onChange={(value) => handleChange("application_type", value)}
                className="bg-white"
                size="lg"
                label="Application Type"
              >
                <Option value="new_institute">New Institute</Option>
                <Option value="new_course">
                  New course in an existing institute
                </Option>
                <Option value="seat_enhancement">
                  Seat enhancement for an existing course
                </Option>
              </Select>
            </div>
            <div className="sm:col-span-3 ">
              <Select
                name="course_type"
                id="course_type"
                value={formData?.condition?.course_type?._eq}
                onChange={(value) => handleChange("course_type", value)}
                className="bg-white"
                size="lg"
                label="Course Type"
              >
                <Option value="nursing">Nursing</Option>
                <Option value="paramedical">Paramedical</Option>
              </Select>
            </div>
            <div className="sm:col-span-3 ">
              <Select
                name="course_level"
                id="course_level"
                value={formData?.condition?.course_level?._eq}
                onChange={(value) => handleChange("course_level", value)}
                className="bg-white"
                size="lg"
                label="Course Level"
              >
                <Option value="degree">Degree</Option>
                <Option value="diploma">Diploma</Option>
              </Select>
            </div>
            <div className="sm:col-span-1">
              <button
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onClick={handleClearFilter}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-xl font-semibold">Application forms</div>
            {!loadingForms && availableForms.length === 0 && (
              <div className="text-sm">There is no form available</div>
            )}
            {!loadingForms && availableForms.length > 0 && (
              <div className="text-sm">
                These are the available forms for you to apply. Click on any of
                them to start filling
              </div>
            )}
          </div>
          {/* Search */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between">
              <div className="bg-white flex w-1/4 items-stretch">
                <input
                  id="global_search_input"
                  value={value || ""}
                  onChange={(e) => {
                    setValue(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  type="search"
                  className="block w-[1px] min-w-0 flex-auto rounded border border-solid border-neutral-300 bg-transparent bg-clip-padding p-2  text-base font-normal leading-[1.6] text-neutral-700 outline-none transition duration-200 ease-in-out focus:z-[3] focus:border-primary focus:text-neutral-700 focus:shadow-[inset_0_0_0_1px_rgb(59,113,202)] focus:outline-none dark:border-neutral-600 dark:text-neutral-200 dark:placeholder:text-neutral-200 dark:focus:border-primary"
                  placeholder="Search (min 3 characters required)"
                />
              </div>
            </div>
          </div>

          {!loadingForms && availableForms.length > 0 && (
            <div className="flex flex-wrap">
              {availableForms.map((form, index) => (
                <FormCard form={form} key={index} onApply={applyFormHandler} />
              )
              )
              } 
              {console.log("available forms-",availableForms)}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AllApplications;

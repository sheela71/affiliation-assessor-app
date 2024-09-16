import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Select, Option } from "@material-tailwind/react";

import FilteringTable from "../../components/table/FilteringTable";
import Card from "../../components/Card";
import Nav from "../../components/Nav";

import { getFieldName, readableDate } from "../../utils/common";
import {
  filterOGA,
  getOnGroundAssessorData,
  markReviewStatus,
  searchOGA,
} from "../../api";
import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import { ContextAPI } from "../../utils/ContextAPI";

export default function OnGroundInspectionAnalysis() {
  const navigation = useNavigate();
  var resData = {};
  var formsDataList = [];
  resData = formsDataList;
  const [formsList, setFormsList] = useState();
  const [round, setRound] = useState(1);
  const [state, setState] = useState({
    menu_selected: "In Progress",
  });
  const [paginationInfo, setPaginationInfo] = useState({
    offsetNo: 0,
    limit: 10,
    totalCount: 0,
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { setSpinner } = useContext(ContextAPI);

  const COLUMN = [
    {
      Header: "Applicant",
      accessor: "applicant",
    },
    {
      Header: "Form name",
      accessor: "display_form_name",
    },
    {
      Header: "Assessor",
      accessor: "assessor",
    },
    {
      Header: "Assisting Assessor",
      accessor: "assisting_assessor",
    },
    {
      Header: "Submitted on",
      accessor: "published_on",
    },
    {
      Header: "Status",
      accessor: "status",
    },
  ];

  const cardArray = [
    {
      value: 0,
      key: "total",
      text: "Total",
    },
    {
      value: 0,
      key: "submitted_today",
      text: "Received today",
    },
    {
      value: 0,
      key: "in_progress",
      text: "In progress",
    },
    {
      value: 0,
      key: "reviewed",
      text: "Reviewed",
    },
    {
      value: 0,
      key: "pending",
      text: "Total pending",
    },
  ];

  const handleSelectMenu = (menuItem) => {
    setState((prevState) => ({ ...prevState, menu_selected: menuItem }));
    setPaginationInfo((prevState) => ({ ...prevState, offsetNo: 0 }));
    setIsFilterOpen(false);
    setIsSearchOpen(false);
  };

  const navigateToView = (formObj) => {
    console.log("formObj", formObj);
    const navigationURL = `${ADMIN_ROUTE_MAP.adminModule.onGroundInspection.viewForm}/${formObj?.original?.form_name}/${formObj?.original?.id}/${formObj?.original?.institute?.name}/${round}`;
    navigation(navigationURL);
    const postData = { form_id: formObj?.original?.id };
    markStatus(postData);
  };

  const markStatus = async (postData) => {
    try {
      setSpinner(true);
      const res = await markReviewStatus(postData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  useEffect(() => {
    if (!isSearchOpen && !isFilterOpen) {
      fetchOnGroundAssessorData();
    }
  }, [
    paginationInfo.offsetNo,
    paginationInfo.limit,
    state.menu_selected,
    round,
  ]);

  const fetchOnGroundAssessorData = async () => {
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      formStatus: state.menu_selected,
      round: round,
    };
    try {
      setSpinner(true);
      const res = await getOnGroundAssessorData(postData);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.form_submissions_aggregate.aggregate.totalCount,
      }));
      setFormsList(res?.data?.form_submissions);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const searchApiCall = async (searchData) => {
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      formStatus: state.menu_selected,
      round: round,
      ...searchData,
    };
    try {
      setSpinner(true);
      const res = await searchOGA(postData);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.form_submissions_aggregate.aggregate.totalCount,
      }));
      setFormsList(res?.data?.form_submissions);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const filterApiCall = async (filters) => {
    const customFilters = {
      condition: {
        ...filters["condition"],
        form_status: { _eq: state.menu_selected },
        round: { _eq: round },
      },
    };
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      ...customFilters,
    };
    try {
      setSpinner(true);
      const res = await filterOGA(postData);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.form_submissions_aggregate.aggregate.totalCount,
      }));
      setFormsList(res?.data?.form_submissions);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const status_obj = {
    total: formsList?.length,
    submitted_today: 0,
    in_progress: 0,
    reviewed: 0,
    pending: 0,
  };

  formsList?.forEach((e) => {
    // console.log("formlist",e)
    var formsData = {
      applicant:
        e?.institute?.name?.charAt(0).toUpperCase() +
        e?.institute?.name?.substring(1).toLowerCase() +
        ", " +
        e?.institute?.district?.charAt(0).toUpperCase() +
        e?.institute?.district?.substring(1).toLowerCase(),
      display_form_name: getFieldName(e?.form_name),
      form_name: e?.form_name,
      assessor: e?.assessor?.name || "NA",
      assisting_assessor:
        e?.assessor?.assisstant == null ? "None" : e?.assessor?.assisstant,
      published_on: readableDate(e?.submitted_on),
      id: e.form_id,
      status: e?.form_status || "NA",
      form_status: e?.form_status,
      review_status: e?.review_status,
      institute: e?.institute,
    };

    resData.push(formsData);
    if (e.submitted_on === new Date().toJSON().slice(0, 10)) {
      status_obj.submitted_today++;
    }
    if (e.review_status === null) {
      status_obj.pending++;
    } else if (e.review_status?.toLowerCase() === "in progress") {
      status_obj.in_progress++;
    } else if (e.review_status?.toLowerCase() === "reviewed") {
      status_obj.reviewed++;
    }
  });

  cardArray.forEach((obj) => {
    obj.value = status_obj[obj.key];
  });

  return (
    <>
      <Nav />
      <div className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}>
        <div className="flex flex-col gap-8">
          {/* <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-medium">Your activity</h1>
            </div>
            <div className="flex flex-wrap">
              {cardArray.map((obj, index) => (
                <Card
                  moreClass="shadow-md w-[200px] h-[100px] m-3 first:ml-0"
                  key={index}
                >
                  <div className="flex flex-col place-items-start justify-center gap-2">
                    <h3 className="text-xl font-semibold">{obj.value}</h3>
                    <div className="text-sm font-medium text-gray-700">
                      {obj.text}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div> */}

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold">All Applications</h1>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <div className="w-72 bg-white rounded-[8px]">
                  <Select
                    value={round}
                    label="Select round"
                    onChange={(value) => setRound(value)}
                  >
                    <Option value={1}>Round one</Option>
                    <Option value={2}>Round two</Option>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <ul className="flex flex-wrap -mb-px">
              <li
                className="gap-3"
                onClick={() => handleSelectMenu("In Progress")}
              >
                <a
                  href="#"
                  className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                    state.menu_selected === "In Progress"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : ""
                  }`}
                >
                  New
                </a>
              </li>
              <li
                className="gap-3"
                onClick={() => handleSelectMenu("Approved")}
              >
                <a
                  href="#"
                  className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                    state.menu_selected === "Approved"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : ""
                  }`}
                  aria-current="page"
                >
                  Approved
                </a>
              </li>
              <li
                className="gap-3"
                onClick={() => handleSelectMenu("Rejected")}
              >
                <a
                  href="#"
                  className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                    state.menu_selected === "Rejected"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : ""
                  }`}
                >
                  Rejected
                </a>
              </li>
            </ul>
            {/* <div>create a search bar and filter component here</div> */}

            {/* table creation starts here */}
            {state.menu_selected === "In Progress" && (
              <div className="flex flex-col gap-4">
                <FilteringTable

                  dataList={resData.filter(
                    (item) => item.form_status === "In Progress"
                  )}
                  navigateFunc={navigateToView}
                  columns={COLUMN}
                  pagination={true}
                  onRowSelect={() => {}}
                  filterApiCall={filterApiCall}
                  showFilter={true}
                  paginationInfo={paginationInfo}
                  setPaginationInfo={setPaginationInfo}
                  searchApiCall={searchApiCall}
                  setIsSearchOpen={setIsSearchOpen}
                  setIsFilterOpen={setIsFilterOpen}
                  selectedRound={round}
                />
              </div>
            )}

            {state.menu_selected === "Approved" && (
              <div className="flex flex-col gap-4">
                <FilteringTable
                  dataList={resData.filter(
                    (item) => item.form_status === "Approved"
                  )}
                  navigateFunc={navigateToView}
                  columns={COLUMN}
                  pagination={true}
                  onRowSelect={() => {}}
                  filterApiCall={filterApiCall}
                  showFilter={true}
                  paginationInfo={paginationInfo}
                  setPaginationInfo={setPaginationInfo}
                  searchApiCall={searchApiCall}
                  setIsSearchOpen={setIsSearchOpen}
                  setIsFilterOpen={setIsFilterOpen}
                  selectedRound={round}
                />
              </div>
            )}

            {state.menu_selected === "Rejected" && (
              <div className="flex flex-col gap-4">
                <FilteringTable
                  dataList={resData.filter(
                    (item) => item.form_status === "Rejected"
                  )}
                  navigateFunc={navigateToView}
                  columns={COLUMN}
                  pagination={true}
                  onRowSelect={() => {}}
                  filterApiCall={filterApiCall}
                  showFilter={true}
                  paginationInfo={paginationInfo}
                  setPaginationInfo={setPaginationInfo}
                  searchApiCall={searchApiCall}
                  setIsSearchOpen={setIsSearchOpen}
                  setIsFilterOpen={setIsFilterOpen}
                  selectedRound={round}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

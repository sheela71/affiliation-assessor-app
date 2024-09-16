import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// import { MdFileUpload, MdEdit, MdDelete } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";

import FilteringTable from "../../components/table/FilteringTable";
import Card from "../../components/Card";
import { Button } from "../../components";
import Nav from "../../components/Nav";
import { ContextAPI } from "../../utils/ContextAPI";

import {
  filterAssessments,
  filterForms,
  getAssessmentSchedule,
  searchAssessments,
  deleteSchedule,
} from "../../api";
import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import BulkUploadScheduleModal from "./BulkUploadScheduleModal";
import AlertModal from "../../components/AlertModal";

import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import { readableDate } from "../../utils";

const ScheduleManagementList = () => {
  const navigation = useNavigate();
  const { setSpinner, setToast, toast } = useContext(ContextAPI);
  var resUserData = [];
  const [assessmentScheduleList, setAssessmentScheduleList] = useState();
  const [scheduleTableList, setScheduleTableList] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState({
    offsetNo: 0,
    limit: 10,
    totalCount: 0,
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [bulkUploadScheduleModal, setBulkUploadSchduleModal] = useState(false);

  const [showAlert, setShowAlert] = useState(false);

  const [state, setState] = useState({
    menu_selected: "create_new",
    alertContent: {
      alertTitle: "",
      alertMsg: "",
      actionButtonLabel: "",
    },
  });

  const COLUMNS = [
    {
      Header: "District",
      accessor: "district",
    },
    {
      Header: "Parent center code",
      accessor: "parent_center_code",
    },
    {
      Header: "Child center code",
      accessor: "child_center_code",
    },
    {
      Header: "Institute name",
      accessor: "institute_name",
    },
    {
      Header: "Type",
      accessor: "type",
    },
    {
      Header: "Assessment date",
      accessor: "assessment_date",
    },
    {
      Header: "Assessor IDs",
      accessor: "assessor_id",
    },
    {
      Header: "Status",
      accessor: "status",
    },
    {
      Header: "",
      accessor: "more_actions",
    },
  ];

  const cardArray = [
    {
      value: 0,
      key: "total_pending",
      text: "Total pending",
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
      key: "reviewed_today",
      text: "Reviewed today",
    },
    {
      value: 0,
      key: "reviewed_in_total",
      text: "Reviewed in total",
    },
  ];

  const setTableData = (e) => ({
    scheduled_application_sno: e?.id,
    district: e?.institute?.district,
    parent_center_code: "-",
    child_center_code: "-",
    institute_name: e?.institute?.name,
    type: "-",
    assessment_date: readableDate(e?.date),
    assessor_id: e?.assessor_code,
    status: e?.status,
    more_actions: (
      <div className="flex flex-row text-2xl font-semibold">
        <Menu>
          <MenuHandler>
            <button className="leading-3 position-relative">...</button>
          </MenuHandler>
          <MenuList>
            <MenuItem
              onClick={() => {
                setShowAlert(true);
                setState((prevState) => ({
                  ...prevState,
                  alertContent: {
                    alertTitle: "Delete schedule",
                    alertMsg: "Are you sure,you want to delete this schedule?",
                    actionButtonLabel: "Delete",
                    actionFunction: handleDeleteSchedule,
                    actionProps: [e],
                  },
                }));
              }}
            >
              <div className="flex flex-row gap-4">
                <div>
                  <RiDeleteBin6Line />
                </div>
                <div className="text-semibold">
                  <span>Delete</span>
                </div>
              </div>{" "}
            </MenuItem>
          </MenuList>
        </Menu>
      </div>
    ),
  });

  const handleDeleteSchedule = async (formId) => {
    console.log("clicked", formId[0]?.id);
    console.log("clicked2", formId);

    const postData = { id: formId[0]?.id };

    try {
      setSpinner(true);
      const response = await deleteSchedule(postData);
      if (response.status === 200) {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "Schedule successfully Deleted!",
          toastType: "success",
        }));
        fetchAllAssessmentSchedule();
      }
      // Notification.sendemail({"body":})
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while deleting form!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
    setShowAlert(false);
  };

  const filterApiCall = async (filters) => {
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      ...filters,
    };
    try {
      setSpinner(true);
      const res = await filterAssessments(postData);
      setAssessmentScheduleList(res?.data?.assessment_schedule);
      const data = res?.data?.assessment_schedule;
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.assessment_schedule_aggregate.aggregate.totalCount,
      }));
      setScheduleTableList(data.map(setTableData));
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
      ...searchData,
    };
    try {
      setSpinner(true);
      const res = await searchAssessments(postData);
      setAssessmentScheduleList(res?.data?.assessment_schedule);
      const data = res?.data?.assessment_schedule;
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.assessment_schedule_aggregate.aggregate.totalCount,
      }));
      setScheduleTableList(data.map(setTableData));
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const fetchAllAssessmentSchedule = async () => {
    const pagination = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
    };
    try {
      setSpinner(true);
      const res = await getAssessmentSchedule(pagination);
      setAssessmentScheduleList(res?.data?.assessment_schedule);
      const data = res?.data?.assessment_schedule;
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.assessment_schedule_aggregate.aggregate.totalCount,
      }));
      setScheduleTableList(data.map(setTableData));
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  useEffect(() => {
    if (!isSearchOpen && !isFilterOpen) {
      fetchAllAssessmentSchedule();
    }
  }, [paginationInfo.offsetNo, paginationInfo.limit]);

  return (
    <>
      {showAlert && (
        <AlertModal showAlert={setShowAlert} {...state.alertContent} />
      )}
      <Nav />
      <div className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row">
              <div className="flex flex-grow items-center">
                <div className="text-xl font-semibold">Schedule Management</div>
              </div>
              <div className="flex flex-grow justify-end">
                <span className="flex gap-4">
                  <Button
                    onClick={() => setBulkUploadSchduleModal(true)}
                    moreClass="text-white"
                    text="Upload CSV for scheduling"
                  ></Button>
                </span>
              </div>
            </div>
            {/* <div className="flex flex-wrap">
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
            </div> */}
          </div>
          <div className="flex flex-col gap-4">
            <FilteringTable
              dataList={scheduleTableList}
              columns={COLUMNS}
              navigateFunc={() => {}}
              filterApiCall={filterApiCall}
              onRowSelect={() => {}}
              pagination={true}
              showFilter={true}
              paginationInfo={paginationInfo}
              setPaginationInfo={setPaginationInfo}
              setIsSearchOpen={setIsSearchOpen}
              setIsFilterOpen={setIsFilterOpen}
              searchApiCall={searchApiCall}
            />
          </div>
        </div>
      </div>
      {bulkUploadScheduleModal && (
        <BulkUploadScheduleModal
          setBulkUploadSchduleModal={setBulkUploadSchduleModal}
        />
      )}
    </>
  );
};

export default ScheduleManagementList;

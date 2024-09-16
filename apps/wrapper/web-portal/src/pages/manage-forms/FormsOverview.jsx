import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "../../components";
import FilteringTable from "../../components/table/FilteringTable";
import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";
import {
  getForms,
  publishForms,
  unpublishForms,
  deleteForm,
  filterForms,
  searchForms,
  createCourse,
  viewForm,
  duplicateForms,
} from "../../api";
import { getFieldName, readableDate } from "../../utils/common";
import { VscPreview, VscCopy } from "react-icons/vsc";
import { RiDeleteBin6Line } from "react-icons/ri";

import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";

import AlertModal from "../../components/AlertModal";
import Nav from "../../components/Nav";
import { ContextAPI } from "../../utils/ContextAPI";

const FormsOverview = () => {
  const navigation = useNavigate();
  var formsDataList = [];
  const [formsList, setFormsList] = useState();

  const [viewFormState, setViewFormState] = useState();

  const [state, setState] = useState({
    menu_selected: "create_new",
    alertContent: {
      alertTitle: "",
      alertMsg: "",
      actionButtonLabel: "",
    },
  });
  const [viewFormData, setViewFormData] = useState({
    title: "",
  });

  const [showAlert, setShowAlert] = useState(false);

  const [paginationInfo, setPaginationInfo] = useState({
    offsetNo: 0,
    limit: 10,
    totalCount: 0,
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { setSpinner, setToast } = useContext(ContextAPI);

  const COLUMN_DRAFTS = [
    {
      Header: "Form title",
      accessor: "title",
    },
    {
      Header: "Application type",
      accessor: "application_type",
    },
    {
      Header: "Round no.",
      accessor: "round",
    },
    {
      Header: "Course Type",
      accessor: "course_type",
    },
    {
      Header: "Created on",
      accessor: "created_at",
    },
    {
      Header: "Action",
      accessor: "publish",
    },
    ,
    // {
    //   Header: "Preview",
    //   accessor: "preview",
    // },
    // {
    //   Header: "Delete",
    //   accessor: "delete",
    // },
    {
      Header: "",
      accessor: "more_actions",
    },
  ];

  const COLUMN_PUBLISHED = [
    {
      Header: "Form title",
      accessor: "title",
    },
    {
      Header: "Application type",
      accessor: "application_type",
    },
    {
      Header: "Round no.",
      accessor: "round",
    },
    {
      Header: "Course Type",
      accessor: "course_type",
    },
    {
      Header: "Published on",
      accessor: "updated_at",
    },
    {
      Header: "Action",
      accessor: "unpublish",
    },
    // {
    //   Header: "Preview",
    //   accessor: "preview",
    // },
    // {
    //   Header: "Delete",
    //   accessor: "delete",
    // },
  ];

  const COLUMN_UNPUBLISHED = [
    {
      Header: "Form title",
      accessor: "title",
    },
    {
      Header: "Application type",
      accessor: "application_type",
    },
    {
      Header: "Round no.",
      accessor: "round",
    },
    {
      Header: "Course Type",
      accessor: "course_type",
    },
    {
      Header: "Published on",
      accessor: "updated_at",
    },
    {
      Header: "Action",
      accessor: "publish",
    },
    // {
    //   Header: "Preview",
    //   accessor: "preview",
    // },

    {
      Header: "Delete",
      accessor: "delete",
    },
  ];

  const navigateToView = (formObj) => {
    const navigationURL = `${ADMIN_ROUTE_MAP.adminModule.manageForms.viewForm}/${formObj?.title}/${formObj?.form_id}`;
    navigation(navigationURL);
  };

  const handleSelectMenu = (menuItem) => {
    setState((prevState) => ({ ...prevState, menu_selected: menuItem }));
    setPaginationInfo((prevState) => ({ ...prevState, offsetNo: 0 }));
    setIsFilterOpen(false);
    setIsSearchOpen(false);
  };

  const publish = (e) => {
    let publishFormId = [e[0]?.form_id];
    setShowAlert(false);
    publishForm(publishFormId);
    handleCreateCourse(e);
  };

  const unpublish = (formId) => {
    setShowAlert(false);
    unpublishForm(formId);
  };

  const duplicate = (formId) => {
    setShowAlert(false);
    getFormDetails(formId);
  };

  const delete_Form = (formId) => {
    setShowAlert(false);
    deleteForms(formId);
  };

  useEffect(() => {
    if (
      state.menu_selected !== "create_new" &&
      !isSearchOpen &&
      !isFilterOpen
    ) {
      fetchFormsList();
    }
  }, [paginationInfo.offsetNo, paginationInfo.limit, state.menu_selected]);

  const getFormDetails = async (form_Id) => {
    const formData = new FormData();
    formData.append("form_id", form_Id);
    try {
      setSpinner(true);
      const response = await viewForm(formData);
      const formDetail = response.data.forms[0];
      const postData = {
        formsData: [
          {
            title: `CLONE - ${formDetail?.title}`,
            file_name: formDetail?.file_name,
            course_type: formDetail?.course_type,
            course_level: formDetail?.course_level,
            application_type: formDetail?.application_type,
            form_desc: formDetail?.form_desc,
            created_at: formDetail?.created_at,
            updated_at: formDetail?.updated_at,
            round: formDetail?.round,
            form_status: formDetail?.form_status,
            path: formDetail?.path,
            labels: formDetail?.labels,
            assignee: formDetail?.assignee,
            user_id: formDetail?.user_id,
          },
        ],
      };
      await duplicateForms(postData);
      fetchFormsList();
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Form Cloned!",
        toastType: "success",
      }));
      // setViewFormState( formDetail  )
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error while cloning form!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const fetchFormsList = async () => {
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      formStatus: state.menu_selected,
    };
    try {
      setSpinner(true);
      const res = await getForms(postData);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res?.data?.forms_aggregate?.aggregate.totalCount,
      }));
      setFormsList(res?.data?.forms);
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
      ...searchData,
    };
    try {
      setSpinner(true);
      const res = await searchForms(postData);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res?.data?.forms_aggregate?.aggregate.totalCount,
      }));
      setFormsList(res?.data?.forms);
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
      },
    };
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      ...customFilters,
    };
    try {
      setSpinner(true);
      const res = await filterForms(postData);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res?.data?.forms_aggregate?.aggregate.totalCount,
      }));
      setFormsList(res?.data?.forms);
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
    var formsData = {
      title: getFieldName(e?.title),
      application_type: getFieldName(e?.application_type),
      round: `Round ${e?.round}`,
      course_type: getFieldName(e?.course_type),
      course_level: getFieldName(e?.course_level),
      course_name: getFieldName(e?.course_name),
      file_name: getFieldName(e?.file_name),
      path: getFieldName(e?.path),
      form_status: e?.form_status,
      created_at: readableDate(e?.created_at),
      form_id: e?.form_id,
      updated_at: readableDate(e?.updated_at),
      assignee: e?.assignee,
      labels: e?.labels,
      publish: (
        <a
          className={`text-primary-600`}
          onClick={() => {
            setShowAlert(true);
            setState((prevState) => ({
              ...prevState,
              alertContent: {
                alertTitle: "Publish Form",
                alertMsg: "Are you sure to publish the form?",
                actionButtonLabel: "Publish",
                actionFunction: publish,
                actionProps: [e],
              },
            }));
          }}
        >
          Publish
        </a>
      ),
      title: (
        <a
          className={`px-6 text-primary-600 pl-0`}
          onClick={() => {
            setShowAlert(true);
            setState((prevState) => ({
              ...prevState,
              alertContent: {
                alertTitle: "View Form",
                alertMsg: "Are you sure to View the form?",
                actionButtonLabel: "Publish",
                actionFunction: navigateToView(e),
                actionProps: [e],
              },
            }));
          }}
        >
          {e?.title}
        </a>
      ),
      unpublish: (
        <a
          className={`px-6 text-primary-600 pl-0`}
          onClick={() => {
            setShowAlert(true);
            setState((prevState) => ({
              ...prevState,
              alertContent: {
                alertTitle: "Unpublish Form",
                alertMsg: "Are you sure to unpublish the form?",
                actionButtonLabel: "Unpublish",
                actionFunction: unpublish,
                actionProps: [e?.form_id],
              },
            }));
          }}
        >
          Unpublish
        </a>
      ),
      preview: (
        <div className="flex flex-row text-2xl font-semibold">
          <span onClick={() => navigateToView(e)}>
            <VscPreview />
          </span>
        </div>
      ),
      delete: (
        <a
          className={`px-6 text-gray-600 pl-0`}
          onClick={() => {
            setShowAlert(true);
            setState((prevState) => ({
              ...prevState,
              alertContent: {
                alertTitle: "Delete form",
                alertMsg:
                  e.form_status === "Published"
                    ? "You cannot delete the form before unpublishing it?"
                    : "Are you sure,you want to delete this form?",
                actionButtonLabel:
                  e.form_status === "Published" ? "Unpublish" : "Delete",
                actionFunction:
                  e.form_status === "Published" ? unpublish : delete_Form,
                actionProps: [e?.form_id],
              },
            }));
          }}
        >
          <RiDeleteBin6Line className="text-xl mt-4" />
        </a>
      ),
      more_actions: (
        <div className="flex flex-row text-2xl font-semibold">
          <Menu>
            <MenuHandler>
              <button className="leading-3 relative top-[-8px]">...</button>
            </MenuHandler>
            <MenuList>
              <MenuItem
                onClick={() => {
                  setShowAlert(true);
                  setState((prevState) => ({
                    ...prevState,
                    alertContent: {
                      alertTitle: "Duplicate Form",
                      alertMsg: "Are you sure to duplicate the form?",
                      actionButtonLabel: "Duplicate",
                      actionFunction: duplicate,
                      fetchFormsList,
                      actionProps: [e?.form_id],
                    },
                  }));
                }}
              >
                <div className="flex flex-row gap-3 p-2 px-0 items-center">
                  <div className="flex">
                    {" "}
                    <VscCopy />{" "}
                  </div>
                  <div className="text-semibold">
                    <span>Clone</span>
                  </div>
                </div>{" "}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setShowAlert(true);
                  setState((prevState) => ({
                    ...prevState,
                    alertContent: {
                      alertTitle: "Delete form",
                      alertMsg:
                        e.form_status === "Published"
                          ? "You cannot delete the form before unpublishing it?"
                          : "Are you sure,you want to delete this form?",
                      actionButtonLabel:
                        e.form_status === "Published" ? "Unpublish" : "Delete",
                      actionFunction:
                        e.form_status === "Published" ? unpublish : delete_Form,
                      actionProps: [e?.form_id],
                    },
                  }));
                }}
              >
                <div className="flex flex-row gap-3 p-2 px-0 items-center">
                  <div className="flex">
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
    };

    formsDataList.push(formsData);
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

  const publishForm = async (form_id) => {
    const formData = new FormData();
    formData.append("form_id", form_id);
    try {
      setSpinner(true);
      const response = await publishForms(formData);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Form successfully Published!",
        toastType: "success",
      }));
      // Notification.sendemail({"body":})
      fetchFormsList();
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while publishing form!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const handleCreateCourse = async (formDataObject) => {
    let objectRes = JSON.stringify([
      { name: formDataObject[0]?.file_name, path: formDataObject[0]?.path },
    ]);

    const formData = {
      courses: [
        {
          course_type: formDataObject[0]?.course_type,
          course_level: formDataObject[0]?.course_level,
          course_name: formDataObject[0]?.title,
          formObject: objectRes,
          form_id: formDataObject?.[0]?.form_id,
          application_type: formDataObject[0]?.application_type,
          course_desc: formDataObject[0]?.form_desc,
          assignee: formDataObject[0]?.assignee,
          round: formDataObject[0]?.round,
        },
      ],
    };

    console.log("formData - ", formData);

    try {
      setSpinner(true);
      const response = await createCourse(formData);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Form successfully Published!",
        toastType: "success",
      }));
      // Notification.sendemail({"body":})
      fetchFormsList();
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while publishing form!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const unpublishForm = async (form_id) => {
    const formData = new FormData();
    formData.append("form_id", form_id);
    try {
      setSpinner(true);
      const response = await unpublishForms(formData);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Form successfully Unpublished!",
        toastType: "success",
      }));
      fetchFormsList();
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while unpublishing form!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const deleteForms = async (form_id) => {
    const formData = new FormData();
    formData.append("form_id", form_id);
    try {
      setSpinner(true);
      await deleteForm(formData).then(
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "Form successfully Deleted!",
          toastType: "success",
        }))
      );

      fetchFormsList();
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
  };

  return (
    <>
      {showAlert && (
        <AlertModal showAlert={setShowAlert} {...state.alertContent} />
      )}
      <Nav />
      <div className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold">Manage Forms</h1>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <ul className="flex flex-wrap gap-3 -mb-px">
              <li onClick={() => handleSelectMenu("create_new")}>
                <a
                  href="#"
                  className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                    state.menu_selected === "create_new"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : ""
                  }`}
                >
                  Create New
                </a>
              </li>

              <li className="mr-2" onClick={() => handleSelectMenu("Draft")}>
                <a
                  href="#"
                  className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                    state.menu_selected === "Draft"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : ""
                  }`}
                  aria-current="page"
                >
                  Draft
                </a>
              </li>

              <li
                className="mr-2"
                onClick={() => handleSelectMenu("Published")}
              >
                <a
                  href="#"
                  className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                    state.menu_selected === "Published"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : ""
                  }`}
                >
                  Published
                </a>
              </li>

              <li
                className="mr-2"
                onClick={() => handleSelectMenu("Unpublished")}
              >
                <a
                  href="#"
                  className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                    state.menu_selected === "Unpublished"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : ""
                  }`}
                >
                  Archived
                </a>
              </li>
            </ul>

            {state.menu_selected === "create_new" && (
              <div className="flex flex-col gap-4">
                <Card moreClass="flex h-[50vh]">
                  <div className="flex flex-col gap-4 m-auto items-center">
                    <div className="font-semibold text-xl">
                      Click on the button to a create a form
                    </div>
                    <Button
                      moreClass="text-white w-3/5"
                      text="Upload ODK"
                      onClick={() => navigation("/manage-forms/create-form")}
                    />
                    {/* Or
                  <Button moreClass="text-white w-3/5" text="Configure Manually" /> */}
                  </div>
                </Card>
              </div>
            )}

            {state.menu_selected === "Draft" && (
              <div className="flex flex-col gap-3">
                <FilteringTable
                  dataList={formsDataList.filter(
                    (item) => item.form_status === "Draft"
                  )}
                  navigateFunc={() => {}}
                  columns={COLUMN_DRAFTS}
                  filterApiCall={filterApiCall}
                  onRowSelect={() => {}}
                  pagination={true}
                  showFilter={true}
                  paginationInfo={paginationInfo}
                  setPaginationInfo={setPaginationInfo}
                  searchApiCall={searchApiCall}
                  setIsSearchOpen={setIsSearchOpen}
                  setIsFilterOpen={setIsFilterOpen}
                />
              </div>
            )}

            {state.menu_selected === "Published" && (
              <div className="flex flex-col gap-3">
                <FilteringTable
                  dataList={formsDataList.filter(
                    (item) => item.form_status === "Published"
                  )}
                  navigateFunc={() => {}}
                  columns={COLUMN_PUBLISHED}
                  onRowSelect={() => {}}
                  pagination={true}
                  filterApiCall={filterApiCall}
                  showFilter={true}
                  paginationInfo={paginationInfo}
                  setPaginationInfo={setPaginationInfo}
                  searchApiCall={searchApiCall}
                  setIsSearchOpen={setIsSearchOpen}
                  setIsFilterOpen={setIsFilterOpen}
                />
              </div>
            )}

            {state.menu_selected === "Unpublished" && (
              <div className="flex flex-col gap-3">
                <FilteringTable
                  dataList={formsDataList.filter(
                    (item) => item.form_status === "Unpublished"
                  )}
                  navigateFunc={() => {}}
                  columns={COLUMN_UNPUBLISHED}
                  onRowSelect={() => {}}
                  pagination={true}
                  filterApiCall={filterApiCall}
                  showFilter={true}
                  paginationInfo={paginationInfo}
                  setPaginationInfo={setPaginationInfo}
                  searchApiCall={searchApiCall}
                  setIsSearchOpen={setIsSearchOpen}
                  setIsFilterOpen={setIsFilterOpen}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FormsOverview;

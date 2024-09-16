import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { MdFileUpload, MdEdit, MdDelete, MdSwapHoriz } from "react-icons/md";

import { Button } from "../../components";
import FilteringTable from "../../components/table/FilteringTable";

import { readableDate, removeCookie, setCookie } from "../../utils/common";
import {
  filterUsers,
  getAllAssessors,
  searchUsers,
  handleActiveUser,
  handleInctiveUser,
  handleDeleteUser,
  getAllRegulators,
} from "../../api";

import { userService } from "../../api/userService";

import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";

import DeleteUsersModal from "./DeleteUsers";
import Nav from "../../components/Nav";
import BulkUploadUsersModal from "./BulkUploadUsersModal";
import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import { ContextAPI } from "../../utils/ContextAPI";
import ViewScheduleModal from "./ViewScheduleModal";

export default function ManageUsersList({
  closeDeleteUsersModal,
  closeBulkUploadUsersModal,
  closeViewSchedulesModal,
  setDeleteFlags,
}) {
  const navigation = useNavigate();
  var resUserData = [];
  const [deleteUsersModel, setDeleteUsersModel] = useState(false);
  const [deleteBulkUsersModel, setDeleteBulkUsersModel] = useState(false);

  // const[onRowSelected,setOnRowSelected] = useState([])
  const [deleteFlag, setDeleteFlag] = useState(false);
  const [bulkDeleteFlag, setBulkDeleteFlag] = useState(false);
  const [listArray, setListArray] = useState();

  const [bulkUploadUsersModel, setBulkUploadUsersModel] = useState(false);
  const [viewScheduleModal, setViewScheduleModal] = useState(false);
  const [scheduleUserData, setScheduleUserData] = useState({});
  const [usersList, setUsersList] = useState();
  const [userTableList, setUserTableList] = useState([]);

  const [invalidUserRowFlag] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState([{ userId: "" }]);
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState({
    menu_selected: "Assessor",
  });

  const [paginationInfo, setPaginationInfo] = useState({
    offsetNo: 0,
    limit: 10,
    totalCount: 0,
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { setSpinner, setToast } = useContext(ContextAPI);
  let selectedRows = [];

  const COLUMNS = [
    {
      Header: "Full name",
      accessor: "full_name",
    },
    {
      Header: "Code",
      accessor: "code",
    },
    {
      Header: "Email",
      accessor: "email",
    },
    {
      Header: "Mobile number",
      accessor: "mobile_number",
    },
    {
      Header: "Role",
      accessor: "role",
    },
    {
      Header: "Account Status",
      accessor: "status",
    },
    {
      Header: "",
      accessor: "schedule",
    },
    {
      Header: "",
      accessor: "more_actions",
    },
    {
      Header: "",
      accessor: "isRowInvalid",
      Cell: () => {
        return invalidUserRowFlag;
      },
    },
  ];

  const ADMIN_COLUMN = [
    {
      Header: "Full name",
      accessor: "full_name",
    },
    {
      Header: "Email",
      accessor: "email",
    },
    {
      Header: "Mobile number",
      accessor: "mobile_number",
    },
    {
      Header: "Role",
      accessor: "role",
    },
    {
      Header: "",
      accessor: "more_actions",
    },
    {
      Header: "",
      accessor: "isRowInvalid",
      Cell: () => {
        return invalidUserRowFlag;
      },
    },
  ];

  const handleSelectMenu = (menuItem) => {
    setState((prevState) => ({ ...prevState, menu_selected: menuItem }));
    setPaginationInfo((prevState) => ({ ...prevState, offsetNo: 0 }));
    setIsFilterOpen(false);
    setIsSearchOpen(false);
  };

  const handleUsersetInvalid = async (user) => {
    const userId = user?.user_id;
    const formData = new FormData();
    formData.append("assessorId", userId);
    let e = user;
    try {
      setSpinner(true);
      const response = await handleInctiveUser(formData);
      e["workingstatus"] = "Invalid";
      resUserData.forEach((item) => {
        if (item.id === userId) {
          item.status = "Inactive";
          item.more_actions = (
            <div className="flex flex-row text-2xl font-semibold">
              <Menu>
                <MenuHandler>
                  <button className="leading-3 position-relative">...</button>
                </MenuHandler>
                <MenuList>
                  <MenuItem
                    onClick={() =>
                      navigation(
                        `${ADMIN_ROUTE_MAP.adminModule.manageUsers.createUser}/${e.user_id}`
                      )
                    }
                  >
                    <div className="flex flex-row gap-4 mt-4">
                      <div>
                        <MdEdit />
                      </div>
                      <div className="text-semibold m-">
                        <span>Edit</span>
                      </div>
                    </div>{" "}
                  </MenuItem>
                  <MenuItem
                    onClick={() =>
                      e?.workingstatus === "Invalid"
                        ? handleUserSetValid(e)
                        : handleUsersetInvalid(e)
                    }
                  >
                    <div className="flex flex-row gap-4 mt-4">
                      <div>
                        <MdSwapHoriz />
                      </div>
                      <div className="text-semibold m-">
                        <span>
                          {e?.workingstatus === "Invalid"
                            ? "Activate"
                            : "Deactivate"}
                        </span>
                      </div>
                    </div>
                  </MenuItem>
                  <MenuItem onClick={() => handleUserDelete(e)}>
                    <div className="flex flex-row gap-4 mt-4">
                      <div>
                        <MdDelete />
                      </div>
                      <div className="text-semibold m-">
                        <span>Delete</span>
                      </div>
                    </div>{" "}
                  </MenuItem>
                </MenuList>
              </Menu>
            </div>
          );
        }
      });
      console.log("data", resUserData);
      setUserTableList(resUserData);
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while deactivating!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const handleViewSchedule = (data) => {
    setScheduleUserData(data);
    setViewScheduleModal(true);
  };

  const handleUserSetValid = async (user) => {
    const userId = user?.user_id;
    const formData = new FormData();
    formData.append("assessorId", userId);
    let e = user;
    try {
      setSpinner(true);
      const validResponse = await handleActiveUser(formData);
      e["workingstatus"] = "Valid";
      resUserData.forEach((item) => {
        if (item.id === userId) {
          item.status = "Active";
          item.more_actions = (
            <div className="flex flex-row text-2xl font-semibold">
              <Menu>
                <MenuHandler>
                  <button className="leading-3 position-relative">...</button>
                </MenuHandler>
                <MenuList>
                  <MenuItem
                    onClick={() =>
                      navigation(
                        `${ADMIN_ROUTE_MAP.adminModule.manageUsers.createUser}/${e.user_id}`
                      )
                    }
                  >
                    <div className="flex flex-row gap-4 mt-4">
                      <div>
                        <MdEdit />
                      </div>
                      <div className="text-semibold m-">
                        <span>Edit</span>
                      </div>
                    </div>{" "}
                  </MenuItem>
                  <MenuItem
                    onClick={() =>
                      e?.workingstatus === "Invalid"
                        ? handleUserSetValid(e)
                        : handleUsersetInvalid(e)
                    }
                  >
                    <div className="flex flex-row gap-4 mt-4">
                      <div>
                        <MdSwapHoriz />
                      </div>
                      <div className="text-semibold m-">
                        <span>
                          {e?.workingstatus === "Invalid"
                            ? "Activate"
                            : "Deactivate"}
                        </span>
                      </div>
                    </div>{" "}
                  </MenuItem>
                  <MenuItem onClick={() => handleUserDelete(e)}>
                    <div className="flex flex-row gap-4 mt-4">
                      <div>
                        <MdDelete />
                      </div>
                      <div className="text-semibold m-">
                        <span>Delete</span>
                      </div>
                    </div>{" "}
                  </MenuItem>
                </MenuList>
              </Menu>
            </div>
          );
        }
      });
      setUserTableList(resUserData);
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while activating!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const handleUserDelete = (e) => {
    setSelectedUserId(e.user_id);
    setDeleteUsersModel(true);
  };

  const setTableData = (e) => {
    var usersData = {
      full_name: e.fname || e.lname ? e.fname + " " + e.lname : e.name,
      email: e.email?.toLowerCase(),
      mobile_number: e.phonenumber,
      role: e.role || "Assessor",
      status:
        e.workingstatus === "Valid"
          ? "Active"
          : e.workingstatus === "Invalid"
          ? "Inactive"
          : "-",
      id: e.user_id,
      code: e.code,
      schedule: (
        <div
          className={`px-6 text-primary-600 pl-0`}
          onClick={() => handleViewSchedule(e)}
        >
          View Schedule
        </div>
      ),
      more_actions: (
        <div className="flex flex-row text-2xl font-semibold">
          <Menu>
            <MenuHandler>
              <button className="leading-3 position-relative">...</button>
            </MenuHandler>
            <MenuList>
              <MenuItem
                onClick={() =>
                  navigation(
                    `${ADMIN_ROUTE_MAP.adminModule.manageUsers.createUser}/${e.user_id}`
                  )
                }
              >
                <div className="flex flex-row gap-4 mt-4">
                  <div>
                    <MdEdit />
                  </div>
                  <div className="text-semibold m-">
                    <span>Edit</span>
                  </div>
                </div>{" "}
              </MenuItem>
              <MenuItem
                onClick={() =>
                  e?.workingstatus === "Invalid"
                    ? handleUserSetValid(e)
                    : handleUsersetInvalid(e)
                }
              >
                <div className="flex flex-row gap-4 mt-4">
                  <div>
                    <MdSwapHoriz />
                  </div>
                  <div className="text-semibold m-">
                    <span>
                      {e?.workingstatus === "Invalid"
                        ? "Activate"
                        : "Deactivate"}
                    </span>
                  </div>
                </div>{" "}
              </MenuItem>
              <MenuItem onClick={() => handleUserDelete(e)}>
                <div className="flex flex-row gap-4 mt-4">
                  <div>
                    <MdDelete />
                  </div>
                  <div className="text-semibold m-">
                    <span>Delete</span>
                  </div>
                </div>{" "}
              </MenuItem>
            </MenuList>
          </Menu>
        </div>
      ),
    };
    resUserData.push(usersData);
  };
  const setAdminTableData = (e) => {
    var usersData = {
      full_name: e.fname || e.lname ? e.fname + " " + e.lname : e.name,
      email: e.email?.toLowerCase(),
      mobile_number: e.phonenumber,
      role: e.role === "Desktop-Admin" ? "Admin" : "Admin",
      status:
        e.workingstatus === "Valid"
          ? "Active"
          : e.workingstatus === "Invalid"
          ? "Inactive"
          : "-",
      id: e.user_id,
      schedule: (
        <div
          className={`px-6 text-primary-600 pl-0`}
          onClick={() => handleViewSchedule(e)}
        >
          View Schedule
        </div>
      ),
      more_actions: (
        <div className="flex flex-row text-2xl font-semibold">
          <Menu>
            <MenuHandler>
              <button className="leading-3 position-relative">...</button>
            </MenuHandler>
            <MenuList>
              <MenuItem
                onClick={() =>
                  navigation(
                    `${ADMIN_ROUTE_MAP.adminModule.manageUsers.createUser}/${e.user_id}`
                  )
                }
              >
                <div className="flex flex-row gap-4 mt-4">
                  <div>
                    <MdEdit />
                  </div>
                  <div className="text-semibold m-">
                    <span>Edit</span>
                  </div>
                </div>{" "}
              </MenuItem>
              <MenuItem onClick={() => handleUserDelete(e)}>
                <div className="flex flex-row gap-4 mt-4">
                  <div>
                    <MdDelete />
                  </div>
                  <div className="text-semibold m-">
                    <span>Delete</span>
                  </div>
                </div>{" "}
              </MenuItem>
            </MenuList>
          </Menu>
        </div>
      ),
    };
    resUserData.push(usersData);
  };

  const fetchAllAssessors = async () => {
    const pagination = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
    };
    try {
      setSpinner(true);
      const res = await getAllAssessors(pagination);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.assessors_aggregate.aggregate.totalCount,
      }));
      setUsersList(res?.data?.assessors);
      const data = res?.data?.assessors;
      data.forEach(setTableData);
      setUserTableList(resUserData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const fetchAllRegulators = async () => {
    const pagination = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
    };
    try {
      setSpinner(true);
      const res = await getAllRegulators(pagination);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.regulator_aggregate.aggregate.totalCount,
      }));
      setUsersList(res?.data?.regulator);
      const data = res?.data?.regulator;
      data.forEach(setAdminTableData);
      setUserTableList(resUserData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const searchApiCall = async (searchData) => {
    const pagination = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      ...searchData,
    };
    try {
      setSpinner(true);
      const res = await searchUsers(pagination);
      if (state.menu_selected === "Assessor") {
        setPaginationInfo((prevState) => ({
          ...prevState,
          totalCount: res.data.assessors_aggregate.aggregate.totalCount,
        }));
        setUsersList(res?.data?.assessors);
        const data = res?.data?.assessors;
        data.forEach(setTableData);
      }
      if (state.menu_selected === "Desktop-Admin") {
        setPaginationInfo((prevState) => ({
          ...prevState,
          totalCount: res.data.regulator_aggregate.aggregate.totalCount,
        }));
        setUsersList(res?.data?.regulator);
        const data = res?.data?.regulator;
        data.forEach(setAdminTableData);
      }
      setUserTableList(resUserData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const filterApiCall = async (filters) => {
    const postData = {
      offsetNo: paginationInfo.offsetNo,
      limit: paginationInfo.limit,
      ...filters,
    };
    try {
      setSpinner(true);
      const res = await filterUsers(postData);
      setPaginationInfo((prevState) => ({
        ...prevState,
        totalCount: res.data.assessors_aggregate.aggregate.totalCount,
      }));
      setUsersList(res?.data?.assessors);
      const data = res?.data?.assessors;
      data.forEach(setTableData);
      setUserTableList(resUserData);
    } catch (error) {
      console.log("error - ", error);
    } finally {
      setSpinner(false);
    }
  };

  const handleDelete = async (userId) => {
    const postData = [
      {
        request: {
          userName: userId,
        },
      },
    ];
    const hasuraPostData = { user_id: userId };
    try {
      setSpinner(true);
      let accessTokenObj = {
        grant_type: "client_credentials",
        client_id: "admin-api",
        client_secret: "edd0e83d-56b9-4c01-8bf8-bad1870a084a",
      };
      const accessTokenResponse = await userService.getAccessToken(
        accessTokenObj
      );
      setCookie(
        "access_token",
        "Bearer " + accessTokenResponse.data.access_token
      );
      let hasuraResponse = {};
      const response = await userService.deleteUsers(postData);
      if (response.status === 200) {
        hasuraResponse = await handleDeleteUser(hasuraPostData);
      }
      if (state.menu_selected === "Assessor") {
        await fetchAllAssessors();
      }
      if (state.menu_selected === "Desktop-Admin") {
        await fetchAllRegulators();
      }
      setDeleteFlag(false);
      setSelectedUserId([]);

      if (hasuraResponse.status === 200) {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "User Deleted!",
          toastType: "success",
        }));
      }

      removeCookie("access_token");
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while deleting the user!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const setSelectedRows = (rowList) => {
    let checkboxArr = [];
    rowList.forEach((item) => {
      let checkboxObj = {};
      checkboxObj.email = item.values.email;
      checkboxObj.status = item.values.status;
      checkboxObj.user_id = item.original.id;
      checkboxArr.push(checkboxObj);
    });
    selectedRows = checkboxArr;
    setListArray(selectedRows.length);
  };

  const handleBulkDelete = async (bulkEmail) => {
    const postData = bulkEmail;
    try {
      setSpinner(true);
      let errorFlag = false;
      let accessTokenObj = {
        grant_type: "client_credentials",
        client_id: "admin-api",
        client_secret: "edd0e83d-56b9-4c01-8bf8-bad1870a084a",
      };
      // const accessTokenResponse = await userService.getAccessToken(
      //   accessTokenObj
      // );
      // if (accessTokenResponse.status !== 200) {
      //   errorFlag = true;
      // }
      // setCookie(
      //   "access_token",
      //   "Bearer " + accessTokenResponse.data.access_token
      // );
      setCookie("access_token", process.env.REACT_APP_AUTH_TOKEN);

      // const res = await userService.deleteUsers(postData);

      postData.forEach(async (item) => {
        {
          const res = await userService.deleteUsers({
            request: {
              userName: item?.user_id,
            },
          });
          if (res.status !== 200) {
            errorFlag = true;
          }
        }
      });

      if (!errorFlag) {
        bulkEmail.map(async (item) => {
          let bulkHasuraPostData = { user_id: item.user_id };
          const hasuraResponse = await handleDeleteUser(bulkHasuraPostData);
          if (hasuraResponse.status !== 200) {
            errorFlag = true;
          }
        });
      }

      fetchAllAssessors();
      setBulkDeleteFlag(false);
      setDeleteBulkUsersModel(false);
      selectedRows = [];
      if (!errorFlag) {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "Users Deleted!",
          toastType: "success",
        }));
      }

      removeCookie("access_token");
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while deleting!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };
  const handleUserStatus = async (selectedRows) => {
    for (let x in selectedRows) {
      if (selectedRows[x].status.toLowerCase() === "active") {
        const postData = { assessorId: selectedRows[x].user_id };
        const validResponse = await handleInctiveUser(postData);

        // resUserData.forEach((item) => {
        //   if (item.id === selectedRows[x].user_id) {
        //     item.status = "Inactive";
        //   }
        // });
      } else if (selectedRows[x].status.toLowerCase() === "inactive") {
        const postData = { assessorId: selectedRows[x].user_id };
        const validResponse = await handleActiveUser(postData);
        // resUserData.forEach((item) => {
        //   if (item.id === selectedRows[x].user_id) {
        //     item.status = "Active";
        //   }
        // });
      }
    }
    await fetchAllAssessors();
    // setUserTableList(resUserData);
  };

  useEffect(() => {
    if (deleteFlag) {
      handleDelete(selectedUserId);
    }
  }, [deleteFlag]);

  useEffect(() => {
    if (bulkDeleteFlag) {
      // handleDelete(selectedUserId);
      handleBulkDelete(selectedRows);
    }
  }, [bulkDeleteFlag]);

  useEffect(() => {
    if (!isSearchOpen && !isFilterOpen) {
      if (state.menu_selected === "Assessor") {
        fetchAllAssessors();
      }
      if (state.menu_selected === "Desktop-Admin") {
        fetchAllRegulators();
      }
    }
  }, [paginationInfo.offsetNo, paginationInfo.limit, state.menu_selected]);

  return (
    <>
      <Nav />

      <div className={`container m-auto min-h-[calc(100vh-148px)] px-3 py-12`}>
        <div className="flex flex-col justify-center align-center">
          <div className="flex flex-col justify-center align-center gap-4">
            <div className="flex flex-row">
              <div className="flex grow items-center">
                <h1 className="text-xl font-semibold">Manage Users</h1>
              </div>
              <div className="flex justify-end">
                <span className="flex gap-4">
                  {state.menu_selected === "Assessor" && (
                    <Button
                      otherProps={{
                        disabled: listArray == 0 ? true : false,
                      }}
                      moreClass={`${
                        listArray == 0
                          ? "cursor-not-allowed border border-gray-500 bg-white text-gray-200 px-8 h-[44px]"
                          : "px-8 text-white"
                      }`}
                      onClick={() => {
                        if (selectedRows.length > 0) {
                          handleUserStatus(selectedRows);
                        }
                      }}
                      text="Make Active/Inactive"
                    ></Button>
                  )}
                  <Button
                    // moreClass="text-white"
                    otherProps={{
                      disabled: listArray == 0 ? true : false,
                    }}
                    moreClass={`${
                      listArray == 0
                        ? "cursor-not-allowed border border-gray-500 bg-white w-fit text-gray-200 px-8 h-fit"
                        : "px-8 text-white"
                    }`}
                    onClick={() =>
                      selectedRows.length
                        ? setDeleteBulkUsersModel(true)
                        : setDeleteBulkUsersModel(false)
                    }
                    text="Delete user"
                  ></Button>
                  <button
                    onClick={() => setBulkUploadUsersModel(true)}
                    className="flex flex-wrap items-center justify-center gap-2 border border-gray-500 text-gray-900 bg-white w-[200px] h-[45px] text-md font-medium rounded-[4px]"
                  >
                    Bulk upload users
                    <span className="text-xl">
                      <MdFileUpload />
                    </span>
                  </button>
                  <Button
                    moreClass="text-white"
                    text="Add User"
                    onClick={() =>
                      navigation(
                        `${ADMIN_ROUTE_MAP.adminModule.manageUsers.createUser}`
                      )
                    }
                  ></Button>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <ul className="flex flex-wrap gap-3 -mb-px">
                <li onClick={() => handleSelectMenu("Assessor")}>
                  <a
                    href="#"
                    className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                      state.menu_selected === "Assessor"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : ""
                    }`}
                  >
                    Assessor
                  </a>
                </li>

                <li
                  className="mr-2"
                  onClick={() => handleSelectMenu("Desktop-Admin")}
                >
                  <a
                    href="#"
                    className={`inline-block p-4 rounded-t-lg dark:text-blue-500 dark:border-blue-600 ${
                      state.menu_selected === "Desktop-Admin"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : ""
                    }`}
                    aria-current="page"
                  >
                    Admin
                  </a>
                </li>
              </ul>
              {/* filtering table here */}
              {state.menu_selected === "Assessor" && (
                <div className="flex flex-col gap-3">
                  <FilteringTable
                    dataList={userTableList}
                    columns={COLUMNS}
                    navigateFunc={() => {}}
                    showCheckbox={true}
                    paginationInfo={paginationInfo}
                    setPaginationInfo={setPaginationInfo}
                    setOnRowSelect={() => {}}
                    setSelectedRows={setSelectedRows}
                    showFilter={true}
                    pagination={true}
                    filterApiCall={filterApiCall}
                    searchApiCall={searchApiCall}
                    setIsSearchOpen={setIsSearchOpen}
                    setIsFilterOpen={setIsFilterOpen}
                  />
                </div>
              )}
              {state.menu_selected === "Desktop-Admin" && (
                <div className="flex flex-col gap-3">
                  <FilteringTable
                    dataList={userTableList}
                    columns={ADMIN_COLUMN}
                    navigateFunc={() => {}}
                    showCheckbox={true}
                    paginationInfo={paginationInfo}
                    setPaginationInfo={setPaginationInfo}
                    setOnRowSelect={() => {}}
                    setSelectedRows={setSelectedRows}
                    showFilter={true}
                    pagination={true}
                    filterApiCall={filterApiCall}
                    searchApiCall={searchApiCall}
                    setIsSearchOpen={setIsSearchOpen}
                    setIsFilterOpen={setIsFilterOpen}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteUsersModel && (
        <DeleteUsersModal
          setDeleteFlags={setDeleteFlag}
          closeDeleteUsersModal={setDeleteUsersModel}
        />
      )}

      {deleteBulkUsersModel && (
        <DeleteUsersModal
          setDeleteFlags={setBulkDeleteFlag}
          closeDeleteUsersModal={setDeleteBulkUsersModel}
        />
      )}

      {bulkUploadUsersModel && (
        <BulkUploadUsersModal
          closeBulkUploadUsersModal={setBulkUploadUsersModel}
        />
      )}

      {viewScheduleModal && (
        <ViewScheduleModal
          closeViewSchedulesModal={setViewScheduleModal}
          scheduleUserData={scheduleUserData}
        ></ViewScheduleModal>
      )}
    </>
  );
}

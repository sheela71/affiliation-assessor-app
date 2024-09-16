import React, { useContext, useEffect, useState } from "react";
import FilteringTable from "../../components/table/FilteringTable";
import { Switch } from "@material-tailwind/react";

import { Link } from "react-router-dom";
import { Button } from "../../components";
import {
  addUsers,
  createBulkUserHasura,
  createBulkUsersKeyCloak,
} from "../../api";
import { userService } from "../../api/userService";
import { removeCookie, setCookie } from "../../utils/common";
import { ContextAPI } from "../../utils/ContextAPI";

function BulkUploadUsersModal({ closeBulkUploadUsersModal }) {
  const [file, setFile] = useState();
  const { setSpinner, setToast } = useContext(ContextAPI);
  const [tableUserList, setTableUserList] = useState([]);
  const hiddenFileInput = React.useRef(null);
  const [tableDataReady, setTableDataReady] = useState(false);
  const [invalidTableUserList, setInvalidTableUserList] = useState([]);
  const [invalidUserDataFlag, setInvalidUserDataFlag] = useState(false);
  const [allUsersList, setAllUsersList] = useState([]);

  let selectedRows = [];
  const emailExp = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/;
  const mobNumberExp = /^(0|91)?[6-9][0-9]{9}$/;
  const isEmailValid = (email) => {
    if (
      emailExp.test(email?.trim().toString()) &&
      email?.trim().toString().length != 0
    ) {
      return email;
    } else {
      return email?.toString().length === 0 ? (
        <span className="text-red-500 mt-2 text-sm">
          - <br></br> <small>Missing Email ID</small>
        </span>
      ) : (
        <span className="text-red-500 mt-2 text-sm">
          {email} <br></br>
          <small>Invalid Email ID</small>
        </span>
      );
    }
  };

  const ismobileNumberValid = (mobileNumber) => {
    if (
      mobNumberExp.test(parseInt(mobileNumber)) &&
      mobileNumber.toString().length != 0
    ) {
      return mobileNumber;
    } else {
      return mobileNumber?.toString().length === 0 ? (
        <span className="text-red-500 mt-2 text-sm">
          - <br></br> <small>Missing mobile number</small>
        </span>
      ) : (
        <span className="text-red-500 mt-2 text-sm">
          {mobileNumber} <br></br>
          <small>Invalid mobile number</small>
        </span>
      );
    }
  };

  const isDataValid = (data) => {
    return data?.toString().length != 0 ? (
      data
    ) : (
      <span className="text-red-500 mt-2 text-sm">
        - <br></br> <small>Missing Text</small>
      </span>
    );
  };

  const COLUMNS = [
    // {
    //   Header: "Code",
    //   accessor: "code",
    //   Cell: (props) => {
    //     return <div>{isDataValid(props.value)}</div>;
    //   },
    // },
    {
      Header: "Email",
      accessor: "email",
      Cell: (props) => {
        return <div>{isEmailValid(props.value)}</div>;
      },
    },
    {
      Header: "Full Name",
      accessor: "full_name",
      Cell: (props) => {
        return <div>{isDataValid(props.value)}</div>;
      },
    },
    {
      Header: "First Name",
      accessor: "fname",
      Cell: (props) => {
        return <div>{isDataValid(props.value)}</div>;
      },
    },
    {
      Header: "Last Name",
      accessor: "lname",
      Cell: (props) => {
        return <div>{isDataValid(props.value)}</div>;
      },
    },
    {
      Header: "Mobile Number",
      accessor: "mobile_number",
      Cell: (props) => {
        return <div>{ismobileNumberValid(props.value)}</div>;
      },
    },
    {
      Header: "Role",
      accessor: "role",
      Cell: (props) => {
        return <div>{isDataValid(props.value)}</div>;
      },
    },
  ];

  const handleClick = (e) => {
    hiddenFileInput.current.click();
  };

  const handleChange = (e) => {
    const fileUploaded = e.target.files[0];
    setFile(fileUploaded.name.substring(0, fileUploaded.name.lastIndexOf(".")));
    handleFile(fileUploaded);
  };

  const handleFile = (file) => {
    const formData = new FormData();
    const fileReader = new FileReader();
    formData.append("file", file);

    if (file) {
      fileReader.onload = function (event) {
        const text = event.target.result;
        csvFileToArray(text);
      };
      fileReader.readAsText(file);
    }
  };

  const csvFileToArray = (string) => {
    let invalidUserData = [];
    const csvHeader = string.trim().slice(0, string.indexOf("\n")).split(",");
    if (!csvHeader[csvHeader.length - 1]) {
      csvHeader.pop();
    }

    const csvRows = string
      .slice(string.indexOf("\n") + 1)
      .split("\n")
      .filter((item) => item);
    const tableUserList = csvRows.map((i) => {
      const values = i.split(",");
      let obj = csvHeader.reduce((object, header, index) => {
        object[header.trim()] = values[index]?.trim()?.replace("\r", "");
        return object;
      }, {});

      if (
        !emailExp.test(obj?.email?.toString()) ||
        !mobNumberExp.test(obj?.mobile_number?.toString()) ||
        obj?.full_name == "" ||
        obj?.email == "" ||
        obj?.mobile_number == "" ||
        obj?.role == ""
      ) {
        obj["isRowInvalid"] = true;
        invalidUserData.push(obj);
      }

      return obj;
    });

    setTableUserList(tableUserList);
    setAllUsersList(tableUserList); // setting the all user list again to use it in on toggle
    setInvalidTableUserList(invalidUserData);
    setTableDataReady(true);
  };

  const handleToggleChange = (e) => {
    setInvalidUserDataFlag(!invalidUserDataFlag);
  };

  const createUsers = async () => {
    let errorFlag = false;
    let postDataKeyCloak = {};

    let postDataHasura = {
      assessors: [],
      regulators: [],
    };

    console.log("Keycloak - ", postDataKeyCloak);
    try {
      setSpinner(true);
      let accessTokenObj = {
        grant_type: "client_credentials",
        client_id: "admin-api",
        client_secret: "edd0e83d-56b9-4c01-8bf8-bad1870a084a",
      };
      //Access Token API call
      // const accessTokenResponse = await userService.getAccessToken(
      //   accessTokenObj
      // );
      // if (accessTokenResponse.status !== 200) {
      //   errorFlag = true;
      // }
      // setCookie(
      //   "access_token",
      //   "Bearer " + accessTokenResponse?.data?.access_token
      // );
      setCookie("access_token", process.env.REACT_APP_AUTH_TOKEN);

      //keycloak API call
      selectedRows.map(async (item) => {
        postDataKeyCloak = {
          request: {
            firstName: item.values.fname,
            lastName: item.values.lname,
            email: item.values.email,
            username: item.values.email,
            enabled: true,
            emailVerified: false,
            credentials: [
              {
                type: "password",
                value: `${item.values.mobile_number}`,
                temporary: "false",
              },
            ],
            attributes: {
              Role: item.values.role,
            },
          },
        };

        const keycloakRes = await createBulkUsersKeyCloak(postDataKeyCloak);
        console.log("keycloak response - ", keycloakRes);
        if (keycloakRes?.data) {
          if (item.values.role === "Assessor") {
            postDataHasura["assessors"].push({
              code: `${Math.floor(1000 + Math.random() * 9000)}`,
              user_id: keycloakRes.data,
              email: item.values.email,
              name: item.values.full_name,
              phonenumber: item.values.mobile_number,
              fname: item.values.fname,
              lname: item.values.lname,
              role: item.values.role,
            });
          }
          if (item.values.role === "Desktop-Admin") {
            postDataHasura["regulators"].push({
              user_id: keycloakRes.data,
              email: item.values.email,
              full_name: item.values.full_name,
              phonenumber: item.values.mobile_number,
              fname: item.values.fname,
              lname: item.values.lname,
              role: item.values.role,
            });
          }
        }
      });
      setTimeout(async () => {
        console.log(postDataHasura);
        //Hasura API call
        const hasuraRes = await createBulkUserHasura(postDataHasura);
        if (hasuraRes.status !== 200) {
          errorFlag = true;
        }
      }, 3000);

      if (!errorFlag) {
        setToast((prevState) => ({
          ...prevState,
          toastOpen: true,
          toastMsg: "User(s) Created Successfully!!",
          toastType: "success",
        }));
        closeBulkUploadUsersModal(false);
      }
      removeCookie("access_token");
    } catch (error) {
      console.log("error - ", error);
      setToast((prevState) => ({
        ...prevState,
        toastOpen: true,
        toastMsg: "Error occured while creating user(s)!",
        toastType: "error",
      }));
    } finally {
      setSpinner(false);
    }
  };

  const isFileValid = () => {
    let flag = true;
    COLUMNS.forEach((item) => {
      if (tableUserList.length) {
        if (!Object.keys(tableUserList[0])?.includes(item.accessor)) {
          flag = false;
          return;
        }
      } else {
        flag = false;
      }
    });
    return flag;
  };

  const setSelectedRows = (rowList) => {
    selectedRows = [...rowList].filter((item) => !item.original.isRowInvalid);
    if (selectedRows.length) {
      document.getElementById("schedule-bulk-assessment").disabled = false;
    } else {
      document.getElementById("schedule-bulk-assessment").disabled = true;
    }
    // console.log(selectedRows);
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center fixed inset-0 bg-opacity-25 backdrop-blur-sm">
        <div className="flex bg-white rounded-xl shadow-xl border border-gray-400 w-[860px] h-[560px] p-8">
          <div className="flex flex-col justify-between w-full ">
            <div className="flex text-xl font-semibold">
              <h1>Bulk upload users</h1>

              <div className="flex flex-row m-auto">
                {tableUserList.length !== 0 && isFileValid() && (
                  <Switch
                    id="show-with-errors"
                    label={<span className="text-sm">Show with errors</span>}
                    onChange={handleToggleChange}
                  />
                )}
              </div>

              <div className=" flex-row text-blue-500">
                <Link
                  to="/files/Template_bulk_user_create.csv"
                  target="_blank"
                  download
                >
                  <small>Download Template</small>
                </Link>
              </div>
            </div>

            <div className="justify-center flex flex-col items-center gap-4">
              {(!tableDataReady || (tableDataReady && !isFileValid())) && (
                <div className="flex flex-row m-auto">
                  <input
                    type={"file"}
                    accept={".csv"}
                    ref={hiddenFileInput}
                    style={{ display: "none" }}
                    onChange={handleChange}
                  />

                  <Button
                    moreClass="text-white w-full px-6"
                    text="Browse file to upload"
                    onClick={handleClick}
                  />
                </div>
              )}
              {tableDataReady && !isFileValid() && (
                <div className="text-xl flex-row text-blue-500">
                  Please upload csv file with supported data format. Kindly
                  refer the template!
                </div>
              )}
              {tableDataReady && isFileValid() && (
                <div className="items-center">
                  <div className="text-2xl w-full mt-4 font-medium">
                    <FilteringTable
                      moreHeight="h-[300px]"
                      pagination={false}
                      dataList={
                        invalidUserDataFlag
                          ? invalidTableUserList
                          : tableUserList
                      }
                      columns={COLUMNS}
                      navigateFunc={() => {}}
                      showCheckbox={true}
                      showFilter={false}
                      // rows = {rows}
                      setSelectedRows={setSelectedRows}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <hr />
              <div className="footer flex flex-row gap-4 justify-end">
                <Button
                  onClick={() => {
                    closeBulkUploadUsersModal(false);
                  }}
                  moreClass="border border-gray-200 bg-white text-blue-600 w-[120px]"
                  text="Cancel"
                ></Button>

                {tableDataReady && (
                  <Button
                    id="schedule-bulk-assessment"
                    onClick={() => {
                      createUsers();
                    }}
                    moreClass="border text-white w-[120px]"
                    text="Create users"
                  ></Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BulkUploadUsersModal;

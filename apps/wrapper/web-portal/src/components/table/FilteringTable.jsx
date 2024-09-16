import React, { useEffect, useState } from "react";

import {
  useTable,
  useGlobalFilter,
  useSortBy,
  usePagination,
  useRowSelect,
} from "react-table";

import { Checkbox } from "@material-tailwind/react";
import GlobalFilter from "./GlobalFilter";

import {
  AiOutlineArrowUp,
  AiOutlineArrowDown,
  AiFillExclamationCircle,
} from "react-icons/ai";

const FilteringTable = (props) => {
  let array = [];
  const columns = props?.columns;
  const data = props?.dataList;
  const [selectedRows, setSelectedRows] = useState([]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    // rows,
    prepareRow,
    state,
    setGlobalFilter,
    page,
    setPageSize,
    selectedFlatRows,
  } = useTable(
    {
      columns,
      data /* initialState : {
      pageSize: 200
    } */,
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,

    (hooks) => {
      if (props.showCheckbox) {
        hooks.visibleColumns.push((columns) => {
          return [
            {
              id: "selection",
              Header: ({ getToggleAllRowsSelectedProps }) => (
                <Checkbox {...getToggleAllRowsSelectedProps()} />
              ),

              Cell: ({ row }) => {
                if (row.original.isRowInvalid === true) {
                  return (
                    <AiFillExclamationCircle className="text-red-400 text-2xl" />
                  );
                } else {
                  return <Checkbox {...row.getToggleRowSelectedProps()} />;
                }
                // return <Checkbox {...row.getToggleRowSelectedProps()} />;
              },
            },
            ...columns,
          ];
        });
      }
    }
  );

  const { globalFilter } = state;

  const { setPaginationInfo } = props;
  const { limit: pageSize, offsetNo, totalCount } = props?.paginationInfo || {};
  const [canNextPage, setCanNextPage] = useState(false);

  const [canPreviousPage, setCanPreviousPage] = useState(false);
  const [pageIndex, setPageIndex] = useState(-1);
  const [totalPageCount, setTotalPageCount] = useState(0);

  const nextPage = () => {
    setPageIndex((prevState) => prevState + 1);
    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: offsetNo + pageSize,
    }));
  };

  const previousPage = () => {
    setPageIndex((prevState) => prevState - 1);

    setPaginationInfo((prevState) => ({
      ...prevState,
      offsetNo: offsetNo - pageSize,
    }));
  };

  useEffect(() => {
    if (!props.pagination) {
      setPageSize(1000);
    }
  }, []);

  useEffect(() => {
    if (pageIndex > 0) {
      setCanPreviousPage(true);
    } else {
      setCanPreviousPage(false);
    }
  }, [pageIndex, totalCount]);

  useEffect(() => {
    setTotalPageCount(Math.ceil(totalCount / pageSize));

    if (
      Math.ceil(totalCount / pageSize) > 1 &&
      pageIndex < Math.ceil(totalCount / pageSize) - 1
    ) {
      setCanNextPage(true);
    } else {
      setCanNextPage(false);
    }
  }, [totalCount, pageSize, pageIndex]);

  useEffect(() => {
    if (!offsetNo) {
      setPageIndex(0);
    }
    if (!totalCount) {
      setPageIndex(-1);
    }
  }, [offsetNo, totalCount]);

  useEffect(() => {
    if (props.showCheckbox) {
      props.setSelectedRows(selectedFlatRows);
    }
  }, [selectedFlatRows]);

  return (
    <>
      {props.showFilter && (
        <GlobalFilter
          filter={globalFilter}
          setFilter={setGlobalFilter}
          filterApiCall={props.filterApiCall}
          searchApiCall={props.searchApiCall}
          setIsSearchOpen={props.setIsSearchOpen}
          setIsFilterOpen={props.setIsFilterOpen}
          paginationInfo={props.paginationInfo}
          setPaginationInfo={props.setPaginationInfo}
          selectedRound={props?.selectedRound}
        />
      )}

      <div className={`overflow-x-auto ${props.moreHeight}`}>
        <table
          {...getTableProps()}
          className="w-full text-sm text-left text-gray-500 dark:text-gray-400"
        >
          <thead className="text-xs text-gray-700 uppercase bg-gray-300 dark:bg-gray-700 dark:text-gray-400">
            {headerGroups?.map((headerGroup, index) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={index}>
                {headerGroup.headers?.map((column, idx) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="p-4"
                    key={`${index}_${idx}`}
                  >
                    <span className="inline-block">
                      {column.render("Header")}
                    </span>

                    <span className="inline-block">
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          <AiOutlineArrowUp />
                        ) : (
                          <AiOutlineArrowDown />
                        )
                      ) : (
                        ""
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody {...getTableBodyProps()}>
            {page?.map((row, index) => {
              prepareRow(row);
              return (
                <tr
                  {...row.getRowProps()}
                  className={`bg-opacity-25 border-b dark:bg-gray-800 dark:border-gray-700 cursor-pointer ${
                    row.original.status?.toLowerCase() === "in progress"
                      ? "bg-yellow-400"
                      : row.original.status?.toLowerCase() === "resubmitted"
                      ? "bg-orange-400"
                      : row.original.status?.toLowerCase() ===
                        "inspection scheduled"
                      ? "bg-blue-400"
                      : row.original.status?.toLowerCase() ===
                        "application submitted"
                      ? "bg-green-400"
                      : row.original.status?.toLowerCase() === "na"
                      ? "bg-red-400"
                      : row.original.status?.toLowerCase() === "oga completed"
                      ? "bg-purple-400"
                      : row.original.status?.toLowerCase() === "approved"
                      ? "bg-teal-400"
                      : row.original.status?.toLowerCase() === "rejected"
                      ? "bg-pink-400"
                      : "bg-white"
                  }`}
                  onClick={() => props.navigateFunc(row)}
                  key={index}
                >
                  {row.cells?.map((cell, idx) => {
                    return (
                      <td
                        {...cell.getCellProps()}
                        className="p-4"
                        key={`${index}_${idx}`}
                      >
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {props.pagination && (
        <div className="flex flex-col">
          {!totalCount && (
            <div className="flex justify-center my-4 border-[1px] text-xl p-4 bg-[#f9f9f9]">
              No data
            </div>
          )}
          <div className="flex flex-row font-normal text-[16px] py-8 gap-8">
            <div className="flex flex-row flex-grow gap-12 items-center">
              <div className="font-bold">
                Total number of record(s): {totalCount}
              </div>

              <div className="font-bold">
                Page: {pageIndex + 1} of {totalPageCount}
              </div>
            </div>

            <div className="flex flex-row gap-6">
              <button
                className="px-3 text-gray-300 border bg-blue-700 font-medium rounded-[4px] text-white"
                onClick={() => {
                  setPaginationInfo((prevState) => ({
                    ...prevState,

                    offsetNo: 0,
                  }));
                }}
                disabled={!canPreviousPage}
              >
                {"<<"}
              </button>

              <button
                className="border text-gray-300 bg-blue-700 w-[140px] h-[40px] font-medium rounded-[4px] text-white"
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                Previous
              </button>

              <select
                className="border text-gray-300 p-2 bg-blue-700 w-[140px] h-[40px] font-medium rounded-[4px] text-white"
                value={pageSize}
                onChange={(e) => {
                  setPaginationInfo((prevState) => ({
                    ...prevState,

                    limit: Number(e.target.value),

                    offsetNo: 0,
                  }));

                  setPageSize(Number(e.target.value));
                }}
              >
                {[10, 25, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>

              <button
                className="border text-gray-300 bg-blue-700 w-[140px] h-[40px] font-medium rounded-[4px] text-white"
                onClick={() => nextPage()}
                disabled={!canNextPage}
              >
                Next
              </button>

              <button
                className="px-3 text-gray-300 border bg-blue-700 font-medium rounded-[4px] text-white"
                onClick={() => {
                  setPaginationInfo((prevState) => ({
                    ...prevState,

                    offsetNo: pageSize * (totalPageCount - 1),
                  }));

                  setPageIndex(totalPageCount - 1);
                }}
                disabled={!canNextPage}
              >
                {">>"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilteringTable;

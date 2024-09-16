import React, { useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";

import { FaAngleRight } from "react-icons/fa";

import { Button } from "../../components";

import { FaThumbsUp } from "react-icons/fa";

import ADMIN_ROUTE_MAP from "../../routes/adminRouteMap";

export default function NocIssued({ notification }) {
  const navigate = useNavigate();
  let { round } = useParams();

  console.log(round)

  const goBack = () => {
    navigate(-1);
  };
  return (
    <>
      {/* Breadcrumb */}

      <div className="h-[48px] bg-white flex justify-start drop-shadow-sm">
        <div className="container mx-auto flex px-3">
          <div className="flex flex-row font-bold gap-2 items-center">
            <Link to={ADMIN_ROUTE_MAP.adminModule.onGroundInspection.home}>
              <span className="text-primary-400">
                On Ground Inspection - All applications
              </span>
            </Link>
            <FaAngleRight className="text-[16px]" />
            <Link>
              <span onClick={goBack} className="text-primary-400">
                Back to application
              </span>
            </Link>
            <FaAngleRight className="text-[16px]" />
            <span className="text-gray-500 uppercase">
              {(round === "1") ? "NOC issued" : "Certificate issued"} 
              </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-8 text-center">
        <div className="rounded-full w-[60px] h-[60px] items-center flex mx-auto bg-gray-300">
          <FaThumbsUp className="text-green-700 w-full text-2xl" />
        </div>
        <h2 className="text-xl font-semibold m-2">
          {(round === "1") ? "NOC has been issued" : "Certificate has been issued"}                   
          </h2>
        <div className="text-m">
          We will review your application and proceed with next steps.
        </div>
        <div>
          You can keep the track status of this application under 'My
          applications' section.
        </div>
        <div className="flex place-items-end mx-auto gap-4">
          <Button
            onClick={() => navigate(`${ADMIN_ROUTE_MAP.adminModule.onGroundInspection.home}`)}
            moreClass="px-6 m-2 text-white"
            text="Back to applications"
          />
        </div>
      </div>
    </>
  );
}

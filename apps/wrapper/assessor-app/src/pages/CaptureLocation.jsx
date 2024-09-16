import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ROUTE_MAP from "../routing/routeMap";

import { StateContext } from "../App";
import {
  getCookie,
  getSpecificDataFromForage,
  setToLocalForage,
} from "../utils";

import Button from "../components/Button";
import CommonLayout from "../components/CommonLayout";
import Loader from "../components/Loader";

const CaptureLocation = () => {
  const [lat, setLat] = useState();
  const [long, setLong] = useState();
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showContinue, setShowContinue] = useState(false);
  const [captureLocation, setLocationCapture] = useState("");
  const [role, setRole] = useState("");
  const [distance, setDistance] = useState(9999);
  const [error, setError] = useState(false);
  const { state, setState } = useContext(StateContext);
  const [assessmentObj, setAssessmentObj] = useState({});
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 769;

  const getLocationPermissions = () => {
    getGeolocationCoordinates();
    navigator.permissions &&
      navigator.permissions
        .query({ name: "geolocation" })
        .then(function (PermissionStatus) {
          PermissionStatus.addEventListener("change", function (e) {
            if (e.currentTarget.state === "denied") {
              setError(
                `Please allow location access && reload the page to continue`
              );
            }

            if (e.currentTarget.state === "granted") {
              getGeolocationCoordinates();
              setError(false);
            }
          });

          if (PermissionStatus.state === "granted") {
            getGeolocationCoordinates();
          } else if (PermissionStatus.state === "prompt") {
            setError(`Please allow location access to continue`);
          } else {
            setError(
              `Please allow location access and reload the page to continue`
            );
          }
        });
  };

  const getGeolocationCoordinates = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        setLat(p.coords.latitude);
        setLong(p.coords.longitude);
        setShowMap(true);
        setLoading(false);
      });
    } else {
      setError(`Please allow location access.`);
      setLoading(false);
      setTimeout(() => {
        setError(false);
      }, 5000);
    }
  };

  const handleCaptureLocation = (flag) => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (p) => {
        setLat(p.coords.latitude);
        setLong(p.coords.longitude);
        setShowMap(true);
        setLoading(false);

        setState({
          ...state,
          userData: {
            ...state?.userData,
            lat: p.coords.latitude,
            long: p.coords.longitude,
          },
        });

        // Stored the assessment info, helps on reload...
        let assessment_obj = await getSpecificDataFromForage("todayAssessment");
        const userData = {
          userData: {
            lat: p.coords.latitude,
            long: p.coords.longitude,
          },
        };

        assessment_obj = { ...assessment_obj, ...userData };
        setAssessmentObj(assessment_obj);
        setToLocalForage("todayAssessment", assessment_obj);

        setDistance(
          calcDistance(
            p.coords.latitude,
            p.coords.longitude,
            assessment_obj.todayAssessment.latitude,
            assessment_obj.todayAssessment.longitude
          )
        );

        if (flag) {
          setLocationCapture("Location re-captured!");
        } else {
          setLocationCapture("Location captured!");
        }

        setShowContinue(true);
      });
    } else {
      setError(`Please allow location access.`);
      setLoading(false);
      setTimeout(() => {
        setError(false);
      }, 5000);
    }
  };

  function calcDistance(lat1, lon1, lat2, lon2) {
    var d;
    try {
      var R = 6371000; // radius of earth in metres
      var dLat = toRad(lat2 - lat1);
      var dLon = toRad(lon2 - lon1);
      var lat1 = toRad(lat1);
      var lat2 = toRad(lat2);

      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) *
          Math.sin(dLon / 2) *
          Math.cos(lat1) *
          Math.cos(lat2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      d = R * c;
    } catch (err) {
      console.log(err);
      setError("An error occured: " + err.toString());
      setTimeout(() => setError(false), 5000);
    }
    return d;
  }

  // Converts numeric degrees to radians
  function toRad(Value) {
    return (Value * Math.PI) / 180;
  }

  const handleSubmit = () => {
    if (
      !assessmentObj?.todayAssessment?.latitude ||
      !assessmentObj?.todayAssessment?.longitude
    ) {
      navigate(
        `${ROUTE_MAP.capture_selfie}/${assessmentObj.userData.lat}/${assessmentObj.userData.long}`
      );

      setTimeout(() => {
        setError(false);
      }, 5000);
      return;
    } else {
      if (distance > 500) {
        setError(`Please ensure you are within the institute premises`);
        setTimeout(() => {
          setError(false);
        }, 5000);
        return;
      }
    }

    if (!lat || !long) {
      setError(`Please capture location before continuing`);
      setTimeout(() => {
        setError(false);
      }, 5000);
      return;
    }

    navigate(
      `${ROUTE_MAP.capture_selfie}/${assessmentObj.todayAssessment.latitude}/${assessmentObj.todayAssessment.longitude}`
    );
  };

  useEffect(() => {
    if (lat != 0 && long != 0) {
      getLocationPermissions();
    }
  }, [lat, long]);

  useEffect(() => {
    // const { user: { registrations } } = getCookie("userData");
    // const roles = registrations[0]?.roles[0];
    // setRole(roles);
    getLocationPermissions();
  }, []);

  return (
    <CommonLayout
      back={
        role == "Medical"
          ? ROUTE_MAP.medical_assessments
          : ROUTE_MAP.assessment_type
      }
      logoutDisabled
      iconType="close"
      pageTitle="1. Capture Location"
      pageDesc="Enable location in your mobile settings and capture Institute's location"
    >
      <div className="flex flex-col px-6 gap-5 pb-5 overflow-y-auto">
        <div className="flex flex-col w-full text-center gap-5">
          {loading && <Loader></Loader>}

          {showMap && !loading && (
            <>
              <div
                className={`w-full ${
                  showContinue ? "pointer-events-none" : ""
                }`}
              >
                <iframe
                  src={`https://maps.google.com/maps?q=${lat},${long}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  width={isMobile ? "100%" : "60%"}
                  loading="lazy"
                  title="map"
                  className={`animate__animated animate__fadeIn ${
                    showContinue ? "h-[40vh]" : "h-[50vh]"
                  } `}
                />
              </div>
              <div className="text-[18px] text-[#009A2B] font-semibold">
                {captureLocation}
              </div>
            </>
          )}
        </div>

        {error && (
          <span className="text-white animate__animated animate__headShake bg-red-500 font-medium px-4 py-3 text-center mt-2">
            {error}
          </span>
        )}

        <div className="flex flex-col gap-4">
          {showMap && !showContinue && !loading && (
            <Button
              text="Capture Location"
              onClick={() => handleCaptureLocation()}
              styles="border-primary bg-primary text-white animate__animated animate__fadeInDown"
            />
          )}
          {showContinue && !loading && (
            <>
              <Button
                text="Continue"
                styles="bg-primary border-primary text-white"
                onClick={handleSubmit}
              />

              <Button
                text="Re-capture Location"
                onClick={() => handleCaptureLocation("re-capture")}
                styles={`bg-white border-primary text-primary animate__animated animate__fadeInDown`}
              />
            </>
          )}
        </div>
      </div>
    </CommonLayout>
  );
};

export default CaptureLocation;

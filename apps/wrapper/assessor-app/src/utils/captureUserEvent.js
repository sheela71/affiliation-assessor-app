import { getCookie } from ".";
import { postUserEvents } from "../api";

export const logUserEvents = (
  eventType,
  eventLevel,
  message,
  sessionId = 123,
) => {
  const uuid = crypto.randomUUID();
  const epochDateTime = Date.now();
  const user_data = getCookie('userData');
  const userId = user_data?.user?.id
  const userRole = user_data?.user?.registrations[0]?.roles[0]


  const func = async () => {
    const currentEvent = {
      eid: "LOG",
      ets: epochDateTime, //[Epoch timestamp of event (time in milli-seconds)]
      ver: "1.0.0",
      mid: `LOG:${uuid}`, //uuid random
      actor: {
        id: userId,
        type: userRole,
      },
      context: {
        channel: "",
        pdata: {
          id: "prod.assessor.app",
          ver: "1.0.0",
          pid: "assessor-app",
        },
        env: "mobile-app",
        sid: sessionId, //session id of the user
        did: getCookie("deviceId"), //id of the device
        cdat: [
          {
            id: uuid, //co-realtion id - UUID.randomUUID().toString();
            type: "UserSession",
          },
        ],
      },
      object: {},
      tags: [""],
      edata: {
        type: eventType, //type of event- API call, button clicked etc
        level: eventLevel, //info, success, error
        message: message, //message from the API call or the type of user event
        dateTime: epochDateTime, //[Epoch timestamp of event (time in milli-seconds)]
      },
    };
    console.log("currentEvent - ", currentEvent);

    const res = await postUserEvents(currentEvent);
    console.log(res);
  };
  func();
};

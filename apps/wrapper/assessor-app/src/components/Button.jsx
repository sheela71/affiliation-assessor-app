import React from "react";
import { logUserEvents } from "../utils/captureUserEvent";
import { constants as C } from "../utils/constants";

const Button = ({ text, onClick, styles = "", css,
  userEventMessage=""}) => {
    const handleOnClick = () =>{
      onClick();
      if(userEventMessage)logUserEvents(C.BUTTON_CLICK,C.INFO,userEventMessage)
    }
  return (
    <button
      onClick={handleOnClick}
      style={css}
      className={`transition-all duration-300 border-2 font-medium py-3 text-[18px] ${styles}`}
    >
      {text}
    </button>
  );
};

export default Button;

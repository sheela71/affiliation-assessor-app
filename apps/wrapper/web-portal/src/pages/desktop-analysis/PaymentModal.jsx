import { Label,Button } from "../../components";
import { readableDate } from "../../utils/common";

const PaymentModal = ({ modalDetails, setViewPaymentModal }) => {
  const {paymentDetails} = modalDetails

  return (
    <div>
      <div className="flex flex-col justify-center items-center fixed inset-0 bg-opacity-25 backdrop-blur-sm z-[999]">
        <div className="flex flex-col bg-white rounded-xl shadow-xl border border-gray-400 w-[600px] h-[600px] p-8 gap-8">
          <section>
            <div className="flex flex-col justify-between w-full">
              <div className="font-bold text-2xl text-center mb-8">
                Payment Details
              </div>

              <div
                className={`flex flex-col gap-3 min-h-[388px] max-h-[388px] overflow-y-auto justify-center`}
              >
               
                    <div
                      className="flex flex-col bg-gray-100 p-3 rounded-[4px] gap-3"
                    >
                      <div className="flex flex-row gap-4">
                        <div className="flex-1 flex-col">
                          <Label text="Institute name"></Label>
                          <div className="text-lg">
                            {paymentDetails?.collegeName || "NA"}
                          </div>
                        </div>
                        <div className="flex-1 flex-col">
                          <Label text="Application Type"></Label>
                          <div className="text-lg">
                            {paymentDetails?.applicationType || "NA"}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row gap-4">
                        <div className="flex-1 flex-col">
                          <Label text="Amount"></Label>
                          <div className="text-lg">
                            {paymentDetails?.amount || "NA"}
                          </div>
                        </div>
                        <div className="flex-1 flex-col">
                          <Label text="Date"></Label>
                          <div className="text-lg">
                            {readableDate(paymentDetails?.dateTime) || "NA"}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row gap-4">
                        <div className="flex-1 flex-col flex-grow">
                          <Label text="Reference Number"></Label>
                          <div className="text-lg">
                            {paymentDetails?.referenceNumber || "NA"}
                          </div>
                        </div>
                        <div className="flex-1 flex-col flex-grow">
                          <Label text="Transaction Id"></Label>
                          <div className="text-lg">
                            {paymentDetails?.transactionId || "NA"}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row gap-4">
                        <div className="flex-1 flex-col">
                          <Label text="Institute name"></Label>
                          <div className="text-lg">
                            {paymentDetails?.PaymentStatus || "NA"}
                          </div>
                        </div>
                      </div>
                    </div>
              </div>
            </div>
          </section>

          <footer>
            <div className="footer flex flex-row gap-4 justify-end">
              <Button
                onClick={() => {
                        setViewPaymentModal((prevState)=>({
                                ...prevState,
                                flag: false
                              }))
                }}
                moreClass="border border-gray-200 bg-white text-blue-600 w-[120px]"
                text="Close"
              ></Button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Step from "./Step";
import NoticeNoArtifact from "./NoticeNoArtifact";
import NoticeWrongNetwork from "./NoticeWrongNetwork";
import ConnectWallet from "./ConnectWallet";
import Settings from "./Settings";
import SwaptoETH from "./SwaptoETH"
import DepositMixer from "./DepositMixer";
import WithdrawMixer from "./WithdrawMixer";


function Main() {
  const { state } = useEth();
  //const [value, setValue] = useState("?");
  const [step, setStep] = useState("");
  const [selectedValues, setSelectedValues] = useState([]);

  const main =
      <div>
        <Step step={step} setStep={setStep} />
        <ConnectWallet step={step} setStep={setStep} selectedValues={selectedValues} setSelectedValues={setSelectedValues} />
        {step === "1"  && ( <Settings  selectedValues={selectedValues} setSelectedValues={setSelectedValues} /> )}
        {step === "2"  && ( <SwaptoETH selectedValues={selectedValues} setSelectedValues={setSelectedValues}/> )}
        {step === "3"  && ( <DepositMixer/> )}
        {step === "4"  && ( <WithdrawMixer/> )}
      </div>;

  return (
    <div className="main">
      {
        !state.artifact ? <NoticeNoArtifact /> :
          !state.contract ? <NoticeWrongNetwork /> :
            main
      }
    </div>
  );
}

export default Main;


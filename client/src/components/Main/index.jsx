import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Step from "./Step";
import NoticeNoArtifact from "./NoticeNoArtifact";
import NoticeWrongNetwork from "./NoticeWrongNetwork";
import ConnectWallet from "./ConnectWallet";
import SwaptoETH from "./SwaptoETH";
import StepFunctions from "./StepFunctions";
import DepositMixer from "./DepositMixer";
import WithdrawMixer from "./WithdrawMixer";

/*  const handleInputChange = e => {
    if (/^\d+$|^$/.test(e.target.value)) {
      setInputValue(e.target.value);
    }
  };*/ 
function Main() {
  const { state } = useEth();
  //const [value, setValue] = useState("?");
  const [step, setStep] = useState("");
  const [selectedValues, setSelectedValues] = useState([]);

  const main =
      <div>
        <Step step={step} setStep={setStep} />
        {/*<StepFunctions step={step} setStep={setStep} />*/}
        {/*<Contract value={value} />
        <ContractBtns setValue={setValue} />*/}
        <ConnectWallet step={step} setStep={setStep} selectedValues={selectedValues} setSelectedValues={setSelectedValues} />
        {step === "2"  && ( <SwaptoETH step={step} setStep={setStep}  selectedValues={selectedValues} setSelectedValues={setSelectedValues}/> )}
        {step === "3"  && (  <DepositMixer/> )}
        {step === "4"  && (  <WithdrawMixer/> )}
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


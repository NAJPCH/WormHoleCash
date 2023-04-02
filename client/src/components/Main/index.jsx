//import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Step from "./Step";
//import Contract from "./Contract";
//import ContractBtns from "./ContractBtns";
import NoticeNoArtifact from "./NoticeNoArtifact";
import NoticeWrongNetwork from "./NoticeWrongNetwork";
import ConnectWallet from "./ConnectWallet";
import StepFunctions from "./StepFunctions";

function Main() {
  const { state } = useEth();
  //const [value, setValue] = useState("?");

  const main =
      <div>
        <Step />
        <StepFunctions />
        {/*<Contract value={value} />
        <ContractBtns setValue={setValue} />*/}
        <ConnectWallet />
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

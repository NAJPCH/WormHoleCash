//import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Title from "./Title";
//import Contract from "./Contract";
//import ContractBtns from "./ContractBtns";
import NoticeNoArtifact from "./NoticeNoArtifact";
import NoticeWrongNetwork from "./NoticeWrongNetwork";
import ConnectWallet from "./ConnectWallet";

function Main() {
  const { state } = useEth();
  //const [value, setValue] = useState("?");

  const main =

      <div className="contract-container">
        {/*<Contract value={value} />
        <ContractBtns setValue={setValue} />*/}
        <ConnectWallet />
      </div>;

  return (
    <div className="main">
      <Title />
      {
        !state.artifact ? <NoticeNoArtifact /> :
          !state.contract ? <NoticeWrongNetwork /> :
            main
      }
    </div>
  );
}

export default Main;

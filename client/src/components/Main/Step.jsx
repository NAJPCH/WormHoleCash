import { useEffect, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import { Button, Progress } from '@chakra-ui/react';

const Step = ({step, setStep}) => {
    const { state: { contract , accounts, txhash, web3} } = useEth();
   //const [newEvents, setNewEvents] = useState([]);
    
    const [newEvents, setNewEvents] = useState([]);

    const getCurrentStep = async () => {
        const currentStep =await contract.methods.getCurrentStep().call({ from: accounts[0] });
        setStep(currentStep);
    };

    useEffect(() => {
        async function getPastEvent() {
            const deployTx = await web3.eth.getTransaction(txhash);
            const results = await contract.getPastEvents("WorkflowStatusChange", { fromBlock: deployTx.blockNumber, toBlock: "latest" });
            
            const pastWorkflowEvents = results.map((workflowEvent) => {
                let pastE = {previousStatus: null, newStatus: null};
                pastE.previousStatus = workflowEvent.returnValues.previousStatus;
                pastE.newStatus = workflowEvent.returnValues.newStatus;
                return pastE;
            });
            setNewEvents(pastWorkflowEvents);
        }
        getPastEvent();

        contract.events.StepChanged({ fromBlock: "latest" })
            .on("data", (event) => {
                let newEvent = {previousStatus: null, newStatus: null};
                newEvent.previousStatus = event.returnValues.previousStatus;
                newEvent.newStatus = event.returnValues.newStatus;
                
                let events = newEvents;
                events.push(newEvent);
                setNewEvents(events)
                console.log(newEvents);
            });
    }, [contract , accounts, txhash, web3, step]);

    getCurrentStep();


  const RESET = async e => { await contract.methods.RESET().send({ from: accounts[0] }); };

    return (
        <div> 
            <h2>Steps process</h2>
            <Progress value={step*12.5} />
            <Button colorScheme='blue' onClick={getCurrentStep}>getCurrentStep</Button>
            <Button colorScheme='red' onClick={RESET}>RESET</Button>
            <p>step:{step}</p>
        </div>     
);
};

export default Step;

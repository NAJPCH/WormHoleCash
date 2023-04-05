import { useEffect, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import { Button, Progress, Grid, GridItem, Center } from "@chakra-ui/react";
import useToastManager from "./useToastManager"; // Importez le custom hook ici
import { ChevronRightIcon } from '@chakra-ui/icons'

const Step = ({step, setStep}) => {
    const { state: { contract , accounts, txhash, web3} } = useEth();
    const [newEvents, setNewEvents] = useState([]);
    //const toast = useToast();

    const getCurrentStep = async () => {
        const currentStep = await contract.methods.getCurrentStep().call({ from: accounts[0] });
        setStep(currentStep);
    };

    const { showToast, showToastForTransaction } = useToastManager(); // Utilisez le custom hook ici

    const RESET = async (e) => {
        const transactionPromise = contract.methods.RESET().send({ from: accounts[0] });
        showToastForTransaction(transactionPromise, (result) => {}, (error) => {});
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

                getCurrentStep();
                showToast('success', 'Transaction réussie');
            });
    }, [contract , accounts, txhash, web3]);

    getCurrentStep();

    return (
        <div> 
            <Center h='50px'></Center>
            <Progress size='xs' value={step*14.28} />
            <Grid templateColumns='repeat(7, 1fr)' gap={6}>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Token Selection</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Settings</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Swap</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Deposit on Mixer</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Withdraw of Mixer</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Swap Back</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Done</GridItem>
            </Grid>
            <Button colorScheme='red' onClick={RESET}>RESET</Button>
        </div>     
);
};

export default Step;


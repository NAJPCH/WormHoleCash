import { useEffect, useState, useCallback } from "react";
import useEth from "../../contexts/EthContext/useEth";
import { Button, Progress, Grid, GridItem, Center } from "@chakra-ui/react";
import useToastManager from "./useToastManager"; 
import { ChevronRightIcon } from '@chakra-ui/icons'

const Step = ({step, setStep}) => {
    const { state: { contract , accounts, txhash, web3} } = useEth();
    const [newEvents, setNewEvents] = useState([]);

    const { showToast, showToastForTransaction } = useToastManager(); 

    const reset = async (e) => {
        const transactionPromise = contract.methods.reset().send({ from: accounts[0] });
        showToastForTransaction(transactionPromise, (result) => {}, (error) => {});
    };

    const getCurrentStep = useCallback(async () => {
        const currentStep = await contract.methods.getCurrentStep().call({ from: accounts[0] });
        setStep(currentStep);
    }, [contract, accounts]);

    useEffect(() => {
        // Initialisation de l'étape
        getCurrentStep();
    }, [getCurrentStep]);

    useEffect(() => {
        // Gestion des événements
        async function getPastEvent() {
            if (!txhash) {
                return;
            }
        
            const deployTx = await web3.eth.getTransaction(txhash);
            const results = await contract.getPastEvents("StepChanged", {
                fromBlock: deployTx.blockNumber,
                toBlock: "latest",
                filter: { user: accounts[0] },
            });
            
            const pastWorkflowEvents = results.map((workflowEvent) => {
                let pastE = {previousStatus: null, newStatus: null};
                pastE.previousStatus = workflowEvent.returnValues.previousStatus;
                pastE.newStatus = workflowEvent.returnValues.newStatus;
                return pastE;
            });
            setNewEvents(pastWorkflowEvents);
        }
        getPastEvent();

        contract.events
            .StepChanged({ fromBlock: "latest", filter: { user: accounts[0] } })
            .on("data", (event) => {
                let newEvent = {previousStatus: null, newStatus: null};
                newEvent.previousStatus = event.returnValues.previousStatus;
                newEvent.newStatus = event.returnValues.newStatus;
                
                let events = newEvents;
                events.push(newEvent);
                setNewEvents(events);

                getCurrentStep();
            });
    }, [contract, accounts, txhash, web3]);

    return (
        <div> 
            <Center h='50px'></Center>
            <Progress size='xs' value={step*14.28} />
            <Grid templateColumns='repeat(7, 1fr)' gap={6}>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Token selection</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Settings</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Swap</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Deposit on mixer</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Withdraw of mixer</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Swap back</GridItem>
                <GridItem w='100%' h='10' ><ChevronRightIcon />Done</GridItem>
            </Grid>
            <Button colorScheme='red' onClick={reset}>Demo Reset</Button>
        </div>     
);
};

export default Step;


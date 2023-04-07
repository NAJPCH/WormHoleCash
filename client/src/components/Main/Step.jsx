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

    const reset = async (e) => {
        const transactionPromise = contract.methods.reset().send({ from: accounts[0] });
        showToastForTransaction(transactionPromise, (result) => {}, (error) => {});
    };

    useEffect(() => {
        async function getPastEvent() {
        if (!txhash) {
            return;
        }
    
        const deployTx = await web3.eth.getTransaction(txhash);
        const results = await contract.getPastEvents("StepChanged", {
            fromBlock: deployTx.blockNumber,
            toBlock: "latest",
            filter: { user: accounts[0] }, // Ajoutez cette ligne pour filtrer les événements par utilisateur
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
    //getCurrentStep();  je pense qu'il est en doublon

    contract.events
        .StepChanged({ fromBlock: "latest", filter: { user: accounts[0] } })
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
    }, [contract, accounts, txhash, web3, getCurrentStep]);

    getCurrentStep();

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
            <Button colorScheme='red' onClick={reset}>Debug Reset</Button>
        </div>     
);
};

export default Step;


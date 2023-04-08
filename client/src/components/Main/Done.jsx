import useEth from "../../contexts/EthContext/useEth";
import { Button, Center, Card, CardBody, Stack, StackDivider, Box, Text } from '@chakra-ui/react';
import useToastManager from "./useToastManager"; 

const Done = () => {
    const { state: { contract , accounts } } = useEth();


    const { showToast, showToastForTransaction } = useToastManager(); 

    const reset = async (e) => {
        const transactionPromise = contract.methods.reset().send({ from: accounts[0] });
        showToastForTransaction(transactionPromise, (result) => {}, (error) => {});
    };

    return (
        <Center><Card maxW='md' minW='500px'>
            <CardBody>
                <Stack divider={<StackDivider />} spacing='2'>
                <Box>
                    <Text color='green' pt='2' fontSize='sm'>The process is done. Enjoy your new wallet. Thanks to you to used Worm Hole Cash.</Text>
                    <Text as='i' pt='2' fontSize='sm'> Thanks to you to used Worm Hole Cash.</Text>
                </Box>

                <Box>
                    <Center>                        
                        <Button onClick={reset}>New Process</Button>
                    </Center>
                </Box>

                </Stack>
            </CardBody>
        </Card></Center>
    );
};

export default Done;

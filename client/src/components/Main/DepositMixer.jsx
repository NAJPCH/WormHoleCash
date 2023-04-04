import useEth from "../../contexts/EthContext/useEth";
import { Button, Center, Card, CardBody, Stack, StackDivider, Box, Text } from '@chakra-ui/react';

const DepositMixer = ({}) => {
    const { state: { contract , accounts } } = useEth();


    const DepositMixer = async e => { await contract.methods.DepositMixer().send({ from: accounts[0] }); };

    return (
        <Center><Card maxW='md' minW='500px'>
            <CardBody>
                <Stack divider={<StackDivider />} spacing='2'>
                <Box>
                    <Text as='i' color='tomato' pt='2' fontSize='sm'>This feature is not available at this time, please proceed to the next step</Text>
                </Box>

                <Box>
                    <Center>                        
                        <Button onClick={DepositMixer}>Deposit on Mixer</Button>
                    </Center>
                </Box>

                </Stack>
            </CardBody>
        </Card></Center>
    );
};

export default DepositMixer;

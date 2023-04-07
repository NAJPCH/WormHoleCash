import { Center } from '@chakra-ui/react'

function NoticeWrongNetwork() {
  return (
    <Center h='100px' color='white'>
      ⚠️ MetaMask is not connected to the same network as the one you deployed to.
    </Center>
  );
}

export default NoticeWrongNetwork;

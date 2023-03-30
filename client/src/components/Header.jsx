import { Flex, Spacer, Heading, Box, Image } from '@chakra-ui/react'

function Header(connected) {
  return (
  <Flex h='10'>
    <Box boxSize='100px'>
      <Image src='https://images.typeform.com/images/k2fUR6ER8DwM' alt='ALYRA' />
    </Box>
    <Spacer />
    <Box><Heading>Worm Hole Cash</Heading></Box>
    <Spacer />
    <Box></Box>
  </Flex>
  );
}

export default Header;

import { Flex, Spacer, Heading, Box, Image,  } from '@chakra-ui/react'
import { SunIcon, MoonIcon } from '@chakra-ui/icons'

function Header(connected) {
  return (
  <Flex h='10'>
    <Box >
      <Image src='../../../public/WHC_White.png' alt='WHC' />
    </Box>
    <Spacer />
    <Box><Heading>Worm Hole Cash</Heading></Box>
    <Spacer />
    <Box><SunIcon/><MoonIcon/><p>0x123...789</p></Box>
  </Flex>
  );
}

export default Header;

import { EthProvider } from "./contexts/EthContext";
import Header from "./components/Header";
import Main from "./components/Main";
import Footer from "./components/Footer";
import { Flex, Box } from '@chakra-ui/react'
import React from "react";


function App(){

//backgroundImage="url('https://images.typeform.com/images/U9fg8PdXKZz4/background/large')"
  return (
    
    <EthProvider>
      <Flex direction="column" minHeight="100vh" bgGradient='linear(to-r, gray.800, blackAlpha.900, gray.800)' color="white" width={{ base: "100%", md: "auto" }}>
        <Box p='2' bg='RGBA(0, 0, 0, 0.16)'>
          <Header />
        </Box>
        <Box p='2' flex="1">
          <Main />
        </Box>
        <Box p='2' bg='RGBA(0, 0, 0, 0.16)'>
          <Footer />
        </Box>
      </Flex>
    </EthProvider>
  );
}

export default App;
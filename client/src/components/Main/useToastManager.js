import { useToast } from "@chakra-ui/react";

const useToastManager = () => {
  const toast = useToast();

  const showToast = (status, title, duration) => {
    toast({
      title: title,
      status: status,
      isClosable: true,
      duration: duration,
      position: "top-right"
    });
  };

  const showToastForTransaction = async (transactionPromise, onSuccess, onError) => {
    showToast("info", "Opération en cours...", 6000);
    try {
      const result = await transactionPromise;
      onSuccess(result);
      showToast("success", "Transaction réussie", 3000);
    } catch (error) {
      onError(error);
      showToast("error", "Transaction échouée", 3000);
    }
  };

  return { showToast, showToastForTransaction };
};

export default useToastManager;

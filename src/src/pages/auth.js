import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Image from "next/image";
import "react-toastify/dist/ReactToastify.css";

export default function Auth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState("checking"); // "online" | "offline" | "checking"

  useEffect(() => {
    const checkBlockchainStatus = async () => {
      try {
        const { data } = await axios.get("http://localhost:3000/api/blockchain-status");
        setBlockchainStatus(data.status);
      } catch (error) {
        console.error("Erro ao verificar estado da blockchain:", error);
        setBlockchainStatus("offline");
      }
    };

    checkBlockchainStatus();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Nenhuma Wallet detectada! Instale por exemplo o MetaMask.");
      return;
    }

    if (blockchainStatus !== "online") {
      toast.error("A Blockchain está offline. Tente novamente mais tarde.");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      const message = `Pedido de Autenticação no backOffice - ${new Date().toISOString()}`;
      const signature = await signer.signMessage(message);

      setIsAuthenticating(true);

      const { data } = await axios.post(
        "http://localhost:3000/api/loginBlockchain",
        { walletAddress, message, signature },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("Login bem-sucedido! 🚀");
        setTimeout(() => router.push("/welcome"), 2000);
      } else {
        toast.error(data.error || "Falha na autenticação.");
        setIsAuthenticating(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao conectar a Wallet, tente novamente mais tarde.");
      setIsAuthenticating(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
      {isAuthenticating && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-white">A autenticar...</p>
          </div>
        </div>
      )}

      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 border border-gray-700 flex flex-col items-center">
        {/* ✅ Logo e título */}
        <div className="flex items-center space-x-3 mb-4">
          <Image src="/nextjs-icon.svg" alt="Next.js Logo" width={40} height={40} />
          <h2 className="text-2xl font-semibold">Login via Blockchain</h2>
        </div>

        {/* ✅ Botão de login */}
        <button
          onClick={connectWallet}
          className={`py-2 px-4 rounded font-bold mt-4 ${
            blockchainStatus === "offline"
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-700 text-white"
          }`}
          disabled={blockchainStatus === "offline" || loading}
        >
          {loading ? "A validar autorização ..." : "Entrar"}
        </button>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>

      {/* ✅ Indicador LED da Blockchain no canto inferior direito */}
      <div className="absolute bottom-5 right-5 flex items-center space-x-2">
        <span
          className={`w-3 h-3 rounded-full ${
            blockchainStatus === "online"
              ? "bg-green-500 animate-pulse"
              : blockchainStatus === "offline"
              ? "bg-red-500 animate-pulse"
              : "bg-gray-400"
          }`}
        ></span>
        <p className="text-sm text-gray-300">
          {blockchainStatus === "checking"
            ? "Verificando..."
            : blockchainStatus === "online"
            ? "Blockchain Online"
            : "Blockchain Offline"}
        </p>
      </div>
    </div>
  );
}
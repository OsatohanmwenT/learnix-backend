import axios from "axios";
import { config } from "dotenv";

config();

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.TEST_SECRET_KEY;

export class PaymentService {
  private readonly paystackAPI = axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  public async initializeTransaction({
    email,
    amount,
    metadata,
  }: {
    email: string;
    amount: number;
    metadata: Record<string, any>;
  }) {
    try {
      const response = await this.paystackAPI.post("/transaction/initialize", {
        email,
        amount,
        metadata,
      });
      return response.data;
    } catch (error) {
      console.error("Error initializing transaction:", error);
      throw new Error("Failed to initialize transaction");
    }
  }

  public async verifyTransaction(reference: string) {
    try {
      const response = await this.paystackAPI.get(
        `/transaction/verify/${reference}`
      );
      return response.data;
    } catch (error) {
      console.error("Error verifying transaction:", error);
      throw new Error("Failed to verify transaction");
    }
  }

  public async createTransferReceipient({
    type,
    name,
    account_number,
    bank_code,
    currency = "NGN",
  }: {
    type: string;
    name: string;
    account_number: string;
    bank_code: string;
    currency?: string;
  }) {
    try {
      const response = await this.paystackAPI.post("/transferrecipient", {
        type,
        name,
        account_number,
        bank_code,
        currency,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating transfer recipient:", error);
      throw new Error("Failed to create transfer recipient");
    }


  }

   public async initiateTransfer({
    source = "balance",
    amount,
    recipient,
    reason,
  }: {
    source?: string;
    amount: number;
    recipient: string;
    reason: string;
  }) {
    try {
      const response = await this.paystackAPI.post("/transfer", {
        source,
        amount,
        recipient,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error("Error initiating transfer:", error);
      throw new Error("Failed to initiate transfer");
    }
  }

  public async verifyTransfer(transferCode: string) {
    try {
      const response = await this.paystackAPI.get(`/transfer/verify/${transferCode}`);
      return response.data;
    } catch (error) {
      console.error("Error verifying transfer:", error);
      throw new Error("Failed to verify transfer");
    }
  }

  public async verifyAccountNumber({
    account_number,
    bank_code,
  }: {
    account_number: string;
    bank_code: string;
  }) {
    try {
      const response = await this.paystackAPI.get(
        `/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`
      );
      return response.data;
    } catch (error) {
      console.error("Error verifying account number:", error);
      throw new Error("Failed to verify account number");
    }
  }

  public async getBanks(country = "nigeria") {
    try {
      const response = await this.paystackAPI.get(`/bank?country=${country}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching banks:", error);
      throw new Error("Failed to fetch banks");
    }
  }

  public async getBalance() {
    try {
      const response = await this.paystackAPI.get("/balance");
      return response.data;
    } catch (error) {
      console.error("Error fetching balance:", error);
      throw new Error("Failed to fetch balance");
    }
  }
}

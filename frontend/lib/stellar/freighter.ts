import {
  requestAccess,
  getNetwork,
  signTransaction,
  signMessage,
  isConnected,
} from '@stellar/freighter-api';
import { NetworkType } from '@/types/wallet';
import { getNetworkPassphrase } from './wallet-utils';

export class FreighterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FreighterError';
  }
}

function freighterErrorMessage(error?: { message?: string }): string {
  return error?.message ?? 'Freighter request failed';
}

function signatureToHex(signedMessage: string | Uint8Array): string {
  const bytes =
    typeof signedMessage === 'string'
      ? Uint8Array.from(atob(signedMessage), (c) => c.charCodeAt(0))
      : new Uint8Array(signedMessage);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const connectFreighter = async (network: NetworkType): Promise<string> => {
  try {
    const access = await requestAccess();
    if (access.error || !access.address) {
      throw new FreighterError(freighterErrorMessage(access.error));
    }

    const networkResult = await getNetwork();
    if (networkResult.error) {
      throw new FreighterError(freighterErrorMessage(networkResult.error));
    }

    const expectedNetwork = network === NetworkType.MAINNET ? 'PUBLIC' : 'TESTNET';
    if (networkResult.network !== expectedNetwork) {
      throw new FreighterError(
        `Please switch Freighter to ${network} network. Current network: ${networkResult.network}`,
      );
    }

    return access.address;
  } catch (error) {
    if (error instanceof FreighterError) throw error;

    if (error instanceof Error) {
      if (error.message.includes('User declined')) {
        throw new FreighterError('Connection was declined. Please approve the connection request.');
      }
      if (error.message.includes('Freighter is not installed')) {
        throw new FreighterError(
          'Freighter wallet is not installed. Please install it from https://www.freighter.app/',
        );
      }
      throw new FreighterError(`Freighter connection failed: ${error.message}`);
    }

    throw new FreighterError('An unknown error occurred while connecting to Freighter');
  }
};

export const signTransactionWithFreighter = async (
  xdr: string,
  network: NetworkType,
): Promise<string> => {
  try {
    const networkPassphrase = getNetworkPassphrase(network);
    const result = await signTransaction(xdr, { networkPassphrase });

    if (result.error || !result.signedTxXdr) {
      throw new FreighterError(freighterErrorMessage(result.error));
    }

    return result.signedTxXdr;
  } catch (error) {
    if (error instanceof FreighterError) throw error;

    if (error instanceof Error) {
      if (error.message.includes('User declined')) {
        throw new FreighterError('Transaction signing was declined by user');
      }
      throw new FreighterError(`Transaction signing failed: ${error.message}`);
    }
    throw new FreighterError('Failed to sign transaction');
  }
};

export const checkFreighterNetwork = async (expectedNetwork: NetworkType): Promise<boolean> => {
  try {
    const networkResult = await getNetwork();
    if (networkResult.error) return false;
    const expected = expectedNetwork === NetworkType.MAINNET ? 'PUBLIC' : 'TESTNET';
    return networkResult.network === expected;
  } catch {
    return false;
  }
};

export const isFreighterAvailable = async (): Promise<boolean> => {
  try {
    const result = await isConnected();
    return !result.error && result.isConnected;
  } catch {
    return false;
  }
};

/** Signs a UTF-8 message via Freighter (SEP-53) and returns a hex-encoded Ed25519 signature. */
export const signMessageWithFreighter = async (
  message: string,
  address: string,
): Promise<string> => {
  try {
    const result = await signMessage(message, { address });
    if (result.error || !result.signedMessage) {
      throw new FreighterError(freighterErrorMessage(result.error));
    }

    return signatureToHex(result.signedMessage);
  } catch (error) {
    if (error instanceof FreighterError) throw error;

    if (error instanceof Error) {
      if (error.message.includes('User declined')) {
        throw new FreighterError('Message signing was declined by user');
      }
      throw new FreighterError(`Message signing failed: ${error.message}`);
    }
    throw new FreighterError('Failed to sign message');
  }
};

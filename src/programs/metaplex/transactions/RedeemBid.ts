import { ParamsWithStore } from '@metaplex/types';
import { Borsh } from '@metaplex/utils';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionCtorFields,
  TransactionInstruction,
} from '@solana/web3.js';
import { Transaction } from '../../../Transaction';
import { MetadataProgram } from '../../metadata';
import { VaultProgram } from '../../vault';
import { MetaplexProgram } from '../MetaplexProgram';

export class RedeemBidArgs extends Borsh.Data {
  static readonly SCHEMA = this.struct([['instruction', 'u8']]);

  instruction = 2;
}

export enum ProxyCallAddress {
  RedeemBid = 0,
  RedeemFullRightsTransferBid = 1,
}

export class RedeemUnusedWinningConfigItemsAsAuctioneerArgs extends Borsh.Data<{
  winningConfigItemIndex: number;
  proxyCall: ProxyCallAddress;
}> {
  static readonly SCHEMA = this.struct([
    ['instruction', 'u8'],
    ['winningConfigItemIndex', 'u8'],
    ['proxyCall', 'u8'],
  ]);

  instruction = 12;
  winningConfigItemIndex: number;
  proxyCall: ProxyCallAddress;
}

type RedeemBidParams = {
  vault: PublicKey;
  auction: PublicKey;
  auctionManager: PublicKey;
  bidRedemption: PublicKey;
  bidMetadata: PublicKey;
  safetyDepositTokenStore: PublicKey;
  destination: PublicKey;
  safetyDeposit: PublicKey;
  fractionMint: PublicKey;
  bidder: PublicKey;
  isPrintingType: boolean;
  safetyDepositConfig: PublicKey;
  transferAuthority: PublicKey;
  masterEdition?: PublicKey;
  reservationList?: PublicKey;
  // If this is an auctioneer trying to reclaim a specific winning index, pass it here,
  // and this will instead call the proxy route instead of the real one, wrapping the original
  // redemption call in an override call that forces the winning index if the auctioneer is authorized.
  auctioneerReclaimIndex?: number;
};

export class RedeemBid extends Transaction {
  constructor(options: TransactionCtorFields, params: ParamsWithStore<RedeemBidParams>) {
    super(options);
    const { feePayer } = options;
    const {
      store,
      vault,
      auction,
      auctionManager,
      bidRedemption,
      bidMetadata,
      safetyDepositTokenStore,
      destination,
      safetyDeposit,
      fractionMint,
      bidder,
      isPrintingType,
      safetyDepositConfig,
      transferAuthority,
      masterEdition,
      reservationList,
      auctioneerReclaimIndex,
    } = params;

    const data = auctioneerReclaimIndex
      ? RedeemUnusedWinningConfigItemsAsAuctioneerArgs.serialize({
          winningConfigItemIndex: auctioneerReclaimIndex,
          proxyCall: ProxyCallAddress.RedeemBid,
        })
      : RedeemBidArgs.serialize();

    this.add(
      new TransactionInstruction({
        keys: [
          {
            pubkey: auctionManager,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: safetyDepositTokenStore,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: destination,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: bidRedemption,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: safetyDeposit,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: vault,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: fractionMint,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: auction,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: bidMetadata,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: bidder,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: feePayer,
            isSigner: true,
            isWritable: false,
          },
          {
            pubkey: TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: VaultProgram.PUBKEY,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: MetadataProgram.PUBKEY,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: store,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: transferAuthority,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: safetyDepositConfig,
            isSigner: false,
            isWritable: false,
          },
          ...(isPrintingType && masterEdition && reservationList
            ? [
                {
                  pubkey: masterEdition,
                  isSigner: false,
                  isWritable: true,
                },
                {
                  pubkey: reservationList,
                  isSigner: false,
                  isWritable: true,
                },
              ]
            : []),
        ],
        programId: MetaplexProgram.PUBKEY,
        data,
      }),
    );
  }
}

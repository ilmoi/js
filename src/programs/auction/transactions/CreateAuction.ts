import { StringPublicKey } from '@metaplex/types';
import { Borsh } from '@metaplex/utils';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionCtorFields,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import { AuctionProgram } from '../AuctionProgram';
import { Transaction } from '../../../Transaction';
import { PriceFloor } from '../accounts/Auction';

export enum WinnerLimitType {
  Unlimited = 0,
  Capped = 1,
}

type WinnerLimitArgs = {
  type: WinnerLimitType;
  usize: BN;
};
export class WinnerLimit extends Borsh.Data<WinnerLimitArgs> {
  static readonly SCHEMA = this.struct([
    ['type', 'u8'],
    ['usize', 'u64'],
  ]);

  type: WinnerLimitType;
  usize: BN;
}

type Args = {
  winners: WinnerLimit;
  endAuctionAt: BN | null;
  auctionGap: BN | null;
  tokenMint: StringPublicKey;
  authority: StringPublicKey;
  resource: StringPublicKey;
  priceFloor: PriceFloor;
  tickSize: BN | null;
  gapTickSizePercentage: number | null;
};
export class CreateAuctionArgs extends Borsh.Data<Args> {
  static readonly SCHEMA = new Map([
    ...WinnerLimit.SCHEMA,
    ...PriceFloor.SCHEMA,
    ...this.struct([
      ['instruction', 'u8'],
      ['winners', WinnerLimit],
      ['endAuctionAt', { kind: 'option', type: 'u64' }],
      ['auctionGap', { kind: 'option', type: 'u64' }],
      ['tokenMint', 'pubkeyAsString'],
      ['authority', 'pubkeyAsString'],
      ['resource', 'pubkeyAsString'],
      ['priceFloor', PriceFloor],
      ['tickSize', { kind: 'option', type: 'u64' }],
      ['gapTickSizePercentage', { kind: 'option', type: 'u8' }],
    ]),
  ]);

  instruction = 1;
  /// How many winners are allowed for this auction. See AuctionData.
  winners: WinnerLimit;
  /// End time is the cut-off point that the auction is forced to end by. See AuctionData.
  endAuctionAt: BN | null;
  /// Gap time is how much time after the previous bid where the auction ends. See AuctionData.
  auctionGap: BN | null;
  /// Token mint for the SPL token used for bidding.
  tokenMint: StringPublicKey;
  /// Authority
  authority: StringPublicKey;
  /// The resource being auctioned. See AuctionData.
  resource: StringPublicKey;
  priceFloor: PriceFloor;
  tickSize: BN | null;
  gapTickSizePercentage: number | null;
}

type CreateAuctionParams = {
  auction: PublicKey;
  auctionExtended: PublicKey;
  creator: PublicKey;
  args: CreateAuctionArgs;
};

export class CreateAuction extends Transaction {
  constructor(options: TransactionCtorFields, params: CreateAuctionParams) {
    super(options);
    const { args, auction, auctionExtended, creator } = params;

    const data = CreateAuctionArgs.serialize(args);

    this.add(
      new TransactionInstruction({
        keys: [
          {
            pubkey: creator,
            isSigner: true,
            isWritable: true,
          },
          {
            pubkey: auction,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: auctionExtended,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: AuctionProgram.PUBKEY,
        data,
      }),
    );
  }
}

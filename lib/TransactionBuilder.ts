// imports
import { ECPair } from "bitcoincashjs-lib"
import { CoinInfo } from ".."
import { Address } from "./Address"
import { TREST_URL } from "./BITBOX"

// consts
const Bitcoin = require("bitcoincashjs-lib")
const bip66 = require("bip66")
const bip68 = require("bc-bip68")

declare interface SignatureAlgorithms {
  ECDSA: number
  SCHNORR: number
}

declare interface HashTypes {
  SIGHASH_ALL: number
  SIGHASH_NONE: number
  SIGHASH_SINGLE: number
  SIGHASH_ANYONECANPAY: number
  SIGHASH_BITCOINCASH_BIP143: number
  ADVANCED_TRANSACTION_MARKER: number
  ADVANCED_TRANSACTION_FLAG: number
}

export class TransactionBuilder {
  transaction: any
  DEFAULT_SEQUENCE: any
  hashTypes: HashTypes
  signatureAlgorithms: SignatureAlgorithms
  bip66: any
  bip68: any
  p2shInput: any
  tx: any
  private _address: Address

  constructor(network: string = "mainnet") {
    let bitcoincash: CoinInfo
    if (network === "mainnet") {
      this._address = new Address()
    } else {
      this._address = new Address(TREST_URL)
    }
    if (network === "bitcoincash" || network === "mainnet")
      bitcoincash = Bitcoin.networks.tent
    else bitcoincash = Bitcoin.networks.tentTest

    this.transaction = new Bitcoin.TransactionBuilder(bitcoincash)
    this.transaction.version = 4
    this.transaction.versionGroupId = 0x892F2085
    this.DEFAULT_SEQUENCE = 0xffffffff
    this.hashTypes = {
      SIGHASH_ALL: 0x01,
      SIGHASH_NONE: 0x02,
      SIGHASH_SINGLE: 0x03,
      SIGHASH_ANYONECANPAY: 0x80,
      SIGHASH_BITCOINCASH_BIP143: 0x40,
      ADVANCED_TRANSACTION_MARKER: 0x00,
      ADVANCED_TRANSACTION_FLAG: 0x01
    }
    this.signatureAlgorithms = {
      ECDSA: Bitcoin.ECSignature.ECDSA,
      SCHNORR: Bitcoin.ECSignature.SCHNORR
    }
    this.bip66 = bip66
    this.bip68 = bip68
    this.p2shInput = false
    this.tx
  }

  public addInput(
    txHash: string,
    vout: number,
    sequence: number = this.DEFAULT_SEQUENCE,
    prevOutScript: string | Buffer | null = null
  ): void {
    this.transaction.addInput(txHash, vout, sequence, prevOutScript)
  }

  public addInputScript(vout: number, script: any): void {
    this.tx = this.transaction.buildIncomplete()
    this.tx.setInputScript(vout, script)
    this.p2shInput = true
  }

  public addInputScripts(scripts: any): void {
    this.tx = this.transaction.buildIncomplete()
    scripts.forEach((script: any) => {
      this.tx.setInputScript(script.vout, script.script)
    })
    this.p2shInput = true
  }

  public addOutput(scriptPubKey: string | Buffer, amount: number): void {
    try {
      this.transaction.addOutput(
        // @ts-ignore
        this._address.toLegacyAddress(scriptPubKey),
        amount
      )
    } catch (error) {
      this.transaction.addOutput(scriptPubKey, amount)
    }
  }

  public setLockTime(locktime: number): void {
    this.transaction.setLockTime(locktime)
  }

  public sign(
    vin: number,
    keyPair: ECPair,
    redeemScript: Buffer | undefined,
    hashType: number = this.hashTypes.SIGHASH_ALL,
    value: number,
    signatureAlgorithm: number = 0
  ): void {
    let witnessScript

    this.transaction.sign(
      vin,
      keyPair,
      redeemScript,
      hashType,
      value,
      witnessScript,
      signatureAlgorithm
    )
  }

  public build(): any {
    if (this.p2shInput === true) return this.tx

    return this.transaction.build()
  }
}

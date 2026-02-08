/**
 * @reward-layer-protocol/rlp
 *
 * TypeScript type definitions for the Reward Layer Protocol.
 * Re-exports all types from the normative schema at spec/rlp.ts.
 *
 * @see https://github.com/Reward-Layer-Protocol/rlp
 */

export type {
  Reward,
  VerificationProcess,
  VerificationResult,
  Task,
  ClaimInstructions,
  Manifest,
  ClaimRequest,
  ClaimStatus,
  ClaimResponse,
  RlpError,
  Extension,
  ExtendedManifest,
  GetManifestResponse,
  GetTaskResponse,
  SubmitClaimRequest,
  SubmitClaimResponse,
  GetClaimStatusResponse,
} from "../spec/rlp.js";

export { RlpErrorCode } from "../spec/rlp.js";

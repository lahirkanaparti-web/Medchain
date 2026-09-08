from typing import List, Optional
from pydantic import BaseModel, Field


class CustodyEventSchema(BaseModel):
    custodian: str
    state: int
    stateName: str
    timestamp: int


class BatchCreateResponse(BaseModel):
    batchId: int
    txHash: str
    ipfsHash: str
    ipfsUrl: str
    drugName: str
    batchNumber: str
    mfgDate: int
    expiryDate: int
    currentCustodian: str
    state: int
    stateName: str


class BatchTransferRequest(BaseModel):
    toAddress: str = Field(..., description="Target wallet address of the new custodian")
    newState: int = Field(..., description="Target BatchState enum integer (1=InTransit, 2=AtDistributor, 3=AtPharmacy, 4=Dispensed)")


class BatchTransferResponse(BaseModel):
    batchId: int
    txHash: str
    newState: int
    newStateName: str
    newCustodian: str


class BatchDetailResponse(BaseModel):
    batchId: int
    drugName: str
    batchNumber: str
    mfgDate: int
    expiryDate: int
    ipfsImageHash: str
    ipfsImageUrl: str
    currentCustodian: str
    state: int
    stateName: str
    custodyHistory: List[CustodyEventSchema]


class VerifyResponse(BaseModel):
    batchId: int
    authenticityScore: float
    verdict: str  # "genuine" | "suspect"
    confidence: float
    ipfsImageUrl: str
    custodyHistory: List[CustodyEventSchema]
    mode: str

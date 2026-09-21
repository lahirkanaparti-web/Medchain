from typing import List, Optional
from pydantic import BaseModel, Field


class CustodyEventSchema(BaseModel):
    custodian: str
    state: int
    stateName: str
    timestamp: int
    latitude: Optional[str] = ""
    longitude: Optional[str] = ""


class BatchCreateResponse(BaseModel):
    batchId: int
    txHash: str
    ipfsHash: str
    ipfsHashes: List[str] = []
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
    latitude: Optional[str] = Field("", description="Optional latitude coordinate string")
    longitude: Optional[str] = Field("", description="Optional longitude coordinate string")


class BatchTransferResponse(BaseModel):
    batchId: int
    txHash: str
    newState: int
    newStateName: str
    newCustodian: str
    latitude: Optional[str] = ""
    longitude: Optional[str] = ""


class BatchRecallRequest(BaseModel):
    reason: str = Field(..., description="Explanation reason for recalling the pharmaceutical batch")


class BatchRecallResponse(BaseModel):
    batchId: int
    txHash: str
    reason: str
    recalled: bool = True
    recallNotice: Optional[str] = ""


class BatchDetailResponse(BaseModel):
    batchId: int
    drugName: str
    batchNumber: str
    mfgDate: int
    expiryDate: int
    ipfsImageHash: str
    ipfsImageHashes: List[str] = []
    ipfsImageUrl: str
    currentCustodian: str
    state: int
    stateName: str
    isRecalled: bool = False
    recallReason: Optional[str] = ""
    recallTimestamp: Optional[int] = 0
    recallNotice: Optional[str] = ""
    custodyHistory: List[CustodyEventSchema]


class ForensicMetricsSchema(BaseModel):
    neuralSimilarity: float = 0.95
    colorConsistency: float = 0.92
    structuralCoherence: float = 0.88
    compositeScore: float = 0.93
    distanceMetric: float = 0.12


class VerifyResponse(BaseModel):
    batchId: int
    authenticityScore: float
    verdict: str  # "genuine" | "needs_review" | "suspect"
    distance: float = 0.0
    confidence: float
    ipfsImageUrl: str
    custodyHistory: List[CustodyEventSchema]
    mode: str
    explanation: Optional[str] = ""
    forensicMetrics: Optional[ForensicMetricsSchema] = None


class BatchInfoExtractionResponse(BaseModel):
    drug_name: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None


class InvestigationBriefResponse(BaseModel):
    summary: str
    risk_level: str  # "low" | "medium" | "high"
    findings: List[str]
    recommended_action: str
    tool_trace: List[dict] = []


class DefectInspectionResponse(BaseModel):
    has_defects: bool
    defects_found: List[str] = []
    severity: str  # "none" | "minor" | "major"
    recommendation: str


class AuditLogEntryResponse(BaseModel):
    id: str
    timestamp: int
    batch_id: int
    defect_report: Optional[dict] = None
    investigation_brief: Optional[dict] = None
    risk_level: str
    action_taken: str
    tx_hash: Optional[str] = None
    recall_notice: Optional[str] = None




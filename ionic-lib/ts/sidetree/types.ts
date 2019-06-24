export interface ISidetreeConnectorConfig {
    protocol: string
    host: string
    port: number
    path: string
}

export interface ISidetreeConnector {
    resolveDID: (did: string) => Promise<object>
    createDIDRecord: (args: ISidetreePayload) => Promise<object>
}

export interface ISidetreePayload {
    header: ISidetreeHeader
    payload: string
    signature: string
}

export interface ISidetreeHeader {
    operation: string
    kid: string
    proofOfWork: any
}

const fetchNode = require('node-fetch')
import {ISidetreeConnector, ISidetreeConnectorConfig, ISidetreePayload} from './types'
import {DidDocument} from "../identity/didDocument/didDocument";
const isNode = require('detect-node')

/**
 * @class
 * Class abstracting all interactions with sidetree nodes
 * @internal
 */
export class SidetreeConnector implements ISidetreeConnector {
    private _endpoint: string
    private _fetchImplementation = isNode ? fetchNode : window.fetch

    /**
     * Creates an instance of {@link SidetreeAgent}
     * @param config - Remote sidetree gateway address
     * @example `const ipfsAgent = new SidetreeAgent({protocol: 'https', host: 'test.com', port: 443})`
     */

    constructor(config: ISidetreeConnectorConfig) {
        this._endpoint = `${config.protocol}://${config.host}:${config.port}${config.path}`
    }

    /**
     * Get the ipfs gateway endpoint
     * @example `console.log(sidetreeAgent.endpoint) // 'https://test.com'`
     */

    get endpoint() {
        return this._endpoint
    }

    /**
     * Set fetch implementation at runtime, helps with tests
     * @param newImplementation - Implementation compliant with the fetch api
     * @example `sidetreeAgent.fetchImplementation = customImplementation`
     */

    set fetchImplementation(newImplementation: typeof window.fetch) {
        this._fetchImplementation = newImplementation
    }

    /**
     * Get current fetch implementation
     * @example `console.log(sidetreeAgent.fetchImplementation) // function fetch(...)`
     */

    get fetchImplementation(): typeof window.fetch {
        return this._fetchImplementation
    }

    /**
     * Resolves from sidetree node and parses the result as json
     * @param hash - did
     * @example `console.log(await sidetreeAgent.catJSON('QmZC...')) // {test: 'test'}`
     */

    public async resolveDID(did: string): Promise<object> {
        const res = await this.getRequest(this.endpoint + "/" + did)
        return res.json()
    }

    /**
     * Stores a JSON document on sidetree, using a public gateway
     * @param data - JSON document to store
     * @param pin - Whether the hash should be added to the pinset
     * @returns {string} - did document
     * @example `await sidetreeAgent.storeJSON({data: {test: 'test'}, pin: false})`
     */

    public async createDIDRecord(data: ISidetreePayload): Promise<DidDocument> {
        const serializedData = this.serializeJSON(data)
        const didDocument = await this.postRequest(this.endpoint, serializedData).then(res => res.json())
        return didDocument
    }

    /**
     * Helper method to post data using correct fetch implementation
     * @param endpoint - HTTP endpoint to post data to
     * @param data - JSON document to post
     */

    private async postRequest(endpoint: string, data: BodyInit) {
        return this.fetchImplementation(endpoint, {
            method: 'POST',
            body: data,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    /**
     * Helper method to get data using correct fetch implementation
     * @param endpoint - HTTP endpoint to get data from
     */

    private async getRequest(endpoint: string) {
        return this.fetchImplementation(endpoint)
    }

    /**
     * Helper method to serialize JSON so it can be parsed by the sidetree implementation
     * @param data - JSON document to be serialized
     */

    private serializeJSON(data: object) {
        if (!data || typeof data !== 'object') {
            throw new Error(`JSON expected, received ${typeof data}`)
        }
        return JSON.stringify(data);
    }
}

/**
 * Returns a configured instance of the ionic sidetree agent
 * @return - Instantiated IPFS agent
 */

export const ionicSidetreeAgent = new SidetreeConnector({
    host: '35.166.153.54',
    port: 80,
    protocol: 'http',
    path: '/ion'
})

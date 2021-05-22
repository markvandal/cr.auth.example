import { Fragment, useEffect, useState } from 'react'

import { useLocation } from "react-router-dom";

import axios from 'axios'
import { Secp256k1, sha256, Secp256k1Signature } from '@cosmjs/crypto'

import { fromBase64, fromHex } from '@cosmjs/encoding'


const baseApiUrl = 'http://localhost:1317'

export const Result = ({ requestedKeys }) => {
  const query = new URLSearchParams(useLocation().search)
  // This hack shouldn't be used on prod. You need to check
  // a passed value toSign (not a returned one).
  const toSign = query.get('toSign')
  const id = query.get('metaId')
  const [user, setUser] = useState({ account: {}, records: [], signed: false, loaded: false })

  useEffect(async () => {
    if (id) {
      const data = Array.from(query.keys()).reduce((data, key) => {
        return { ...data, [key]: query.get(key) }
      }, {})
      setUser(await load(id, requestedKeys, data, toSign))
    }
  }, [user.account.address])

  console.log(requestedKeys, user.records)

  return <Fragment>
    <p>Signed: {user.signed ? 'Yes' : 'No'}</p>
    {
      user.records.filter(record => requestedKeys.includes(record.key))
        .map(record => <p>
          Data: {record.data} <br />
            Value: {record.value} <br />
            Verified: {record.verified}
        </p>
        )
    }
  </Fragment>

}

const load = async (id, keys, data, toSign) => {
  const addressUrl = new URL(`metabelarus/mbcorecr/mbcorecr/id2addr/${id}`, baseApiUrl)
  const identityAddress = (await axios.get(`${addressUrl}`))
    .data?.Addr?.address

  const accountUrl = new URL(`auth/accounts/${identityAddress}`, baseApiUrl)
  const account = (await axios.get(`${accountUrl}`))
    .data?.result?.value

  const recordsUrl = new URL(`/metabelarus/mbcorecr/crsign/id2record/${id}`, baseApiUrl)
  const records = (await axios.get(`${recordsUrl}`))
    .data?.Id2Record?.records

  const pubkey = account.public_key.value

  return {
    account, records: await Promise.all(records.map(
      async id => {
        const url = new URL(`metabelarus/mbcorecr/crsign/records/${id}`, baseApiUrl)
        const record = (await axios.get(`${url}`))
          .data?.Record

        if (keys.includes(record.key)) {
          record.value = data[record.key]
          record.verified = await verify(pubkey, record.signature, record.value)
        }

        return record
      }
    )),
    signed: await verify(pubkey, data['signed'], toSign),
    loaded: true
  }
}

const verify = async (pubkey, signature, data) => {
  pubkey = typeof pubkey === 'string' ? fromBase64(pubkey) : pubkey
  const _signature = fromHex(signature)
  return await Secp256k1.verifySignature(
    new Secp256k1Signature(_signature.slice(0, 32), _signature.slice(32)),
    sha256(Uint8Array.from(Buffer.from(data))),
    pubkey,
  )
}
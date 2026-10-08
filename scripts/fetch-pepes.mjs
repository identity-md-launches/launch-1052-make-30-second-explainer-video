import { mkdir, writeFile } from 'node:fs/promises';

const collection = '0x999ce0CE8C5f7661e0c74a568FfE27CEB9177bDB';
const rpc = 'https://ethereum-rpc.publicnode.com';

function tokenUriCall(id) {
  return `0xc87b56dd${BigInt(id).toString(16).padStart(64, '0')}`;
}

function decodeAbiString(hex) {
  const bytes = Buffer.from(hex.slice(2), 'hex');
  const offset = Number(bytes.readBigUInt64BE(24));
  const length = Number(bytes.readBigUInt64BE(offset + 24));
  return bytes.subarray(offset + 32, offset + 32 + length).toString();
}

await mkdir('assets/pepes', { recursive: true });
for (const id of [1, 2, 3, 4]) {
  const response = await fetch(rpc, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method: 'eth_call', params: [{ to: collection, data: tokenUriCall(id) }, 'latest'] })
  });
  const json = await response.json();
  if (!json.result) throw new Error(`token ${id}: ${JSON.stringify(json.error)}`);
  const metadataUri = decodeAbiString(json.result);
  const metadata = JSON.parse(Buffer.from(metadataUri.split(',')[1], 'base64').toString());
  const image = metadata.image;
  const svg = Buffer.from(image.split(',')[1], 'base64').toString();
  await writeFile(`assets/pepes/${id}.svg`, svg);
  await writeFile(`assets/pepes/${id}.json`, JSON.stringify({ name: metadata.name, image }, null, 2));
  console.log(`Saved ${metadata.name}`);
}

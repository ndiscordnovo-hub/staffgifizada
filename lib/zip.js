// Minimal ZIP writer (STORE method, no compression) — enough to bundle
// already-compressed media (webp/jpg/mp4) into a single download. No deps.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function strBytes(s) {
  return new TextEncoder().encode(s);
}

// files: [{ name, data: Uint8Array }]
export async function makeZip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;

  const writeU16 = (arr, v) => { arr.push(v & 0xff, (v >>> 8) & 0xff); };
  const writeU32 = (arr, v) => { arr.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff); };

  for (const f of files) {
    const nameBytes = strBytes(f.name);
    const data = f.data;
    const crc = crc32(data);
    const size = data.length;

    const local = [];
    writeU32(local, 0x04034b50);
    writeU16(local, 20);          // version
    writeU16(local, 0);           // flags
    writeU16(local, 0);           // method: store
    writeU16(local, 0); writeU16(local, 0); // time/date
    writeU32(local, crc);
    writeU32(local, size);        // compressed
    writeU32(local, size);        // uncompressed
    writeU16(local, nameBytes.length);
    writeU16(local, 0);           // extra len
    const localHeader = new Uint8Array([...local, ...nameBytes]);
    chunks.push(localHeader, data);

    const cd = [];
    writeU32(cd, 0x02014b50);
    writeU16(cd, 20); writeU16(cd, 20);
    writeU16(cd, 0); writeU16(cd, 0);
    writeU16(cd, 0); writeU16(cd, 0);
    writeU32(cd, crc);
    writeU32(cd, size); writeU32(cd, size);
    writeU16(cd, nameBytes.length);
    writeU16(cd, 0); writeU16(cd, 0);
    writeU16(cd, 0); writeU16(cd, 0);
    writeU32(cd, 0);
    writeU32(cd, offset);
    central.push(new Uint8Array([...cd, ...nameBytes]));

    offset += localHeader.length + data.length;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const c of central) { chunks.push(c); centralSize += c.length; }

  const end = [];
  writeU32(end, 0x06054b50);
  writeU16(end, 0); writeU16(end, 0);
  writeU16(end, files.length); writeU16(end, files.length);
  writeU32(end, centralSize);
  writeU32(end, centralStart);
  writeU16(end, 0);
  chunks.push(new Uint8Array(end));

  return new Blob(chunks, { type: "application/zip" });
}

export async function blobToU8(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

// lamejs ships no type declarations; only the encoder API used by ExportAudioDialog is typed.
declare module 'lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
  }
  const lamejs: { Mp3Encoder: typeof Mp3Encoder };
  export default lamejs;
}

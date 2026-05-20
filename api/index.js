const SECRET_KEY = 'JaJ?a7Nwk_Fgj?2o:znAkst';
const SCRIPT_MD5 = '1888f9865338afe6d5534b35171c61a4';

const sha256 = (function() {
  "use strict";
  var HEX_CHARS = '0123456789abcdef'.split('');
  function Sha256() {
    this.blocks = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    this.h0 = 0x6a09e667; this.h1 = 0xbb67ae85; this.h2 = 0x3c6ef372; this.h3 = 0xa54ff53a;
    this.h4 = 0x510e527f; this.h5 = 0x9b05688c; this.h6 = 0x1f83d9ab; this.h7 = 0x5be0cd19;
    this.block = this.start = this.bytes = this.hBytes = 0;
    this.finalized = this.hashed = false;
  }
  Sha256.prototype.update = function(message) {
    if (this.finalized) return;
    var notString = typeof message !== 'string'; var blocks = this.blocks;
    for (var i = 0; i < message.length; i++) {
      if (this.hashed) { this.hashed = false; blocks[0] = this.block; blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0; }
      var code = notString ? message[i] : message.charCodeAt(i);
      blocks[this.start >> 2] |= code << (24 - (this.start % 4) * 8); this.start++;
      if (this.start === 64) { this.block = blocks[16]; this.start = 0; this.hash(); this.hashed = true; }
    }
    this.bytes += message.length;
    return this;
  };
  Sha256.prototype.finalize = function() {
    if (this.finalized) return; this.finalized = true;
    var blocks = this.blocks; var i = this.start; blocks[16] = this.block;
    blocks[i >> 2] |= 0x80 << (24 - (i % 4) * 8); this.block = blocks[16];
    if (i >= 56) { this.hash(); blocks[0] = this.block; blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0; }
    blocks[15] = this.bytes << 3; this.hash();
  };
  Sha256.prototype.hash = function() {
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var a = this.h0, b = this.h1, c = this.h2, d = this.h3, e = this.h4, f = this.h5, g = this.h6, h = this.h7, blocks = this.blocks;
    for (var j = 0; j < 64; j++) {
      if (j >= 16) { var w0 = blocks[j - 15]; var w1 = blocks[j - 2]; var s0 = ((w0 >>> 7) | (w0 << 25)) ^ ((w0 >>> 18) | (w0 << 14)) ^ (w0 >>> 3); var s1 = ((w1 >>> 17) | (w1 << 15)) ^ ((w1 >>> 19) | (w1 << 13)) ^ (w1 >>> 10); blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1; }
      var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7)); var ch = (e & f) ^ ((~e) & g); var temp1 = h + S1 + ch + K[j] + (blocks[j] >>> 0); var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10)); var maj = (a & b) ^ (a & c) ^ (b & c); var temp2 = S0 + maj;
      h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    this.h0 = (this.h0 + a) >>> 0; this.h1 = (this.h1 + b) >>> 0; this.h2 = (this.h2 + c) >>> 0; this.h3 = (this.h3 + d) >>> 0; this.h4 = (this.h4 + e) >>> 0; this.h5 = (this.h5 + f) >>> 0; this.h6 = (this.h6 + g) >>> 0; this.h7 = (this.h7 + h) >>> 0;
  };
  return function(message) { return new Sha256().update(message).hex(); };
})();

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const { source, mid, type } = req.query;
    if (!mid) return res.status(200).json({ status: "ok" });

    // 1. 动态生成完全符合原版加签规范的路径
    const requestPath = `/lxmusicv4/url/${source}/${mid}/${type}`;
    const sign = sha256(requestPath + SCRIPT_MD5 + SECRET_KEY);
    const targetUrl = `https://88.lxmusic.xn--fiqs8s${requestPath}?sign=${sign}`;

    try {
        // 2. 直接中转抓取直链，用最标准的洛雪白名单格式吐回去
        const fetchResponse = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-request-key': 'lxmusic',
                'user-agent': 'lx-music-request/2.0.0'
            }
        });
        const body = await fetchResponse.json();
        
        if (body && (body.code === 0 || body.code === 200)) {
            return res.status(200).json({
                code: 0,
                data: body.data || body.url
            });
        }
        return res.status(200).json({ code: 1, msg: body?.msg || "上游解析空响应" });
    } catch (e) {
        return res.status(200).json({ code: 1, msg: "Vercel中转故障: " + e.message });
    }
};

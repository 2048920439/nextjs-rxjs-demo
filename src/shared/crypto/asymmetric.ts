/**
 * NaCl box 非对称加密工厂（同步，Curve25519-XSalsa20-Poly1305）
 *
 * 用于客户端与服务端之间的敏感数据传输。
 *
 * 安全模型（以 Client → Server 为例）：
 * - Client: createBox(clientSk, serverPk) → 用 .encrypt() 发出密文
 * - Server: createBox(serverSk, clientPk) → 用 .decrypt() 还原明文
 *
 * 加密格式：base64(nonce + ciphertext)
 */

import nacl from "tweetnacl";
import util from "tweetnacl-util";

/**
 * 创建 NaCl box 加密/解密实例
 *
 * @param mySecretKeyBase64 - 己方 32 字节 base64 编码私钥
 * @param theirPublicKeyBase64 - 对方 32 字节 base64 编码公钥
 * @returns \{ encrypt, decrypt \}
 */
export function createBox(mySecretKeyBase64: string, theirPublicKeyBase64: string) {
  const mySk = util.decodeBase64(mySecretKeyBase64);
  const theirPk = util.decodeBase64(theirPublicKeyBase64);

  return {
    /** 非对称加密（同步）—— 从"我"发往"对方" */
    encrypt(plaintext: string): string {
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const message = util.decodeUTF8(plaintext);
      const box = nacl.box(message, nonce, theirPk, mySk);

      if (!box) throw new Error("Box encryption failed");

      const combined = new Uint8Array(nonce.length + box.length);
      combined.set(nonce);
      combined.set(box, nonce.length);
      return util.encodeBase64(combined);
    },

    /** 非对称解密（同步），任何失败均抛出错误 */
    decrypt(encrypted: string): string {
      try {
        const combined = util.decodeBase64(encrypted);
        const nonce = combined.slice(0, nacl.box.nonceLength);
        const box = combined.slice(nacl.box.nonceLength);

        const decrypted = nacl.box.open(box, nonce, theirPk, mySk);
        if (!decrypted) throw new Error("Box decryption failed: authentication error");

        return util.encodeUTF8(decrypted);
      } catch (e) {
        if (e instanceof Error && e.message.includes("decryption failed")) throw e;
        throw new Error("Box decryption failed: invalid input", { cause: e });
      }
    },
  };
}

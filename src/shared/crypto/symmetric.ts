/**
 * NaCl secretbox 对称加密工厂（同步，认证加密）
 *
 * 用于 PersistCache 的 localStorage 数据加密。
 * XSalsa20-Poly1305：同时保证机密性和完整性（防篡改）。
 *
 * 加密格式：base64(nonce + ciphertext)
 * - nonce：24 字节随机数
 * - ciphertext：加密+认证后的数据
 */

import nacl from "tweetnacl";
import util from "tweetnacl-util";

/**
 * 创建对称加密/解密实例
 *
 * @param secretKeyBase64 - 32 字节 base64 编码的对称密钥
 * @returns \{ encryptString, decryptString \}
 */
export function createSymmetric(secretKeyBase64: string) {
  const key = util.decodeBase64(secretKeyBase64);

  return {
    /** 对称加密（同步） */
    encryptString(plaintext: string): string {
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const message = util.decodeUTF8(plaintext);
      const box = nacl.secretbox(message, nonce, key);

      if (!box) throw new Error("Secretbox encryption failed");

      const combined = new Uint8Array(nonce.length + box.length);
      combined.set(nonce);
      combined.set(box, nonce.length);
      return util.encodeBase64(combined);
    },

    /** 对称解密（同步），任何失败均抛出错误 */
    decryptString(encrypted: string): string {
      try {
        const combined = util.decodeBase64(encrypted);
        const nonce = combined.slice(0, nacl.secretbox.nonceLength);
        const box = combined.slice(nacl.secretbox.nonceLength);

        const decrypted = nacl.secretbox.open(box, nonce, key);
        if (!decrypted) throw new Error("Symmetric decryption failed: authentication error");

        return util.encodeUTF8(decrypted);
      } catch (e) {
        if (e instanceof Error && e.message.includes("decryption failed")) throw e;
        throw new Error("Symmetric decryption failed: invalid input", { cause: e });
      }
    },
  };
}

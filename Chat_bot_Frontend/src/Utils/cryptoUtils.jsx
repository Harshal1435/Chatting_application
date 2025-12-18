// utils/cryptoUtils

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const SECRET_KEY = import.meta.env.VITE_AES_SECRET_KEY; // 🔐 Both users should derive same key securely

// Generate an AES key from your passphrase (static for demo)
export const generateAESKey = async () => {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(SECRET_KEY),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const salt = textEncoder.encode("static-salt"); // In production, use per-user dynamic salt

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

// Encrypt
export const encryptText = async (plaintext) => {
  const key = await generateAESKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = textEncoder.encode(plaintext);

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoded
  );

  return {
    encryptedData: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
};


// Decrypt
export const decryptText = async (encryptedData, iv) => {
  const key = await generateAESKey();

  const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivArray,
    },
    key,
    encryptedArray
  );

  return textDecoder.decode(decrypted);
};

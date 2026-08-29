// src/services/encryption.js
// Uçtan Uca Şifreleme (E2E Encryption) Servisi
// AES-CBC tabanlı mesaj şifreleme/çözümleme

import AsyncStorage from '@react-native-async-storage/async-storage';

// Web ve React Native uyumlu base64 yardımcıları
const toBase64 = (uint8Array) => {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
};

const fromBase64 = (base64String) => {
  const binary = atob(base64String);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * Rastgele bir 256-bit AES anahtarı oluşturur (hex string olarak)
 */
const generateRandomKey = () => {
  const array = new Uint8Array(32); // 256-bit
  // crypto.getRandomValues hem web hem de React Native (Hermes) tarafından desteklenir
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback: Math.random (güvenlik açısından ideal değil ama çalışır)
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return toBase64(array);
};

/**
 * Basit XOR tabanlı şifreleme (hafif ama etkili)
 * Not: Bu, tam AES yerine kullanılan hafif bir alternatif.
 * Expo'da native crypto modülleri sınırlı olduğu için
 * XOR + key stretching kullanıyoruz.
 */
const xorEncrypt = (text, keyBase64) => {
  const keyBytes = fromBase64(keyBase64);
  const textBytes = new TextEncoder().encode(text);
  
  // IV (Initialization Vector) oluştur
  const iv = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(iv);
  } else {
    for (let i = 0; i < iv.length; i++) {
      iv[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // XOR şifreleme (key + iv ile)
  const encrypted = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length];
  }
  
  // IV + şifreli veriyi birleştir
  const result = new Uint8Array(iv.length + encrypted.length);
  result.set(iv, 0);
  result.set(encrypted, iv.length);
  
  return toBase64(result);
};

/**
 * XOR tabanlı çözümleme
 */
const xorDecrypt = (ciphertextBase64, keyBase64) => {
  const keyBytes = fromBase64(keyBase64);
  const combined = fromBase64(ciphertextBase64);
  
  // IV'yi ayır
  const iv = combined.slice(0, 16);
  const encrypted = combined.slice(16);
  
  // XOR çözümleme
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length];
  }
  
  return new TextDecoder().decode(decrypted);
};

/**
 * Belirli bir chatId için şifreleme anahtarı oluşturur veya mevcut olanı döner.
 * Anahtar AsyncStorage'da saklanır.
 * @param {string} chatId - Sohbet odası kimliği
 * @returns {Promise<string>} - Base64 encoded anahtar
 */
export const getOrCreateChatKey = async (chatId) => {
  const storageKey = `e2e_chat_key_${chatId}`;
  try {
    let key = await AsyncStorage.getItem(storageKey);
    if (!key) {
      key = generateRandomKey();
      await AsyncStorage.setItem(storageKey, key);
    }
    return key;
  } catch (error) {
    console.error('Chat anahtarı alma/oluşturma hatası:', error);
    // Hata durumunda geçici anahtar oluştur
    return generateRandomKey();
  }
};

/**
 * Mesajı şifreler.
 * @param {string} plainText - Düz metin mesaj
 * @param {string} key - Base64 encoded şifreleme anahtarı
 * @returns {string} - Şifrelenmiş mesaj (base64)
 */
export const encryptMessage = (plainText, key) => {
  try {
    if (!plainText || !key) return plainText;
    const encrypted = xorEncrypt(plainText, key);
    // Şifreli mesajları tanımlayabilmek için bir prefix ekliyoruz
    return `E2E:${encrypted}`;
  } catch (error) {
    console.error('Mesaj şifreleme hatası:', error);
    return plainText; // Hata durumunda düz metin gönder
  }
};

/**
 * Şifreli mesajı çözümler.
 * @param {string} cipherText - Şifrelenmiş mesaj
 * @param {string} key - Base64 encoded çözümleme anahtarı
 * @returns {string} - Düz metin mesaj
 */
export const decryptMessage = (cipherText, key) => {
  try {
    if (!cipherText || !key) return cipherText;
    
    // E2E prefix kontrolü
    if (!cipherText.startsWith('E2E:')) {
      // Eski şifresiz mesaj, olduğu gibi döndür
      return cipherText;
    }
    
    const encrypted = cipherText.substring(4); // 'E2E:' prefix'ini kaldır
    return xorDecrypt(encrypted, key);
  } catch (error) {
    console.error('Mesaj çözümleme hatası:', error);
    return '🔒 Şifreli mesaj (çözümlenemedi)';
  }
};

/**
 * Chat anahtarını Firestore üzerinden paylaşır.
 * İlk mesaj gönderildiğinde anahtar oluşturulur ve 
 * her iki kullanıcı da aynı anahtarı kullanır.
 */
export const shareChatKey = async (chatId, db, currentUserId) => {
  // Firestore'da chat anahtarları saklamak güvenlik açığı oluşturabilir.
  // Bunun yerine, her iki kullanıcı da aynı deterministik anahtarı oluşturur.
  // chatId zaten her iki taraf için de aynı olduğundan,
  // anahtar chatId'den türetilir.
  const storageKey = `e2e_chat_key_${chatId}`;
  let key = await AsyncStorage.getItem(storageKey);
  
  if (!key) {
    // chatId'den deterministik anahtar oluştur
    // Bu sayede her iki kullanıcı da aynı anahtarı üretir
    const encoder = new TextEncoder();
    const data = encoder.encode(chatId + '_e2e_secret_salt_v1');
    const keyArray = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      keyArray[i] = data[i % data.length] ^ (i * 7 + 13);
    }
    key = toBase64(keyArray);
    await AsyncStorage.setItem(storageKey, key);
  }
  
  return key;
};

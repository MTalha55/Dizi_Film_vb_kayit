import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { colors, layout } from '../theme/colors';

const ChatScreen = ({ route, navigation }) => {
  const { targetUserId, targetUserName } = route?.params || {};
  // If targetUserId is provided, we are Admin talking to a user.
  // If not, we are a User talking to Admin.
  const isUserTalkingToAdmin = !targetUserId;
  const currentUserId = auth.currentUser?.uid;
  const chatPartnerId = isUserTalkingToAdmin ? 'admin' : targetUserId;

  // The actual user's ID who is not the admin
  const userUidForChat = isUserTalkingToAdmin ? currentUserId : targetUserId;
  
  // Deterministic chat ID based on the user's UID and the literal string 'admin'
  const chatId = userUidForChat < 'admin' ? `${userUidForChat}_admin` : `admin_${userUidForChat}`;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!currentUserId) return;
    
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      // Sort in memory to avoid Firebase composite index requirement
      msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, (error) => {
      console.error("Mesajları yükleme hatası:", error);
      if (Platform.OS === 'web') alert(`Mesaj hatası: ${error.message}`);
      else Alert.alert('Hata', `Mesajlar yüklenemedi: ${error.message}`);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUserId, chatPartnerId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');

    try {
      await addDoc(collection(db, 'messages'), {
        chatId: chatId,
        senderId: currentUserId,
        receiverId: chatPartnerId,
        text: text,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      if (Platform.OS === 'web') alert(`Gönderme hatası: ${error.message}`);
      else Alert.alert('Hata', `Mesaj gönderilemedi: ${error.message}`);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === currentUserId;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
          {item.text}
        </Text>
        <Text style={styles.timeText}>
          {new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {isUserTalkingToAdmin ? 'Admin ile İletişim' : `${targetUserName || 'Kullanıcı'} ile Sohbet`}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>Henüz mesaj yok. Sohbeti başlatın!</Text>
              </View>
            }
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    padding: layout.spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 10,
    fontSize: 14,
  },
  listContent: {
    padding: layout.spacing.md,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 16,
    marginBottom: 10,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myText: {
    color: '#fff',
  },
  theirText: {
    color: colors.text,
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: layout.spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 2,
  },
});

export default ChatScreen;

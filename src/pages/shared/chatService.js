import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// isang convo per soloparent
export const getConversationId = (soloparentUid) => `support_${soloparentUid}`;

// SEND - gamit ng both soloparent at staff
export const sendMessage = async ({ text, senderId, senderName, soloparentUid }) => {
  if (!text.trim()) return;
  await addDoc(collection(db, "messages"), {
    conversationId: getConversationId(soloparentUid),
    participants: [soloparentUid, "staff"],
    receiverRole: "staff", // eto key para makita ng staff lahat
    receiverId: "staff",
    senderId,
    senderName,
    text: text.trim(),
    isRead: false,
    createdAt: serverTimestamp()
  });
};

// LISTEN sa isang conversation - eto yung ayusin yung bug mo sa picture
export const subscribeToConversation = (soloparentUid, callback) => {
  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", getConversationId(soloparentUid)),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// PARA SA STAFF - kita nya lahat ng ka-chat
export const subscribeAllStaffMessages = (callback) => {
  const q = query(
    collection(db, "messages"),
    where("receiverRole", "==", "staff"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};
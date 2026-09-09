import { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function MessagesPage() {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    console.log("LISTENING TO MESSAGES...");
    const unsub = onSnapshot(collection(db, "messages"), 
      (snap) => {
        console.log("SNAP GOT", snap.size, "docs");
        const data = snap.docs.map(d => ({id:d.id, ...d.data()}));
        setMsgs(data);
      },
      (err) => {
        console.error("FIRESTORE ERROR:", err);
      }
    );
    return () => unsub();
  }, []);

  const sendTest = async () => {
    await addDoc(collection(db, "messages"), {
      text: "test from staff " + new Date().toLocaleTimeString(),
      senderName: "TEST STAFF",
      senderId: "test_staff_uid",
      receiverId: "staff",
      participants: ["test", "staff"],
      createdAt: serverTimestamp()
    });
    console.log("TEST SENT");
  };

  return (
    <div style={{padding:20}}>
      <h1>MESSAGES DEBUG - {msgs.length} found</h1>
      <button onClick={sendTest} style={{padding:10, background:'blue', color:'white', marginBottom:20}}>SEND TEST MESSAGE</button>
      
      <div>
        {msgs.map(m => (
          <div key={m.id} style={{border:'1px solid #ddd', padding:10, marginBottom:8}}>
            <b>{m.senderName}</b>: {m.text}<br/>
            <small style={{color:'gray'}}>{m.receiverId} | {JSON.stringify(m.participants)} | {m.createdAt?.toDate?.()?.toString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
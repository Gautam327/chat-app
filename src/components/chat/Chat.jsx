import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";

const Chat = () => {
  const [chat, setChat] = useState(null); // Initialize chat state to null or a default value
  const [openEmojiPicker, setOpenEmojiPicker] = useState(false); // State for emoji picker visibility
  const [text, setText] = useState(""); // State for message text input
  const [img, setImg] = useState({
    file: null,
    url: "",
  }); // State for image upload

  const { currentUser } = useUserStore(); // Get current user from context
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore(); // Get chat details from context

  const endRef = useRef(null); // Ref for scrolling to end of messages

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]); // Scroll to end when messages change

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "chats", chatId), (snapshot) => {
      if (snapshot.exists()) {
        setChat(snapshot.data());
      } else {
        console.log("Chat does not exist");
        // Handle case where chat does not exist
      }
    });

    return () => unsubscribe();
  }, [chatId]); // Subscribe to chat updates

  const handleEmojiClick = (emojiObject) => {
    setText((prevText) => prevText + emojiObject.emoji); // Append emoji to message text
    setOpenEmojiPicker(false); // Close emoji picker after selection
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImg({
        file: file,
        url: URL.createObjectURL(file),
      });
    }
  };

  const handleSend = async () => {
    if (!text) return; // Prevent sending empty messages

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file); // Upload image if available
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      const userIDs = [currentUser.id, user.id];

      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          if (chatIndex !== -1) {
            userChatsData.chats[chatIndex].lastMessage = text;
            userChatsData.chats[chatIndex].isSeen = id === currentUser.id;
            userChatsData.chats[chatIndex].updatedAt = Date.now();

            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });
          } else {
            console.log("Chat not found in user's chats");
          }
        } else {
          console.log("User chats document does not exist");
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Handle error gracefully (e.g., show error message to user)
    } finally {
      setImg({ file: null, url: "" });
      setText("");
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="User Avatar" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone Icon" />
          <img src="./video.png" alt="Video Icon" />
          <img src="./info.png" alt="Info Icon" />
        </div>
      </div>
      <div className="center">
        {chat?.messages?.map((message) => (
          <div
            className={`message ${message.senderId === currentUser?.id ? "own" : ""}`}
            key={message?.createdAt} // Ensure this matches your data structure
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="Sent Image" />}
              <p>{message.text}</p>
              <span>{format(message.createdAt?.toDate())}</span>
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="Uploaded Image" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="Upload Image Icon" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />
          <img src="./camera.png" alt="Camera Icon" />
          <img src="./mic.png" alt="Microphone Icon" />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt="Emoji Icon"
            onClick={() => setOpenEmojiPicker((prev) => !prev)}
          />
          {openEmojiPicker && (
            <div className="picker">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;

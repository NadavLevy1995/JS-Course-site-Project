import { io } from "socket.io-client";

// החלף את הכתובת אם אתה מריץ את השרת על כתובת אחרת!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const socket = io("http://localhost:3001");

export default socket;

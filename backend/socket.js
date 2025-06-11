const { Server } = require("socket.io");
const dotenv = require("dotenv");
const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL, // Or your deployed frontend URL
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
  
    socket.emit("me", socket.id);
  
    socket.on("callUser", ({ userToCall, signalData, from, name }) => {
      io.to(userToCall).emit("callUser", { signal: signalData, from, name });
    });
  
    socket.on("answerCall", ({ signal, to }) => {
      io.to(to).emit("callAccepted", signal);
    });
  
    socket.on("endCall", ({ to }) => {
      io.to(to).emit("callEnded");
    });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

    // Notification functionality
    // socket.on("join_room", (userId) => {
    //   socket.join(userId);
    //   console.log(`User with ID ${userId} joined their room.`);
    // });

    // socket.on("send_notification", ({ toUserId, message, fromUserId }) => {
    //   console.log(
    //     `Notification for user ${toUserId} from ${fromUserId}:`,
    //     message
    //   );
    //   socket.to(toUserId).emit("receive_notification", {
    //     message,
    //     fromUserId,
    //   });
    // });

    // // Chat messaging functionality
    // socket.on("message", ({ room, message }) => {
    //   console.log(`Message to room ${room}:`, message);
    //   socket.to(room).emit("receive-message", message);
    // });

    // socket.on("join-room", (roomName) => {
    //   socket.join(roomName);
    //   console.log(`User joined room: ${roomName}`);
    // });

    // // Student management functionality
    // socket.on("student_added", (arg) => {
    //   console.log("New Student Added:", arg);
    //   io.emit("student_added_notification", "New Student is Added");
    // });

    // socket.on("student_attendance", (arg) => {
    //   console.log("Student Marked Attendance:", arg);
    //   io.emit("student_attendance_enterance", "Student Marked Attendance");
    // });
  });

  return io;
};

module.exports = setupSocket;

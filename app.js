const express = require('express');
const socket = require('socket.io');
const http = require('http');
const {Chess} = require('chess.js');
const path = require('path');

const app = express();

const server = http.createServer(app);
const io = socket(server);


const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
      res.render("index");
});

io.on("connection", (uniqueSocket)=>{
      console.log("User connected");

      if(!players.white){
            players.white = uniqueSocket.id;
            uniqueSocket.emit("playerRole", "w");
      } else if(!players.black){
            players.black = uniqueSocket.id;
            uniqueSocket.emit("playerRole", "b");
      } else{
            uniqueSocket.emit("spectatorRole");
      }

      uniqueSocket.on("disconnect", () => {
            if(uniqueSocket.id === players.white){
                  delete players.white;
            } else if(uniqueSocket.id === players.black){
                  delete players.black;
            }
            // console.log("User disconnected");
      });

      uniqueSocket.on("move", (move) => {
            try {
                  //check if the write player did the move
                  if(chess.turn==='w' && uniqueSocket.id !== players.white)   return;
                  if(chess.turn==='b' && uniqueSocket.id !== players.black)   return;

                  const result = chess.move(move);//checks if the move is valid
                  if(result){
                        currentPlayer = chess.turn();
                        io.emit("moveMade", move);
                        io.emit("boardState", chess.fen());		
                  } else{
                        console.log("Invalid move", move);
                        uniqueSocket.emit("invalidMove", move);
                  }

            } catch (error) {
                  console.log("Error in move", error);
                  uniqueSocket.emit("invalidMove", move);
            }
      });
})

server.listen(3000, () =>{
      console.log("Server is running on port 3000");
})

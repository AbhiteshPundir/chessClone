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
let gameStarted = false;

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

            if(Object.keys(players).length === 0){
                  gameStarted = false;
            }
      });

      uniqueSocket.on("move", (move) => {
            try{
                if (!gameStarted) return; // Ignore moves if the game hasn't started //button logic
                if(chess.turn() === "w" && uniqueSocket.id !== players.white) return;
                if(chess.turn() === "b" && uniqueSocket.id !== players.black) return;
    
                const result = chess.move(move); // if the move in invalid then no result, so may crash; hence the try and catch block
                if(result){ // if right move then send to the frontend
                    currentPlayer = chess.turn();
                    io.emit("move", move);
                    io.emit("boardState", chess.fen()); //fen is the chess piece notation
                }
                else{
                    console.log("Invalid move : ", move);
                    uniqueSocket.emit("invalidMove", move); 
                }
    
            }catch(err){
                console.log(err);
                uniqueSocket.emit("Invalid Move : ", move); 
    
            }
        });
    
        //message logic
        if (Object.keys(players).length === 2 && !gameStarted) {
            gameStarted = true;
            io.emit("gameStarted");
            io.emit("boardState", chess.fen());
        }
});
    
server.listen(3000, function(){
      console.log("listening on 3000")
});

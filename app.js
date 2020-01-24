if(process.env.NODE_ENV === 'development'){
    require('dotenv').config()
}

const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URL,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false})
.then(()=>{
    console.log('connected to db !')
})
.catch(err=>{
    console.log(err)
})
const Room = require('./models/room')

app.get('/',function(req,res){
    res.sendfile('index.html')
})

io.on('connection',function(socket){

//1. find all created room
    Room.find()
        .then(data=>{
            io.emit('getRooms', data)
        })
        .catch(err =>{
            // console.log(err)
        })

//2. create Room
    socket.on('createRoom', function(room, player){
        Room.create({
            name: room,
            players: [player]
        })
        .then(data =>{
            socket.join(data._id)
            io.sockets.in(data._id).emit('connectRoom',data)
            return Room.find()
        })
        .then(datas =>{
            io.emit('getRooms',datas)
        })
        .catch(err=>{
            // console.log(err)
        })
    })
//3. join Room
    socket.on('joinRoom',function(roomId, player){
        Room.findById(roomId)
            .then(data=>{
                if(!data.isPlaying){
                    return  Room.findByIdAndUpdate(
                        roomId
                    ,{
                        $push : {players: player}
                    },{new: true})
                }
                    return null
            })
            .then(data =>{
                if(data){
                    socket.join(data._id)
                    io.sockets.in(data._id).emit('connectRoom',data)
                }
             })
            .catch(err =>{
            // console.log(err)
        })
    })
//4. Exit room
    socket.on('exitRoom', function(roomId, player){
        Room.findById(roomId)
            .then(data=>{
                data.players = data.players.filter(element =>
                        element !== player
                    )
                data.save({
                    validateBeforeSave: false
                })
            })
            .catch(err=>{
                // console.log(err)
            })
    })
//5. Game Play
    socket.on('joinArena', function(data){
        Room.findByIdAndUpdate(data._id,{
            isPlaying : true
        })
        .then((respone)=>{
            let dataArena = {
                _id: data._id,
                currentRandom: 'back',
                listShowed: [],
                cardsOnDeck: 13,
                cardsShown: 0,
                cardList: [ null,'2','3','4','5','6','7','8','9','10','Jack', 'Queen', 'King', 'As'],
                listPlayer: data.players,
                count: 0,
            }
            // console.log(dataArena,'masuk sini')
            io.emit('setDataArena', dataArena)
        })
        .catch(err=>{
            console.log(err)
        })
    })

// 6. start Arena
        socket.on('gamePlay', function(data){
            io.in(data._id).emit('setDataArena',data)
        })
// 8. chat
        socket.on('receiveMessage', function({ username, room, message }) {
            io.in(room).emit('publishMessage',  { username, message });
        })
})


http.listen(3000, function(){
    console.log('listen on localhost:3000')
})
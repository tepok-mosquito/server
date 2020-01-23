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
    console.log('user connected')
    console.log(socket.id)
//1. find all created room
    Room.find()
        .then(data=>{
            io.emit('getRooms', data)
        })
        .catch(err =>{
            console.log(err)
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
        })
        .catch(err=>{
            console.log(data)
        })
    })
//3. join Room
    socket.on('joinRoom',function(roomId, player){
        Room.findByIdAndUpdate(
            roomId
        ,{
            $push : {players: player}
        },{new: true})
        .then(data =>{
            socket.join(data._id)
            io.sockets.in(data._id).emit('connectRoom',data)
        })
        .catch(err =>{
            console.log(err)
        })
    })


})

http.listen(3000, function(){
    console.log('listen on localhost:3000')
})
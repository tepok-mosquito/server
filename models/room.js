`use strict`
const { Schema, model } = require('mongoose')

const roomSchema = Schema({    
    name : {
        type : String,
        required : [true, 'you must enter your name'],
        validate: {
            validator : function(cek) {
                return Room.findOne({
                    name : cek
                })
                .then(user => {
                    if (user) {
                        return false
                    } else {
                        return true
                    }
                })
                .catch(err => {
                    console.log(err)
                })
            },
            message : `name already registered`
          }
    },
    players:{
        type: Array,
        default: []
    },
    isPlaying:{
        type: Boolean,
        default: false
    }
}, {timestamps : true},{versionKey : false})



const Room = model('Room', roomSchema)
module.exports = Room
require('dotenv').config();

const { Client } = require('discord.js');
const fs = require('fs'); 
const { get } = require('http');
const client = new Client();
const PREFIX = "~";
const filename = "Output.txt";

client.on('ready', () => {
    console.log(`${client.user.username} has logged in.`);
    client.user.setActivity("Among Us", {
        type: "PLAYING"
    });
});

client.on('message', (message) => {
    // ignore bot msgs 
    if (message.author.bot) return;

    // react to @-tag
    if (message.mentions.has(client.user.id)) {
        message.channel.send('People always ask who is the Impostor? And not how is the Impostor? 😩');
    };

    // check prefix 
    if (message.content.startsWith(PREFIX)) {
     // set cmd & args   
     const [CMD_NAME, ...args] = getCMD(message);
     // check cmds
     switchCMD(message, CMD_NAME, args)
    }    
});

function switchCMD(message, CMD_NAME, args) {
    switch (CMD_NAME) {
        case 'add':
            writeIntoFile(args);
            break;
        case 'read':
            outputFile(message);
            break;
        case 'clear':
            clearFile(message);
            break;  
        case 'test':
            test(message);
            break;
        default:
            // invalid command
            break;
      }
}

function getCMD(message) {
    return message.content.trim()
    .substring(PREFIX.length)
    .split(" ");
}

function writeIntoFile(args) {
    fs.writeFile(filename, args.join(', '), { flag: "a" }, function(err) {
        if (err) {
          console.log("file " + filename + " already exists");
        }
        else {
          console.log("Succesfully written " + filename);
        }
      });
}

function outputFile(message) {
    // return if file is empty
    console.log('reading file');

    fs.readFile(filename, (err, data) => { 
        if (err) throw err; 
        
        var fileData = data.toString();
        message.channel.send(fileData);
    });
}

function clearFile(message) {
    fs.truncate(filename, 0, function(){console.log('cleared file!')})
    message.channel.send("File has been cleared!");
}

function deleteMSG() {

    fs.readFile(filename, (err, data) => { 
        if (err) throw err; 
        
        var fileData = data.toString().split(",");
        processData(fileData);
    });
}

function processData(content) {
    console.log(content[1]);
}

// test environment for functions
function test() {
    deleteMSG();
}


client.login(process.env.DISCORDJS_BOT_TOKEN);
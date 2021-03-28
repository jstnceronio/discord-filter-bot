require('dotenv').config();

const sqlite = require('sqlite3').verbose();
const { Client } = require('discord.js');
const fs = require('fs'); 
const { get } = require('http');
const path = require('path');
const client = new Client();
const PREFIX = '~';
const filename = 'Output.txt';

client.on('ready', () => {
    // validate login
    console.log(`${client.user.username} has logged in.`);
    // set activity
    client.user.setActivity('Among Us', {
        type: 'PLAYING'
    });
    // prepare sqlite db
    let db = new sqlite.Database('./testdb.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);
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
     // prep db
     let db = new sqlite.Database('./testdb.db', sqlite.OPEN_READWRITE);
     switchCMD(message, CMD_NAME, args, db);
    }    
});

function switchCMD(message, CMD_NAME, args, db) {
    switch (CMD_NAME) {
        case 'add':
            writeIntoFile(args, message, db);
            break;
        case 'read':
            outputFile(message, db);
            break;
        case 'clear':
            clearDB(message, db);
            break;  
        case 'change':
            changeWord(message, db, args);
            break;    
        default:
            // invalid command
            break;
      }
}

function getCMD(message) {
    //
    // prep msg
    //
    return message.content.trim()
    .substring(PREFIX.length)
    .split(" ");
}

function writeIntoFile(args, message, db) {
      //
      // garner user infos & prepare db
      //
      let userid = message.author.id;
      // db.run(`CREATE TABLE IF NOT EXISTS data(userid INTEGER NOT NULL, keyword TEXT NOT NULL, audio BLOB)`);

      //
      // insert data into db
      //
      let insertdata = db.prepare('INSERT INTO data VALUES(?,?,?)');
      insertdata.run(userid, args, ' ');
      insertdata.finalize();
      db.close();

      // validate

      console.log('wrote into db!');
}

function outputFile(message, db) {

    //
    // WIP 
    //
    // let db = new sqlite.Database('./testdb.db', sqlite.OPEN_READWRITE);

    let query = `SELECT keyword FROM data`; 
      db.each(query, (err, row) => {
            if (err) {
                console.log(err);
                return;
            }
            if (row === undefined) {
                console.log('undefined row');
            }

            let keyword = row.keyword;
            message.channel.send(keyword);
      });

      // validate
      console.log('successfully read from db!');
}

function clearDB(message, db) {
    //
    // TODO
    //
    // message.channel.send("DB has been cleared!");
}

function changeWord(message, db, args) {

    //
    // validate & set input 
    //
    if (args.length != 2) {
        message.reply('Invalid usage! Please use following syntax: ~change <old word> <new word>');
        return;
    }
    let oldWord = args[0];
    let newWord = args[1];

    db.run(`UPDATE data SET keyword = ? WHERE keyword = ?`, [newWord, oldWord]);

    message.reply(`Replaced ${oldWord} with ${newWord}!`);
    console.log('replaced word!');
}

//
// client login
//
client.login(process.env.DISCORDJS_BOT_TOKEN);
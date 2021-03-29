require('dotenv').config();

const sqlite = require('sqlite3').verbose();
const { join } = require('bluebird');
const { Client } = require('discord.js');
const fs = require('fs'); 
const { get } = require('http');
const path = require('path');
const client = new Client();
const PREFIX = '~';

client.on('ready', () => {
    // validate login
    console.log(`${client.user.username} has logged in.`);
    // set activity
    client.user.setActivity('Among Us', {
        type: 'PLAYING'
    });
    // prepare sqlite db
    let db = new sqlite.Database('./keywords.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);
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
     let db = new sqlite.Database('./keywords.db', sqlite.OPEN_READWRITE);
     switchCMD(message, CMD_NAME, args, db);
    }    
});

function switchCMD(message, CMD_NAME, args, db) {
    switch (CMD_NAME) {
        case 'add':
            writeIntoFile(args, message, db);
            break;
        case 'read':
            // readDB(message, db);
            break;
        case 'remove':
            clearDB(message, db, args);
            break;  
        case 'change':
            changeWord(message, db, args);
            break;
        case 'join':
            joinVC(message);
            break;        
        default:
            // invalid command
            break;
      }
}

function joinVC(message) {

    // get current vc of member
    var VC = message.member.voice.channel;
    // return if not in vc
    if (!VC) 
        return message.reply('Command only valid in vc!');

    // join members vc
    VC.join()
        .then(connection => {
            // play file
            const dispatcher = connection.play('C:/Users/justi/Documents/Projects/js-filter-bot/example-files/dababy.mp3');
            // leave when finished
            dispatcher.on('finish', end => {VC.leave()});
        })
        .catch(console.error);
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

function readDB(message, db) {
    //
    // WIP 
    //
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

function clearDB(message, db, args) {
    //
    // TODO: clear entire db with specific cmd
    //
    if (args.length != 1) {
        message.reply('Invalid usage! Please use following syntax: ~remove <word>');
        return;
    }

    db.run(`DELETE FROM data WHERE keyword = ?`, [args[0]]);

    message.reply(`Deleted entry ${args[0]} !`);
    console.log('Removed from DB!')
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
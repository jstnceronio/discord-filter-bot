require('dotenv').config();

const sqlite = require('sqlite3').verbose();
const { join } = require('bluebird');
const { Client } = require('discord.js');
const fs = require('fs'); 
const http = require('http');
const path = require('path');
const client = new Client();
const fsExtra = require('fs-extra');
const PREFIX = '~';
var YoutubeMp3Downloader = require("youtube-mp3-downloader");
let filePath;

client.on('ready', () => {

    // validate login
    console.log(`${client.user.username} has logged in.`);
    // set activity
    client.user.setActivity('Among Us', {
        type: 'PLAYING'
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
     // prep db
     let db = new sqlite.Database('./keywords.db', sqlite.OPEN_READWRITE);
     switchCMD(message, CMD_NAME, args, db);
    }    

});

function switchCMD(message, CMD_NAME, args, db) {
    switch (CMD_NAME) {
        case 'add':
            addKeywordToDB(args, message, db);
            grabMP3FromYT(db, args[0], args[1]);
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
            // joinVC(message);
            break;     
        case 'grabMP3':
            grabMP3FromYT(message, args);
            break;
        default:
            // search for keywords
            searchDB(message, CMD_NAME, db);
            break; 
      }
}

function searchDB(message, keyword, db) {

    console.log('Okay looking for ' + keyword);

    let sql = `SELECT audio
           FROM data
           WHERE keyword  = ?`;

    // first row only
    db.get(sql, [keyword], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        
        return row
            ? playFile(message, row.audio)
            : console.log(`No entry found with the keyword ${keyword}`);
    });
    db.close();
}


function playFile(message, url) {
    
    console.log(url);
    // get current vc of member
    var VC = message.member.voice.channel;
    // return if not in vc
    if (!VC) 
        return message.reply('Command only valid in vc!');

    // join members vc
    VC.join()
        .then(connection => {
            // play file
            const dispatcher = connection.play(url);
            // leave when finished
            dispatcher.on('finish', () => {
                VC.leave();
            });
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

/**
 * syntax: ~add <keyword:string> <audio:blob>
 * @param {cmd args} args 
 * @param {users msg info} message 
 * @param {sqlite3 db} db 
 */
function addKeywordToDB(args, message, db) {
      //
      // validate args & data
      // 
      if (args.length != 2) {
        message.reply('Invalid usage! Please use following syntax: ~add <word> <url>');
        return;
      }

      //
      // garner user infos 
      //
      let userid = message.author.id;
      
      //
      // insert data into db
      //
      try {
        db.run(`INSERT INTO data VALUES(?,?,?)`, userid, args[0], "Undefined", function(err) {
            if (err) {
              // keyword propably already exists => keyword unique constraint  
              message.reply(`Keyword ${args[0]} already exists! Please consider changing or removing it!`);
              return console.log(err.message);
            }
            // success!
            console.log('wrote into db! keyword: ' + args[0]);
          });
      } catch (error) {
          // smth whent very south
          console.log(error);
      }  
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
    // validate args
    //
    if (args.length != 1) {
        message.reply('Invalid usage! Please use following syntax: ~remove <word>');
        return;
    }

    //
    // clear entire db with specific cmd
    //
    if (args[0].toLowerCase() == 'all') {
        db.run(`DELETE FROM data`);
        console.log('Removed all from DB!');
        fsExtra.emptyDirSync('./example-files/downloads');
        console.log('Removed all files in downloads!');
        return;
    }
    removeFile(args[0], db);
    db.run(`DELETE FROM data WHERE keyword = ?`, [args[0]]);
    message.reply(`Deleted entry ${args[0]} !`);
    console.log('Removed from DB!');
}

function removeFile(keyword, db) {

    let sql = `SELECT audio
           FROM data
           WHERE keyword  = ?`;

    db.get(sql, [keyword], (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        
        if (row) {
            fs.unlink(row.audio, function (err) {
                if (err) throw err;
                // if no error, file has been deleted successfully
                console.log(`File ${keyword} deleted!`);
            });
        } else {
            console.log(`No entry found with the keyword ${keyword}`);
        }
    });

    
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

function grabMP3FromYT(db, keyword, url) {

    if (url == 'test')
        return;
    
    console.log('grabbing!');

    var YD = new YoutubeMp3Downloader({
        "ffmpegPath": "E:\\ffmpeg\\bin\\ffmpeg.exe",        
        "outputPath": "./example-files/downloads",    
        "youtubeVideoQuality": "highestaudio", 
        "queueParallelism": 2,                 
        "progressTimeout": 2000,               
        "allowWebm": false                    
    });

    YD.download(url, `${url}.mp3`);

    YD.on('finished', function(err, data) {
        console.log('finished!');
        // update db
        updateKeywordWithUrl(db, keyword, data.file);
    });
    YD.on('error', function(error) {
        console.log('error!' + error);
    });
    YD.on('progress', function(progress) {
        console.log('progress!');
    });
}

function updateKeywordWithUrl(db, keyword, url) {
    console.log(url);
    //
    // update keyword with url
    //
    db.run(`UPDATE data SET audio = ? WHERE keyword = ?`, [url, keyword]);
    db.close();
    console.log(`Set ${url} for ${keyword}!`);   
}

//
// client login
//
client.login(process.env.DISCORDJS_BOT_TOKEN);
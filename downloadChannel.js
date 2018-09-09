// Copyright 2018 Fox Council

const fs = require('fs');
const key = require('./key');
const http = require('https');
const readline = require('readline');
const youtubedl = require('youtube-dl');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ytUrl = 'http://www.youtube.com/watch?v=';
const vidDir = './vids';
const initUrl = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&fields=nextPageToken,pageInfo,items/snippet/resourceId/videoId&maxResults=50&playlistId={PLAYLIST_ID}&key="+key.apiKey;
const nextPageUrl = "https://www.googleapis.com/youtube/v3/playlistItems?pageToken={PAGE_TOKEN}&part=snippet&fields=nextPageToken,pageInfo,items/snippet/resourceId/videoId&maxResults=50&playlistId={PLAYLIST_ID}&key="+key.apiKey;

let playlistId = "";

if (!fs.existsSync(vidDir)) {
    fs.mkdirSync(vidDir);
}

function downloadVideo(id, callback) {    
    const parseVid = vidDir + '/' + id + '.mp4';
    const parseInf = vidDir + '/' + id + '.json';
    const parseUrl = ytUrl + id;

    if (fs.existsSync(parseVid)) {
        console.log("   Skipping Video: " + parseVid);
        callback();
        return;
    }
    youtubedl.getInfo(parseUrl, ['--format=18'], function(err, info) {
        if (err) {
            console.log("      Error Video: " + parseVid);
            callback();
            return;
        };
        if (!fs.existsSync(parseInf)) {
            let metadataObj = {
                'title': info.title,
                'runtime': info.duration,
                'thumb': info.thumbnail,
                'desc': info.description
            }
            
            fs.writeFileSync(parseInf, JSON.stringify(metadataObj));
        }

        console.log("Downloading Video: " + parseVid);
        let ytDl = youtubedl(parseUrl, ['--format=18'], { cwd: __dirname });
        ytDl.pipe(fs.createWriteStream(parseVid)).on('finish', callback);
    });
}

function downloadChannel(url) {
    http.get(url, function(res) {
        let body = '';
    
        res.on('data', function(chunk) {
            body += chunk;
        });
    
        res.on('end', function() {
            let responseBody = JSON.parse(body);
            let items = responseBody.items;
            let idx = 0;

            let incrementItems = function() {
                idx++;

                if (idx >= items.length && responseBody.nextPageToken) {
                    downloadChannel(nextPageUrl.replace('{PLAYLIST_ID}', playlistId).replace('{PAGE_TOKEN}', responseBody.nextPageToken));
                } else if (idx >= items.length) {
                    console.log('Complete!');
                    process.abort();
                    return;
                } else {
                    downloadVideo(items[idx].snippet.resourceId.videoId, incrementItems);
                }
            }
            
            downloadVideo(items[idx].snippet.resourceId.videoId, incrementItems);
        });
    }).on('error', function(e){
          console.log("Got an error: ", e);
    });
}

rl.question('Please enter a YouTube playlist ID: ', (plId) => {
    
    playlistId = plId;

    downloadChannel(initUrl.replace('{PLAYLIST_ID}', playlistId));

    rl.close();
});
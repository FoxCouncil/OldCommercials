// Copyright 2018 Fox Council

const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

// Globals
const serverPort = 3000;
const staticsDir = path.join(__dirname, './statics');
const viewsDir = path.join(__dirname, './views');
const vidDir = path.join(__dirname, './vids');

let metadataDb = [];

function compare(a, b) {
    if (a.title < b.title) {
        return -1;
    }

    if (a.title > b.title) {
        return 1;
    }

    return 0;
}

function loadMetadata(q) {
    metadataDb = [];
    fs.readdirSync(vidDir).filter((el) => el.match(/.*\.json/ig)).forEach((el) => {
        let filename = path.join(vidDir, el);
        let data = JSON.parse(fs.readFileSync(filename));

        if (q !== undefined && (!data.desc.toLowerCase().includes(q.toLowerCase()) && !data.title.toLowerCase().includes(q.toLowerCase()))) {
            return;
        }

        data.id = el.split('.')[0];
        metadataDb.push(data);
    });
    
    metadataDb = metadataDb.sort(compare);
}

// view engine
app.set('views', viewsDir);
app.set('view engine', 'pug');

// serve static files
app.use(express.static(staticsDir));
app.use('/vids/', express.static(vidDir));

app.get('/', (req, res) => res.render('index'));

app.get('/api/list', (req, res) => {
    loadMetadata(req.query.q);
    res.json(metadataDb);
});

app.listen(serverPort, () => console.log('Sever listening on port '+serverPort+'!'));
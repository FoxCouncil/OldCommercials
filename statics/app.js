// Copyright 2018 Fox Council

'use strict';

const numberWithCommas = x => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const toMMSS = x => {
    var sec_num = parseInt(x, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
}

const isInViewport = elem => {
    var bounding = elem.getBoundingClientRect();
    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

const hookVideoEvents = target => {
    target.deleting = false;
    let videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.addEventListener('timeupdate', e => {
        if (!target.deleting) {
            target.querySelector('.runtime').innerHTML = '<i class="far fa-clock"></i>&nbsp;' + toMMSS(videoPlayer.currentTime) + '/' + toMMSS(videoPlayer.duration);
        }
    });
    videoPlayer.addEventListener('play', e => {
        if (!target.deleting) {
            target.classList.remove('paused');
            target.querySelector('.buttonPlayStopIcon').classList.remove('fa-stop');
            target.querySelector('.buttonPlayStopIcon').classList.remove('fa-pause');
            target.querySelector('.buttonPlayStopIcon').classList.add('fa-play');
        }
    });
    videoPlayer.addEventListener('pause', e => {
        if (!target.deleting) {
            target.classList.add('paused');
            target.querySelector('.buttonPlayStopIcon').classList.remove('fa-stop');
            target.querySelector('.buttonPlayStopIcon').classList.remove('fa-play');
            target.querySelector('.buttonPlayStopIcon').classList.add('fa-pause');
        }
    });
    videoPlayer.delete = function() {
        target.deleting = true;
        target.querySelector('.buttonPlayStopIcon').classList.add('fa-stop');
        target.querySelector('.buttonPlayStopIcon').classList.remove('fa-play');
        target.querySelector('.buttonPlayStopIcon').classList.remove('fa-pause');
        videoPlayer.remove();
    }
}

const processVids = (vid, count) => {
    let el = document.createElement('div');
    el.classList.add('card');
    el.setAttribute('data-vidurl', '/vids/'+vid.id+'.mp4');
    el.setAttribute('data-thumburl', vid.thumb);

    let controls = document.createElement('div');
    controls.classList.add('controls');
    controls.insertAdjacentHTML('beforeend', '<a class="buttonPlayStop"><i class="buttonPlayStopIcon fas fa-stop"></i></a>');

    el.appendChild(controls);

    let fcControls = document.createElement('div');
    fcControls.classList.add('controls');
    fcControls.classList.add('controls-right');
    // fcControls.classList.add('hidden');
    fcControls.insertAdjacentHTML('beforeend', '<a class="buttonFullscreen"><i class="buttonFullscreenIcon fas fa-arrows-alt"></i></a>');

    el.appendChild(fcControls);

    let title = document.createElement('div')
    title.classList.add('title');
    title.innerText = vid.title;

    el.appendChild(title);

    let runtime = document.createElement('div')
    runtime.classList.add('runtime');
    let runtimeData = vid.runtime.split(':');
    if (runtimeData.length === 1) {
        runtimeData = '00:' + runtimeData[0].padEnd(2, '0');
    } else {
        runtimeData = runtimeData[0].padStart(2, '0') + ':' + runtimeData[1].padStart(2, '0');
    }
    runtime.innerHTML = '<i class="far fa-clock"></i>&nbsp;' + runtimeData;

    el.setAttribute('data-runtime', runtimeData);

    el.appendChild(runtime);

    let desc = document.createElement('div')
    desc.classList.add('desc');
    desc.innerText = vid.desc;

    el.appendChild(desc);

    let img = document.createElement('img');

    if (count > 10) {
        img.classList.add('unloaded');
        img.setAttribute('data-src', vid.thumb);
        img.setAttribute('src', '/loading.png');
    } else {
        img.classList.add('loaded');
        img.setAttribute('src', vid.thumb);
    }
    img.setAttribute('width', '100%');
    img.setAttribute('height', '100%');
    
    el.appendChild(img);

    el.addEventListener('click', (e) => {
        let currentPlayer = e.currentTarget.querySelector('#videoPlayer');
        let oldPlayer = document.getElementById('videoPlayer');

        if (oldPlayer !== null && currentPlayer === oldPlayer)
        {
            if (currentPlayer.paused === false) {
                currentPlayer.pause();
            } else if (currentPlayer.paused === true) {
                currentPlayer.play();
            }
            return;
        }

        if (oldPlayer != null) {
            oldPlayer.delete();
        }
        
        Array.prototype.slice.call(document.getElementsByTagName('img')).forEach((imgEl) => { imgEl.classList.remove('hidden'); });

        let playingCard = document.querySelector('div.card.playing');        
        if (playingCard != null) {
            playingCard.querySelector('.runtime').innerHTML = '<i class="far fa-clock"></i>&nbsp;' + playingCard.getAttribute('data-runtime');
            playingCard.classList.remove('playing');
        }

        if (!img.classList.contains('hidden')) {
            img.classList.add('hidden');
            el.insertAdjacentHTML('beforeend', '<video id="videoPlayer" width="640" height="480" poster="'+vid.thumb+'" autoplay><source src="'+el.getAttribute('data-vidurl')+'"></video>');
            el.classList.add('playing');
            currentPlayer = e.currentTarget.querySelector('#videoPlayer');
            videoObserver.disconnect();
            videoObserver.observe(el);
            el.querySelector('.buttonFullscreen').addEventListener('click', e => {
                currentPlayer.web();
                e.preventDefault();
                e.stopPropagation();
            });
            hookVideoEvents(el);
        }
    });

    el.addEventListener('mouseover', (e) => {
        el.classList.add('hover');
    });

    el.addEventListener('mouseout', (e) => {
        el.classList.remove('hover');
    });

    return el;
}

const processHtml = data => {
    let frag = document.createDocumentFragment();
    let count = 0;
    data.forEach(vid => {
        frag.appendChild(processVids(vid, count));
        count++;
    });
    document.getElementById('videoCountDisplay').children[0].innerText = numberWithCommas(count);
    document.getElementById('list').innerHTML = '';
    if (frag.childElementCount === 0) {
        document.getElementById('list').innerHTML = '<h2 class="center">No Videos Found!</h2>';
    } else {
        document.getElementById('list').appendChild(frag);
    }
};

const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.intersectionRatio > 0) {
            entry.target.querySelector('#videoPlayer').classList.remove('pip');
        } else {
            entry.target.querySelector('#videoPlayer').classList.add('pip');
        }
    });
});

const imageLoaderObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.intersectionRatio > 0) {
            entry.target.setAttribute('src', entry.target.getAttribute('data-src'));
            entry.target.classList.remove('unloaded');
            entry.target.classList.add('loaded');
            entry.target.removeAttribute('data-src');
            imageLoaderObserver.unobserve(entry.target);
        }
    });
});

const observerLoader = () => {
    imageLoaderObserver.disconnect();
    document.querySelectorAll('img[data-src]').forEach(image => { imageLoaderObserver.observe(image); });
}

const fetchAllVids = () => fetch('/api/list').then(res => res.json()).then(processHtml).then(observerLoader);

const fetchSearchVids = (q) => fetch('/api/list?q='+encodeURIComponent(q)).then(res => res.json()).then(processHtml).then(observerLoader);

const getJogValue = event => { if (event.shiftKey) return 10; else if (event.ctrlKey) return 100; else return 1 }

(() => {
    fetchAllVids();
    document.addEventListener('keydown', e => {
        switch (e.keyCode) {
            case 37: case 39: case 32: {
                const vidPlayer = document.getElementById('videoPlayer');
                if (videoPlayer !== null) {
                    if (e.keyCode === 32) {
                        if (videoPlayer.paused) {
                            videoPlayer.play();
                        } else if (!videoPlayer.paused) {
                            videoPlayer.pause();
                        }
                    } else if (e.keyCode === 37) {
                        videoPlayer.currentTime = parseInt(videoPlayer.currentTime) - getJogValue(e);
                    } else if (e.keyCode === 39) {
                        videoPlayer.currentTime = parseInt(videoPlayer.currentTime) + getJogValue(e);
                    }
                }
            }
            break;

            default:
            {
                return;
            }

        }
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
    });
    document.getElementById('searchBar').addEventListener('input', e => {
        let q = e.target.value;
        if (q === '') {
            fetchAllVids();
        } else {
            fetchSearchVids(q);
        }
    })
})();